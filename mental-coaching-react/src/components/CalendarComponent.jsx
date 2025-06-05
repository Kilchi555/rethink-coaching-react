// src/components/CalendarComponent.jsx
import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from "react-datepicker";
import de from 'date-fns/locale/de';
registerLocale('de', de);


const CalendarComponent = ({ setIsCalendarModalOpen, user, onEventClick }) => {
  const calendarRef = useRef(null);

  const [calendarTitle, setCalendarTitle] = useState('');
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [newEventDateTime, setNewEventDateTime] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState(60); // Standarddauer
  const [newEventDate, setNewEventDate] = useState('');

  const [newEventTitle, setNewEventTitle] = useState(''); // Thema
  const [newEventLocation, setNewEventLocation] = useState('');
  const [events, setEvents] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const [newEventDuration, setNewEventDuration] = useState(60); // in Minuten


  useEffect(() => {
    fetchEvents();
  }, []);

  const toDatetimeLocal = (isoString) => {
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); // Zeitzone korrigieren
    return date.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
  };  

  const handleSelect = (info) => {
    console.log('🟢 handleSelect ausgeführt:', info); 
    setNewEventDateTime(new Date(info.startStr)); // direktes Date-Objekt für DatePicker
    setNewEventDate(info.startStr.slice(0, 10)); // "YYYY-MM-DD"
    setNewEventModalOpen(true);
  };

  const handleSaveAppointment = async () => {
    const errors = {};

        // 🔒 Staff muss Kunden auswählen
        if (user.role === 'staff' && !selectedCustomerId) {
          errors.customer = 'Bitte einen Kunden auswählen.';
        }

        if (!newEventDateTime) {
          errors.time = 'Bitte Startdatum und Uhrzeit wählen.';
        }

        if (!newEventTitle.trim()) {
          errors.title = 'Thema ist erforderlich.';
        }

        if (!newEventLocation.trim()) {
          errors.location = 'Ort ist erforderlich.';
        }

        if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          return;
        }

  
    setFormErrors({});
  
    const start = newEventDateTime;
    const end = new Date(start.getTime() + durationMinutes * 60000);
  
    try {
      const payload = {
        title: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        thema: newEventTitle,
        location: newEventLocation,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        user_id: user.role === 'staff' ? selectedCustomerId : user.id, // 👈 korrekt
      };
           
  
      console.log('📤 Sende Buchung:', payload);
  
      const response = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        setFormErrors({ server: errorData.error || 'Fehler beim Speichern.' });
        return;
      }
  
      await fetchEvents();
      alert("✅ Termin erfolgreich gebucht.");
  
      // Felder zurücksetzen
      setNewEventTitle('');
      setNewEventLocation('');
      setNewEventDateTime(null);
      setDurationMinutes(60);
      setNewEventModalOpen(false);
  
    } catch (err) {
      console.error('Fehler beim Speichern des Termins:', err);
      setFormErrors({ server: 'Netzwerkfehler beim Speichern des Termins.' });
    }
  };

  const handleDatesSet = (arg) => {
    setCalendarTitle(arg.view.title);
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/future-appointments', {
        credentials: 'include',
      });
  
      if (!res.ok) {
        console.error('Fehler beim Abrufen der Termine:', await res.text());
        return;
      }
  
      const data = await res.json();
      console.log('📡 FULL API-RESPONSE:', data);         // <- API vollständig
      console.log('📦 listData Dump:', data.listData);     // <- Liste der rohen Termine
  
      const eventsFromBackend = data.listData.map((appointment) => {
        const props = {
          first_name: appointment.customer_first_name,
          last_name: appointment.customer_last_name,
          thema: appointment.title,
          location: appointment.location
        };
      
        console.log('🧠 extendedProps:', props);
      
        return {
          title: `${appointment.customer_first_name ?? ''} ${appointment.customer_last_name ?? ''}`.trim() || appointment.customer_email,
          start: appointment.start_time,
          end: appointment.end_time,
          extendedProps: props
        };
      });
      
      
          
  
      setEvents(eventsFromBackend);
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error);
    }
  };
  
  
  // Initialisiere den Kalender mit Terminen
  return (
    <div id="calendar-modal" className="modal">
      <div className="modal-content">
        <span className="close-button" onClick={() => setIsCalendarModalOpen(false)}>&times;</span>
        <h2>{calendarTitle}</h2>
        
        {/* Die Buttons direkt hier */}
        <div className="calendar-toolbar">
          <button onClick={handleSaveChanges} disabled={!hasChanges}>
            💾 Änderungen speichern
          </button>
          <button onClick={handleReset} disabled={!hasChanges}>
            ↩️ Rückgängig
          </button>
          <p>📋 Klick auf Termin = kopieren → dann auf Kalenderdatum klicken zum Einfügen</p>
        </div>

        <div className="calendar-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale={deLocale}
              timeZone="local"
              height="auto"
              stickyHeaderDates={true}
              headerToolbar={{ left: '', center: 'prev,next today', right: '' }}
              selectable={true}
              editable={true}
              selectMirror={true}
              select={handleSelect}
              datesSet={handleDatesSet}
              events={events}
              eventClick={onEventClick}
              eventDrop={onEventDrop}
              dateClick={onDateClick}
              dayHeaderContent={(arg) => {
                const date = arg.date;
                const day = date.getDate().toString().padStart(2, '0');
                const weekday = date.toLocaleDateString('de-CH', {
                  weekday: 'short',
                });
                return `${weekday} ${day}`; // z. B. "Mo 02"
              }}
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                hour12: false,
              }}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              eventContent={(arg) => {
                const { first_name, last_name, thema, location } = arg.event.extendedProps;
                const fullName = [first_name, last_name].filter(Boolean).join(' ');
                return (
                  <div className="fc-event-custom">
                    <div className="event-name">{fullName || 'Termin'}</div>
                    {location && <div className="event-subline">📍 {location}</div>}
                  </div>
                );
              }}
            />
          </div>

        {newEventModalOpen && (
            <div className="calendar-modal-overlay">
                <div className="calendar-form">
                  <h3>Neuen Termin erstellen</h3>

                        {/* ⛑️ Kundenwahl nur für Mitarbeitende */}
                        {user?.role === 'staff' && (
                          <>
                            <label htmlFor="customer-select">👤 Kunde wählen:</label>
                            <select
                              id="customer-select"
                              className="calendar-input"
                              value={selectedCustomerId}
                              onChange={(e) => setSelectedCustomerId(e.target.value)}
                            >
                              <option value="">-- Bitte auswählen --</option>
                              {allCustomers.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.first_name} {c.last_name} ({c.email})
                                </option>
                              ))}
                            </select>
                            {formErrors.customer && <p className="error-text">{formErrors.customer}</p>}
                          </>
                        )}

                  {/* Kunde */}
                  <label>Kunde:</label>
                  <input
                    className="calendar-input"
                    value={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user.email}
                    disabled
                  />

                  {/* Thema */}
                  <label>Thema:</label>
                  <input
                    className="calendar-input"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="z. B. Stressmanagement"
                  />
                  {formErrors.title && <p className="error-text">{formErrors.title}</p>}

                  {/* Ort */}
                  <label>Ort:</label>
                  <select
                    className="calendar-input"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                  >
                    <option value="">-- Bitte wählen --</option>
                    <option value="Zürich-Altstetten">Zürich-Altstetten</option>
                    <option value="Zoom Online Meeting">Zoom Online Meeting</option>
                    <option value="Telefonisches Coaching">Telefonisches Coaching</option>
                  </select>
                  {formErrors.location && <p className="error-text">{formErrors.location}</p>}

                  {/* Datum */}
                  <label>Datum:</label>
                  <input
                    type="date"
                    className="calendar-input"
                    value={newEventDate || (newEventDateTime ? newEventDateTime.toISOString().slice(0, 10) : '')}
                    onChange={(e) => setNewEventDate(e.target.value)}
                  />
                  {formErrors.date && <p className="error-text">{formErrors.date}</p>}

                  {/* Uhrzeit */}
                  <label>Startzeit:</label>
                  <DatePicker
                    selected={newEventDateTime}
                    onChange={(date) => setNewEventDateTime(date)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Startzeit"
                    dateFormat="HH:mm"
                    timeFormat="HH:mm"              // ✅ Wichtig! Verhindert AM/PM
                    className="calendar-input"
                    placeholderText="Zeit auswählen"
                    locale="de"
                  />

                  {/* Dauer */}
                  <label>Dauer:</label>
                  <select
                    className="calendar-input"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  >
                    <option value={30}>30 Minuten</option>
                    <option value={45}>45 Minuten</option>
                    <option value={60}>60 Minuten</option>
                    <option value={90}>90 Minuten</option>
                  </select>

                  {/* Buttons */}
                  <div className="button-row">
                    <button onClick={handleSaveAppointment}>Speichern</button>
                    <button
                      onClick={() => {
                        setNewEventModalOpen(false);
                        setFormErrors({});
                      }}
                      className="cancel-button"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
        )}
      </div>
    </div>
  );
};

export default CalendarComponent;
