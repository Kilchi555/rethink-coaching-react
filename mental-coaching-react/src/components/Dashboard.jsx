// src/components/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Importiere den useAppointments Hook, falls er weiterhin direkt verwendet wird
// Oder entferne ihn, wenn die Termine vollständig aus dem AuthContext bezogen werden.
// Basierend auf Ihrer Anforderung im StaffDashboard, belassen wir ihn hier.
import { useAppointments } from '../hooks/useAppointments'; 

import './Dashboard.css'; 
import CalendarComponent from './CalendarComponent'; // Stellen Sie sicher, dass dies existiert und korrekt ist.

// --- Hilfskomponenten ---
const LoadingSpinner = ({ message }) => (
  <div className="loading">
    <div className="spinner"></div>
    <span>{message || "Lädt Daten..."}</span>
  </div>
);

const NoteFormattingButtons = ({ editorId }) => {
  const formatText = (command, value = null) => {
    const editor = document.getElementById(editorId);
    if (editor) {
      editor.focus();
      document.execCommand(command, false, value);
    }
  };

  return (
    <div className="note-formatting-buttons">
      <button onClick={() => formatText('bold')}>B</button>
      <button onClick={() => formatText('italic')}>I</button>
      <button onClick={() => formatText('underline')}>U</button>
      <button onClick={() => formatText('fontSize', '1')}>XS</button>
      <button onClick={() => formatText('fontSize', '3')}>M</button>
      <button onClick={() => formatText('fontSize', '5')}>XL</button>
    </div>
  );
};

// --- Hauptkomponente: Dashboard ---
const Dashboard = () => {
  // Destrukturieren aus AuthContext: 'loading' wird in 'authLoading' umbenannt.
  const { user, loading: authLoading, logout, isLoggedIn, futureAppointments, pastAppointments, fetchAppointments } = useAuth();
  const navigate = useNavigate();

  // Lokale Zustände für spezifische Dashboard-Ansichten/Funktionen
  const [dashboardError, setDashboardError] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [employeeStats, setEmployeeStats] = useState(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(false);
  // isCustomerLoading wird nicht mehr direkt in Dashboard verwendet, da Termine aus AuthContext kommen.
  // const [isCustomerLoading, setIsCustomerLoading] = useState(false); 
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // States für Modale
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isAppointmentDetailsModalOpen, setIsAppointmentDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null); // Für Details-Modal

  // State und Ref für Notizbearbeitung
  const [editingNoteIds, setEditingNoteIds] = useState({});
  const [expandedAppointmentIds, setExpandedAppointmentIds] = useState({});
  const clientNoteEditorRef = useRef({}); // Verwende ein Objekt, um Refs für mehrere Editoren zu speichern

  // State für "Notiz gespeichert" Meldung
  const [showNoteSavedMessage, setShowNoteSavedMessage] = useState(false);
  const noteSavedTimeoutRef = useRef(null); // Für den Timeout-Handler

  // FullCalendar Ref
  const calendarRef = useRef(null);
  const calendarTitleRef = useRef(null); // Für den Kalendertitel im Modal

  // States für Event-Erstellung/Bearbeitung im Kalender (wenn Staff/Admin)
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [isEditingExistingEvent, setIsEditingExistingEvent] = useState(false); 
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');

  // Kalender-spezifische Zustände: 'appointments' hier ist für den Kalender-Drag-and-Drop
  // und sollte von den 'futureAppointments' aus dem AuthContext initialisiert werden.
  // Der Name 'calendarAppointments' wird verwendet, um Kollisionen zu vermeiden.
  const [calendarAppointments, setCalendarAppointments] = useState([]);
  const [copiedAppointment, setCopiedAppointment] = useState(null);
  const [originalCalendarAppointments, setOriginalCalendarAppointments] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Der useAppointments Hook für Staff/Admin Dashboards.
  // Wichtig: Hier wird der 'appointments' Name des Hooks verwendet, aber da wir oben
  // 'calendarAppointments' haben, ist das in Ordnung.
  // Die loading/error Zustände werden hier abgegriffen.
  const { appointments: staffDashboardAppointments, loading: appointmentsLoading, error: appointmentsError } = useAppointments(user?.role || 'staff', true); 
  //                                                              ^^^^^^^^^^^^        ^^^^^^^^^^^^^

  // useEffect zur Initialisierung der Kalender-Termine aus dem AuthContext
  useEffect(() => {
    // Stellen Sie sicher, dass futureAppointments aus dem AuthContext geladen sind und nicht leer sind,
    // bevor Sie sie in calendarAppointments kopieren.
    if (!authLoading && futureAppointments.length > 0 && JSON.stringify(futureAppointments) !== JSON.stringify(originalCalendarAppointments)) {
      setCalendarAppointments(futureAppointments);
      setOriginalCalendarAppointments(futureAppointments); // Original für Reset/Vergleich setzen
    }
    // Wenn es sich um einen Staff-Benutzer handelt und der useAppointments-Hook Daten geliefert hat,
    // können diese als Quelle für den Kalender verwendet werden, falls die AuthContext-Termine
    // nicht spezifisch genug sind (z.B. wenn useAppointments Filter anwendet).
    // Ansonsten reicht es, sich auf die futureAppointments aus dem AuthContext zu verlassen.
    // Für StaffDashboard belassen wir den Hook.
    if (user?.role === 'staff' && !appointmentsLoading && staffDashboardAppointments.length > 0 && JSON.stringify(staffDashboardAppointments) !== JSON.stringify(originalCalendarAppointments)) {
       setCalendarAppointments(staffDashboardAppointments);
       setOriginalCalendarAppointments(staffDashboardAppointments);
    }

  }, [authLoading, futureAppointments, staffDashboardAppointments, appointmentsLoading, user?.role, originalCalendarAppointments]);


  // --- useEffect für Authentifizierung und Datenabruf (Rollen-spezifisch) ---
  useEffect(() => {
    if (authLoading) return; // Warten, bis AuthContext geladen ist

    if (!isLoggedIn) {
      console.log('Dashboard: Benutzer nicht angemeldet. Leite zum Login weiter.');
      navigate('/login');
      return;
    }

    const fetchDataForRole = async () => {
      setDashboardError(null);
      try {
        if (user?.role === 'staff') {
          await fetchEmployeeStatistics();
          // Zusätzliche Kundenliste für Staff
          const customersRes = await fetch('/api/all-customers', { credentials: 'include' });
          if (!customersRes.ok) throw new Error('Fehler beim Laden der Kunden');
          const customersData = await customersRes.json();
          setAllCustomers(customersData);
        } else if (user?.role === 'admin') {
          await fetchAdminStatistics();
        }
        // fetchCustomerAppointments wird jetzt durch fetchAppointments im AuthContext abgedeckt
        // und die Daten werden direkt von dort bezogen (futureAppointments, pastAppointments).
      } catch (err) {
        console.error('Fehler beim Laden der Dashboard-spezifischen Daten:', err);
        setDashboardError(err.message);
      }
    };

    if (user && isLoggedIn) {
      fetchDataForRole();
    }

  }, [authLoading, isLoggedIn, user, logout, navigate]); // Abhängigkeiten optimiert


  // --- Logout Funktion ---
  const handleLogout = async () => {
    await logout(); // Nutzt die logout-Funktion aus dem AuthContext
    localStorage.clear();
    navigate('/login');
  };

  // --- Kalender Funktionen ---
  const handleEventDrop = (info) => {
    const id = parseInt(info.event.id);
    const updated = calendarAppointments.map(app =>
      app.id === id
        ? {
            ...app,
            start_time: info.event.start.toISOString(),
            end_time: info.event.end.toISOString(),
          }
        : app
    );
    setCalendarAppointments(updated);
    setHasChanges(true);
  };
  
  const handleSaveChanges = async () => {
    try {
      for (const app of calendarAppointments) {
        const original = originalCalendarAppointments.find(a => a.id === app.id);
        // Prüfen, ob sich Start- oder Endzeit geändert hat
        if (
          !original ||
          original.start_time !== app.start_time ||
          original.end_time !== app.end_time
        ) {
          const response = await fetch(`/api/appointments/${app.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              start_time: app.start_time,
              end_time: app.end_time,
            }),
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fehler beim Speichern der Terminänderung für ID ${app.id}: ${response.status} ${errorText}`);
          }
        }
      }
      alert('Änderungen gespeichert!');
      setOriginalCalendarAppointments(calendarAppointments); // Original aktualisieren
      setHasChanges(false);
      await fetchAppointments(); // Termine im AuthContext aktualisieren
    } catch (err) {
      console.error('Fehler beim Speichern der Kalenderänderungen:', err);
      alert('Fehler beim Speichern: ' + err.message);
    }
  };
  
  const handleReset = () => {
    setCalendarAppointments(originalCalendarAppointments);
    setHasChanges(false);
  };
  
  const handleCopy = (eventId) => {
    const found = calendarAppointments.find(a => a.id === eventId);
    if (found) {
      setCopiedAppointment({
        ...found,
        id: null, // ID muss für neue Termine null sein
        start_time: '', // Muss neu gesetzt werden
        end_time: '', // Muss neu gesetzt werden
      });
      alert('Termin kopiert! Du kannst ihn nun im Kalender einfügen.');
    }
  };
  
  const handleDateClick = (info) => {
    if (!copiedAppointment) {
      // Wenn kein Termin kopiert ist, öffne das Modal für neue Termine
      setNewEventStart(info.date.toISOString().slice(0, 16)); // Voreinstellung für Startzeit
      setNewEventEnd(new Date(info.date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)); // Standard 1 Stunde später
      setIsEditingExistingEvent(false); // NEU
      setNewEventModalOpen(true);
      return;
    }

    // Logik zum Einfügen eines kopierten Termins
    const duration = new Date(copiedAppointment.end_time) - new Date(copiedAppointment.start_time);
    const start = new Date(info.date);
    const end = new Date(start.getTime() + duration);

    const newApp = {
      ...copiedAppointment,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      id: Math.random().toString(36).substr(2, 9) // Temporäre ID für Frontend
    };

    setCalendarAppointments([...calendarAppointments, newApp]);
    setHasChanges(true);
    setCopiedAppointment(null);
  };

  // Erstellen der Event-Objekte für FullCalendar
  const events = calendarAppointments.map((a) => ({
    id: a.id,
    title: a.title || 'Termin',
    start: a.start_time,
    end: a.end_time,
    extendedProps: {
      first_name: a.customer_first_name,
      last_name: a.customer_last_name,
      thema: a.title,
      location: a.location,
    }
  }));
  

  // --- Admin Statistiken ---
  const fetchAdminStatistics = async () => {
    setIsAdminLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/admin/statistics', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) { logout(); return; }
        throw new Error(`Fehler beim Abrufen der Admin-Daten: ${response.statusText}`);
      }
      const data = await response.json();
      setAdminStats(data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Admin-Daten:', error);
      setDashboardError('Fehler beim Laden der Admin-Daten.');
    } finally {
      setIsAdminLoading(false);
    }
  };

  // --- Mitarbeiter Statistiken ---
  const fetchEmployeeStatistics = async () => {
    setIsEmployeeLoading(true);
    try {
      // URL anpassen!
      const response = await fetch('http://localhost:3000/api/staff/statistics', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) { logout(); return; }
        throw new Error(`Fehler beim Abrufen der Mitarbeiter-Daten: ${response.statusText}`);
      }
      const data = await response.json();
      setEmployeeStats(data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Mitarbeiter-Daten:', error);
      setDashboardError('Fehler beim Laden der Mitarbeiter-Daten.');
    } finally {
      setIsEmployeeLoading(false);
    }
  };

  // --- Notizen speichern ---
  const saveNote = async (appointmentId, type) => {
    const noteType = type === 'client' ? 'client_note' : 'staff_note';
    const editorElement = clientNoteEditorRef.current[appointmentId];
    const noteContent = editorElement ? editorElement.innerHTML : '';

    try {
      const response = await fetch(`http://localhost:3000/api/appointment/${appointmentId}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Stellen Sie sicher, dass dies dem Namen der Eigenschaft auf dem Server entspricht
          clientNote: noteContent, // Oder staffNote je nach 'type'
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fehler beim Speichern der ${type} Notiz: ${response.status} ${errorText}`);
      }

      // Aktualisiere den State der Termine im AuthContext, um die Notiz anzuzeigen
      // Dies erfordert, dass AuthContext eine Funktion zum Aktualisieren von Terminen bereitstellt
      // oder wir rufen fetchAppointments() auf, um die Termine neu zu laden.
      await fetchAppointments(); // Lade alle Termine neu, um Notizänderungen anzuzeigen

      // Setze den Bearbeitungsstatus zurück
      setEditingNoteIds(prev => ({ ...prev, [appointmentId]: false }));

      // Zeige die "Notiz gespeichert" Meldung
      setShowNoteSavedMessage(true);
      if (noteSavedTimeoutRef.current) {
        clearTimeout(noteSavedTimeoutRef.current);
      }
      noteSavedTimeoutRef.current = setTimeout(() => {
        setShowNoteSavedMessage(false);
      }, 3000);

    } catch (error) {
      console.error(`Fehler beim Speichern der ${type} Notiz:`, error);
      alert(`Fehler beim Speichern Ihrer ${type} Notiz. Bitte versuchen Sie es erneut. Details: ${error.message}`);
    }
  };


  const handleEventClick = (info) => {
    const event = info.event;
    const { title, start, end, extendedProps } = event;
  
    const fullName =
      (extendedProps.first_name && extendedProps.last_name)
        ? `${extendedProps.first_name} ${extendedProps.last_name}`
        : title || 'Unbekannter Kunde';
  
    const isValidDate = (date) => date instanceof Date && !isNaN(date);
  
    const dateFormatter = new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  
    const timeFormatter = new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  
    const selected = {
      fullName,
      dateFormatted: isValidDate(start) ? dateFormatter.format(start) : 'Unbekanntes Datum',
      timeRange: (isValidDate(start) && isValidDate(end))
        ? `${timeFormatter.format(start)} – ${timeFormatter.format(end)}`
        : 'Unbekannte Zeit',
      location: extendedProps.location || 'Nicht angegeben',
      thema: extendedProps.thema || 'Kein Thema angegeben',
    };
  
    console.log('🧠 selectedAppointment gesetzt:', selected);
  
    setSelectedAppointment(selected);
    setIsAppointmentDetailsModalOpen(true);
  };  
  
  // --- Termin-Item Render Funktion ---
  const renderAppointmentItem = (appointment, type) => {
    const isExpanded = expandedAppointmentIds[appointment.id] === true;
    const isEditing = editingNoteIds[appointment.id] === true;
    const isClientNoteEditable = user?.role === 'customer';
  
    const startDate = new Date(appointment.start_time);
    const durationMinutes = Math.floor((new Date(appointment.end_time) - startDate) / 60000);
  
    const formattedDate = startDate.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  
    const formattedTime = startDate.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  
    const clientNoteContent = appointment.client_note || 'Keine Notiz vorhanden.';
    const staffNoteContent = appointment.staff_note || 'Keine Notiz vorhanden.';
  
    return (
      <div key={appointment.id} className={`appointment-item ${isExpanded ? 'expanded' : ''}`}>
          <div className="appointment-info">
          <div className="info-field">
              <strong style={{ fontSize: '1.1em' }}>
                {appointment.title || 'Termin'}
              </strong>
            </div>
              <div className="info-field">
              <p>🗓️<strong>Datum | Zeit:</strong>{formattedDate} | {formattedTime} Uhr </p>
              </div>
              <div className="info-field">
              <p>🕒 <strong>Dauer:</strong>{durationMinutes} Minuten</p>
              </div>
              <div className="info-field">
              {appointment.location && (
                <p>📍 <strong>Ort:</strong> {appointment.location}</p>
              )}
              </div>
              <div className="info-field">
              {(appointment.staff_first_name || appointment.staff_last_name) && (
                <p>👨‍🏫 <strong>Coach:</strong> {(appointment.staff_first_name || '') + ' ' + (appointment.staff_last_name || '')}</p>
              )}
              </div>
            </div>
  
        <div className="appointment-actions">
          <button
            className="toggle-notes-button"
            onClick={() =>
              setExpandedAppointmentIds(prev => ({
                ...prev,
                [appointment.id]: !isExpanded
              }))
            }
          >
            {isExpanded ? 'Notizen ausblenden' : 'Notizen anzeigen'}
          </button>
        </div>
  
        {isExpanded && (
          <div className="notes-section">
            <div className="note-container">
              <h4>Ihre Notiz:</h4>
              {isClientNoteEditable ? (
                <>
                  <NoteFormattingButtons editorId={`client-note-editor-${appointment.id}`} />
                  <div
                    id={`client-note-editor-${appointment.id}`}
                    ref={(el) => (clientNoteEditorRef.current[appointment.id] = el)}
                    className={`note-editor ${isEditing ? 'editing' : 'view-only'}`}
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    dangerouslySetInnerHTML={{ __html: appointment.client_note || '' }}
                  ></div>
                  <button
                    className="save-note-button"
                    onClick={() => {
                      if (isEditing) {
                        saveNote(appointment.id, 'client');
                      } else {
                        setEditingNoteIds(prev => ({ ...prev, [appointment.id]: true }));
                      }
                    }}
                  >
                    {isEditing ? 'Notiz speichern' : 'Notiz bearbeiten'}
                  </button>
                </>
              ) : (
                <div className="note-text" dangerouslySetInnerHTML={{ __html: clientNoteContent }}></div>
              )}
            </div>
  
            <div className="note-container">
              <h4>Notiz des Mitarbeiters:</h4>
              <div className="note-text" dangerouslySetInnerHTML={{ __html: staffNoteContent }}></div>
            </div>
          </div>
        )}
      </div>
    );
  };  

  const handleDatesSet = (arg) => {
    if (calendarTitleRef.current) {
      calendarTitleRef.current.textContent = arg.view.title;
    }
  };
  
  // Funktion zum Erstellen eines neuen Termins (für Staff/Admin)
  const handleCreateNewEvent = async () => {
    try {
      const payload = {
        title: newEventTitle,
        location: newEventLocation,
        start_time: newEventStart,
        end_time: newEventEnd,
        // Wenn ein Kunde ausgewählt ist, füge dessen ID hinzu
        ...(selectedCustomerId && { user_id: parseInt(selectedCustomerId) }),
        // staff_id sollte automatisch vom Backend gesetzt werden
        // da der Benutzer eingeloggt ist (oder explizit user.id senden)
      };

      const response = await fetch('/api/appointments', { // POST für neue Termine
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Erstellen des Termins');
      }

      setNewEventModalOpen(false);
      // Formularfelder zurücksetzen
      setNewEventTitle('');
      setNewEventLocation('');
      setNewEventStart('');
      setNewEventEnd('');
      setSelectedCustomerId(''); // Auch Kunden-ID zurücksetzen

      await fetchAppointments(); // Termine im AuthContext aktualisieren
      alert('Termin erfolgreich erstellt!');
    } catch (error) {
      console.error('Fehler beim Erstellen des Termins:', error);
      alert('Fehler beim Erstellen des Termins: ' + error.message);
    }
  };

  // Funktion zum Aktualisieren eines bestehenden Termins (für Staff/Admin)
  const handleUpdateExistingEvent = async (eventId) => {
    try {
      const payload = {
        title: newEventTitle,
        location: newEventLocation,
        start_time: newEventStart,
        end_time: newEventEnd,
        ...(selectedCustomerId && { user_id: parseInt(selectedCustomerId) }),
      };

      const response = await fetch(`/api/appointments/${eventId}`, { // PUT für bestehende Termine
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktualisieren des Termins');
      }

      setNewEventModalOpen(false);
      setNewEventTitle('');
      setNewEventLocation('');
      setNewEventStart('');
      setNewEventEnd('');
      setSelectedCustomerId('');

      await fetchAppointments(); // Termine im AuthContext aktualisieren
      alert('Termin erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Termins:', error);
      alert('Fehler beim Aktualisieren des Termins: ' + error.message);
    }
  };


  // --- Render-Logik für Ladezustand und Fehler ---
  if (authLoading) { // 'authLoading' aus AuthContext verwenden
    return <LoadingSpinner message="Lade Dashboard..." />;
  }

  if (!user) {
    // Wenn authLoading false ist und kein Benutzer vorhanden ist,
    // sollte dies durch den isLoggedIn-Check im useEffect abgefangen werden.
    // Dieser Block ist eher ein Fallback.
    return null; 
  }

  if (dashboardError) {
    return (
      <div className="dashboard-error-message">
        <p>Fehler:</p>
        <p>{dashboardError}</p>
        <button onClick={() => navigate('/login')} className="save-note-button">
          Zurück zum Login
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header-Sektion */}
      <header className="dashboard-header">
          <div className="header-left">
              <a href="/">
                <img src="/images/ReThinkCoaching Logo.webp" alt="Logo" className="header-logo" />
              </a>
            </div>
            <div className="header-center">
              <h1>Dashboard</h1>
            </div>
            <div className="header-right">
              <p className="user-email">{user?.email}</p>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
      </header>


      <main>
        {/* Admin-Bereich */}
        {user?.role === 'admin' && (
          <section id="admin-section" className="dashboard-section">
            <h2>Admin-Bereich</h2>
            {isAdminLoading ? (
              <LoadingSpinner message="Lade Admin-Daten..." />
            ) : (
              <p id="admin-statistics">
                {adminStats ? `Gesamtzahl der Nutzer: ${adminStats.totalUsers}` : 'Fehler beim Laden der Admin-Daten.'}
              </p>
            )}
          </section>
        )}

        {/* Mitarbeiter-Bereich */}
        {user?.role === 'staff' && (
            <section id="employee-section" className="dashboard-section">
              <h2>Mitarbeiter-Bereich</h2>

              {isEmployeeLoading ? (
                <LoadingSpinner message="Lade Mitarbeiter-Daten..." />
              ) : (
                <>
                  <p id="employee-statistics">
                    {employeeStats
                      ? `Anzahl der erledigten Sitzungen: ${employeeStats.completedSessions}`
                      : 'Fehler beim Laden der Mitarbeiter-Daten.'}
                  </p>

                  <div className="customer-selection">
                    <label htmlFor="customer-select">👤 Kunde wählen:</label>
                    <select
                      id="customer-select"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="">-- Kunde wählen --</option>
                      {allCustomers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.first_name} {c.last_name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    id="open-calendar-button"
                    className="open-calendar-button"
                    onClick={() => setIsCalendarModalOpen(true)}
                    disabled={!selectedCustomerId}
                  >
                    📅 Termin für Kunde reservieren
                  </button>
                </>
              )}
            </section>
          )}

        {/* Kundenbereich */}
        {user?.role === 'customer' && (
          <section id="customer-section" className="dashboard-section">
            <h2>Kundenbereich</h2>
            <button
              id="open-calendar-button"
              className="open-calendar-button"
              onClick={() => setIsCalendarModalOpen(true)}
            >
              Termin reservieren
            </button>

            <div id="customer-appointments">
              {/* Hier Ladezustand für Termine verwenden */}
              {appointmentsLoading ? ( // <- appointmentsLoading aus useAppointments hook
                <LoadingSpinner message="Lade Ihre Termine..." />
              ) : (
                <>
                  {appointmentsError && <p className="error-message">Fehler beim Laden der Termine: {appointmentsError.message || String(appointmentsError)}</p>}
                  {futureAppointments.length === 0 && pastAppointments.length === 0 ? (
                    <p id="no-appointments-message">Keine Termine gefunden.</p>
                  ) : (
                    <>
                      {futureAppointments.length > 0 && (
                        <div className="appointment-group">
                          <h3>Zukünftige Termine</h3>
                          {futureAppointments.map(app => renderAppointmentItem(app, 'future'))}
                        </div>
                      )}
                      {pastAppointments.length > 0 && (
                        <div className="appointment-group">
                          <h3>Vergangene Termine</h3>
                          {pastAppointments.map(app => renderAppointmentItem(app, 'past'))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Notiz gespeichert Meldung */}
            {showNoteSavedMessage && (
              <div id="note-saved-message">Ihre Notiz wurde gespeichert.</div>
            )}
          </section>
        )}
        

        {/* Calendar Modal */}
        {isCalendarModalOpen && (
          <CalendarComponent 
          setIsCalendarModalOpen={setIsCalendarModalOpen} 
          user={user}   
          onEventClick={(info) => {
            // Wenn der User Staff oder Admin ist und bearbeiten darf
            if (user?.role === 'staff' || user?.role === 'admin') {
              const eventToEdit = calendarAppointments.find(app => app.id === parseInt(info.event.id));
              if (eventToEdit) {
                setNewEventTitle(eventToEdit.title || '');
                setNewEventLocation(eventToEdit.location || '');
                setNewEventStart(eventToEdit.start_time?.slice(0, 16) || '');
                setNewEventEnd(eventToEdit.end_time?.slice(0, 16) || '');
                setSelectedCustomerId(eventToEdit.user_id ? String(eventToEdit.user_id) : ''); // Kunden-ID setzen
                setIsEditingExistingEvent(info.event.id); // Speichern der Event-ID, die bearbeitet wird
                setNewEventModalOpen(true); // Modal öffnen
              }
            } else { // Für Kunden nur Details anzeigen
              handleEventClick(info);
            }
          }}
          selectedCustomerId={selectedCustomerId}
          events={events} // Verwenden Sie 'events', die von 'calendarAppointments' abgeleitet sind
          calendarRef={calendarRef}
          onEventDrop={handleEventDrop}
          onDateClick={handleDateClick}
          // handleSelect ist noch nicht definiert, eventuell fehlt sie
          // handleSelect={handleSelect} 
          handleDatesSet={handleDatesSet}
          />
        )}

      {isAppointmentDetailsModalOpen && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📅 Termin-Details</h3>
            <p><strong>Kunde:</strong> {selectedAppointment.fullName}</p>
            <p><strong>Datum:</strong> {selectedAppointment.dateFormatted}</p>
            <p><strong>Zeit:</strong> {selectedAppointment.timeRange}</p>
            <p><strong>Ort:</strong> {selectedAppointment.location}</p>
            <p><strong>Thema:</strong> {selectedAppointment.thema}</p>
            <div className="button-row">
              <button onClick={() => setIsAppointmentDetailsModalOpen(false)}>Schliessen</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal zum Erstellen/Bearbeiten von Terminen (für Staff/Admin) */}
      {newEventModalOpen && (user?.role === 'staff' || user?.role === 'admin') && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditingExistingEvent ? 'Termin bearbeiten' : 'Neuen Termin erstellen'}</h3>
            {user?.role === 'staff' && ( // Kunde kann nur vom Staff/Admin ausgewählt werden
              <div className="form-group">
                <label htmlFor="modal-customer-select">Kunde:</label>
                <select
                  id="modal-customer-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                >
                  <option value="">-- Kunden auswählen --</option>
                  {allCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="modal-title">Titel:</label>
              <input type="text" id="modal-title" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="modal-location">Ort:</label>
              <input type="text" id="modal-location" value={newEventLocation} onChange={(e) => setNewEventLocation(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="modal-start">Startzeit:</label>
              <input type="datetime-local" id="modal-start" value={newEventStart} onChange={(e) => setNewEventStart(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="modal-end">Endzeit:</label>
              <input type="datetime-local" id="modal-end" value={newEventEnd} onChange={(e) => setNewEventEnd(e.target.value)} required />
            </div>
            <div className="button-row">
              <button onClick={isEditingExistingEvent ? () => handleUpdateExistingEvent(isEditingExistingEvent) : handleCreateNewEvent}>
                {isEditingExistingEvent ? 'Aktualisieren' : 'Erstellen'}
              </button>
              <button onClick={() => setNewEventModalOpen(false)}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}


      {/* Speichern/Zurücksetzen Buttons für Kalenderänderungen */}
      {hasChanges && (user?.role === 'staff' || user?.role === 'admin') && (
        <div className="calendar-action-buttons">
          <button onClick={handleSaveChanges}>Änderungen speichern</button>
          <button onClick={handleReset}>Zurücksetzen</button>
        </div>
      )}

      </main>
    </div>
  );
};

export default Dashboard;