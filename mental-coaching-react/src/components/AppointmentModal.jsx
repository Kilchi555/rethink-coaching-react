import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from "react-datepicker";
import de from 'date-fns/locale/de'; // Import für Deutsch
import { fetchStaffLocations } from '../api/locationService';
registerLocale('de', de); // Deutsch als Standard-Locale registrieren

const AppointmentModal = ({
  isOpen,
  onClose,
  onSave,
  user,
  handleDelete, // ✅ Hier mit reinnehmen
  allclients, // Wird für Staff/Admin benötigt, um Kunden auszuwählen
  initialEventData, // Für Bearbeitung oder Einfügen von kopierten Daten
  selectedDateAndTime, // Für das Vorbesetzen der Zeit bei neuen Terminen oder kopierten
  lastUsedTitle,
  lastUsedLocation,
  lastUsedDuration,
  allStaff,
}) => {
  const [currentEventTitle, setCurrentEventTitle] = useState('');
  const [currentEventLocation, setCurrentEventLocation] = useState('');
  const [currentEventDateTime, setCurrentEventDateTime] = useState(null);
  const [currentDurationMinutes, setCurrentDurationMinutes] = useState(60);
  const [currentSelectedclientId, setCurrentSelectedclientId] = useState(''); // Speichert die ID des ausgewählten Kunden
  const [formErrors, setFormErrors] = useState({});
  const [clientNotes, setclientNotes] = useState([]);
  const [staffNotes, setStaffNotes] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [listOfStaffUsers, setListOfStaffUsers] = useState([]);
  const [orte, setOrte] = useState([]);

  useEffect(() => {
    const ladeOrte = async () => {
      const daten = await fetchStaffLocations();
      setOrte(daten);
    };
  
    ladeOrte();
  }, []);
  

  useEffect(() => {
    if (user?.role === 'client') {
      // Coach-Liste laden
      fetch('/api/staff')
        .then((res) => res.json())
        .then((data) => {
          setListOfStaffUsers(data);
        });
  
      // Standardcoach setzen
      if (user.assigned_staff_id) {
        setSelectedStaffId(String(user.assigned_staff_id));
      }
    }
  }, [user]);
  

  useEffect(() => {
    if (isOpen) {
      setFormErrors({}); // Fehler beim Öffnen zurücksetzen

      if (initialEventData) {
        // BEARBEITUNGSMODUS ODER KOPIERTER TERMIN: Werte aus initialEventData laden
        setCurrentEventTitle(initialEventData.title || '');
        setCurrentEventLocation(initialEventData.location || '');

        // Die Startzeit kommt entweder vom initialEventData (für Bearbeitung eines bestehenden Termins)
        // oder von selectedDateAndTime (für das Einfügen eines kopierten Termins, wo der Nutzer im Kalender geklickt hat)
        setCurrentEventDateTime(initialEventData.start_time ? new Date(initialEventData.start_time) : selectedDateAndTime || null);

        // Dauer: Wenn initialEventData eine durationMinutes hat (z.B. vom Kopieren), diese verwenden.
        // Ansonsten, wenn es ein bestehender Termin ist, die Dauer aus start/end berechnen.
        // Falls keines zutrifft (z.B. initialEventData nur für Titel/Ort genutzt, aber keine Dauer), dann lastUsedDuration.
        const duration = initialEventData.durationMinutes
          ? initialEventData.durationMinutes
          : (initialEventData.start_time && initialEventData.end_time
            ? Math.floor((new Date(initialEventData.end_time).getTime() - new Date(initialEventData.start_time).getTime()) / 60000)
            : lastUsedDuration);
        setCurrentDurationMinutes(duration || 60); // Standardwert 60, falls alles andere fehlschlägt

        // Kunden-ID: Wenn Staff/Admin, kann der Kunde des initialen Termins vorselektiert werden.
        // Wenn Kunde, dann ist es immer die eigene ID (oder leer, wenn initialEventData keine user_id hat).
        if (user?.role === 'staff' || user?.role === 'admin') {
          setCurrentSelectedclientId(String(initialEventData.user_id) || '');
        } else {
          // Für Kunden sollte die eigene ID sein, wenn der Termin für sie selbst ist.
          // In diesem Modal bucht der Kunde immer für sich selbst, daher setzen wir die eigene ID.
          setCurrentSelectedclientId(String(user?.id) || '');
        }

      } else {
        // NEUER TERMIN-MODUS (KEIN KOPIERTER ODER ZUM BEARBEITEN): Werte aus selectedDateAndTime und "Zuletzt verwendet" laden
        setCurrentEventTitle(lastUsedTitle);
        setCurrentEventLocation(lastUsedLocation);
        setCurrentDurationMinutes(lastUsedDuration || 60); // Standard 60, falls lastUsedDuration nicht gesetzt
        setCurrentEventDateTime(selectedDateAndTime || null);
        // Bei neuem Termin: Staff/Admin wählt Kunde aus, Kunde bucht für sich selbst.
        setCurrentSelectedclientId(String(user?.role === 'client' ? user.id : '') || '');
      }

      // Fetch notes when the modal opens
      const fetchNotes = async () => {
        try {
          // **Bitte ersetzen Sie diese URLs durch die tatsächlichen API-Endpunkte**
          const clientNotesResult = await fetch(`/api/client-notes/${initialEventData?.id || ''}`);
          const staffNotesResult = await fetch(`/api/staff-notes/${initialEventData?.id || ''}`);

          const clientNotesData = await clientNotesResult.json();
          const staffNotesData = await staffNotesResult.json();

          setclientNotes(clientNotesData);
          setStaffNotes(staffNotesData);
        } catch (error) {
          console.error('Fehler beim Abrufen der Notizen:', error);
          // Hier können Sie eine Fehlermeldung für den Benutzer anzeigen
        }
      };

      if (initialEventData?.id) {
        fetchNotes();
      }

      if (user?.role === 'client') {
        // Setze Default-Staff (z. B. vom letzten Mal oder vom Server)
        setSelectedStaffId(
          initialEventData?.staff_id ||
          user?.assigned_staff_id ||
          ''
        );              }
      
    }
  }, [
    isOpen,
    initialEventData,
    selectedDateAndTime,
    lastUsedTitle,
    lastUsedLocation,
    lastUsedDuration,
    user // user ist jetzt eine Abhängigkeit für die Rollen-Logik
  ]);

  if (!isOpen) return null; // Modal nicht rendern, wenn es nicht geöffnet ist

  const handleInternalSave = () => {
    const errors = {};

    if (user.role === 'client' && !selectedStaffId) {
      errors.staff = 'Bitte einen Coach auswählen.';
    }    

    // Validierung
    // Nur Staff/Admin müssen einen Kunden auswählen, wenn es nicht ihr eigener Termin ist.
    // Kunden buchen immer für sich selbst, ihre ID ist fest.
    if ((user.role === 'staff' || user.role === 'admin') && !currentSelectedclientId) {
      errors.client = 'Bitte einen Kunden auswählen.';
    }

    if (!currentEventDateTime) {
      errors.time = 'Bitte Startdatum und Uhrzeit wählen.';
    }
    if (!currentEventTitle.trim()) {
      errors.title = 'Thema ist erforderlich.';
    }
    if (!currentEventLocation.trim()) {
      errors.location = 'Ort ist erforderlich.';
    }
    if (currentDurationMinutes <= 0) {
      errors.duration = 'Dauer muss positiv sein.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({}); // Fehler zurücksetzen, wenn Validierung erfolgreich

    // Die user_id, die an die onSave-Funktion (und damit an das Backend) übergeben wird,
    // hängt von der Rolle ab.
    const clientIdToSend = user?.role === 'client' ? user.id : currentSelectedclientId;

    onSave({
      id: initialEventData?.id, // ID nur übergeben, wenn es ein bestehender Termin ist (Bearbeitungsmodus)
      title: currentEventTitle,
      location: currentEventLocation,
      start_time: currentEventDateTime.toISOString(),
      // Endzeit basierend auf Startzeit und Dauer berechnen
      end_time: new Date(currentEventDateTime.getTime() + currentDurationMinutes * 60000).toISOString(),
      user_id: clientIdToSend,
      staff_id: parseInt(selectedStaffId, 10), // ✅ Fix hier
    });
  };

  // Hilfsfunktion zur Formatierung des Datums für den DatePicker
  const filterPassedTime = (time) => {
    const currentDate = new Date();
    const selectedDate = new Date(currentEventDateTime);

    if (selectedDate.toDateString() === currentDate.toDateString()) {
      return time.getTime() > currentDate.getTime();
    }
    return true;
  };

  return (
    <div className="calendar-modal-overlay"> {/* Dies ist das Modal-Overlay, das über allem liegt */}
      <div className="calendar-form"> {/* Dies ist der eigentliche Modal-Inhalt */}
        <h3>
          {initialEventData?.id
            ? 'Termin bearbeiten'
            : (initialEventData
              ? 'Termin einfügen (kopiert)' // Wenn initialEventData, aber keine ID (kopiert)
              : 'Neuen Termin erstellen' // Wenn kein initialEventData (ganz neu)
            )
          }
        </h3>

        {/* Kunden-Auswahl nur für Staff/Admin */}
        {(user?.role === 'staff' || user?.role === 'admin') && (
          <>
            <label htmlFor="client-select">👤 Kunde wählen:</label>
            <select
              id="client-select"
              className="calendar-input"
              value={currentSelectedclientId}
              onChange={(e) => setCurrentSelectedclientId(e.target.value)}
            >
              <option value="">-- Bitte auswählen --</option>
              {allclients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.email})
                </option>
              ))}
            </select>
            {formErrors.client && <p className="error-text">{formErrors.client}</p>}
          </>
        )}

        {/* Kunden-Feld (read-only für Kunden oder wenn Staff für sich selbst bucht und nicht ausgewählt) */}
        {user?.role === 'client' && ( // Für Kunden immer den eigenen Namen anzeigen
          <>
            <label>Kunde:</label>
            <input
              className="calendar-input"
              value={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'Unbekannt'}
              disabled // Immer disabled für Kunden
            />
          </>
        )}

          {user?.role === 'client' && !user.assigned_staff_id && (
            <>
              <label htmlFor="select-coach">Coach wählen:</label>
              <select
                id="select-coach"
                className="calendar-input"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                <option value="">-- Bitte auswählen --</option>
                {(listOfStaffUsers || []).map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.first_name} {staff.last_name}
                  </option>
                ))}
              </select>
              {formErrors.staff && <p className="error-text">{formErrors.staff}</p>}
            </>
          )}



        <label htmlFor="event-title">📚 Thema: </label>
        <input
          type="text"
          id="event-title"
          className="calendar-input"
          value={currentEventTitle}
          onChange={(e) => setCurrentEventTitle(e.target.value)}
        />
        {formErrors.title && <p className="error-text">{formErrors.title}</p>}

        <label htmlFor="event-location">📍 Ort: </label>
        <select
          id="event-location"
          className="calendar-input"
          value={currentEventLocation}
          onChange={(e) => setCurrentEventLocation(e.target.value)}
        >
          <option value="">-- Bitte auswählen --</option>
          {orte.map((ort) => (
            <option key={ort.id} value={ort.location}>
              {ort.location}
            </option>
          ))}
        </select>
        {formErrors.location && <p className="error-text">{formErrors.location}</p>}


        <label htmlFor="event-datetime">🗓️ Datum & Zeit: </label>
        <DatePicker
          selected={currentEventDateTime}
          onChange={(date) => setCurrentEventDateTime(date)}
          showTimeSelect
          dateFormat="dd.MM.yyyy HH:mm"
          timeFormat="HH:mm"
          timeIntervals={15}
          minDate={new Date()} // Termine nicht in der Vergangenheit buchen
          filterTime={filterPassedTime} // Verhindert die Auswahl vergangener Zeiten am heutigen Tag
          locale="de" // Deutsch als Locale verwenden
          className="calendar-input"
          id="event-datetime"
        />
        {formErrors.time && <p className="error-text">{formErrors.time}</p>}

        <label htmlFor="event-duration">⏱️ Dauer (Minuten): </label>
        <input
          type="number"
          id="event-duration"
          className="calendar-input"
          value={currentDurationMinutes}
          onChange={(e) => setCurrentDurationMinutes(Number(e.target.value))}
          min="15" // Mindestdauer von 15 Minuten
          step="15" // In 15-Minuten-Schritten
        />
        {formErrors.duration && <p className="error-text">{formErrors.duration}</p>}

        <div className="button-row">
          <button onClick={handleInternalSave}>Speichern</button>
          <button onClick={onClose} className="cancel-button">Abbrechen</button>
          
          {/* Nur anzeigen, wenn ein bestehender Termin editiert wird */}
          {initialEventData?.id && (
              <button
              onClick={() => {
                onClose(); // Modal schließen
                setTimeout(() => {
                  handleDelete(initialEventData); // Nur hier wird handleDelete aufgerufen (inkl. Confirm-Logik)
                }, 150);
              }}
              className="delete-button"
              style={{
                backgroundColor: '#e53935',
                color: '#fff',
                marginLeft: 'auto',
              }}
            >
              Löschen
            </button>
            

          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;