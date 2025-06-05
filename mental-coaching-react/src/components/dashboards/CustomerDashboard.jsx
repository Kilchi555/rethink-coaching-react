// src/components/Dashboard.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css'; 
import CalendarComponent from '../CalendarComponent';
import { AuthContext } from '../../context/AuthContext';



// Eine kleine Hilfskomponente für den Spinner
const LoadingSpinner = ({ message }) => (
  <div className="loading">
    <div className="spinner"></div>
    <span>{message || "Lädt Daten..."}</span>
  </div>
);

// Hilfskomponente für die Notizen-Formatierungsbuttons (sehr vereinfacht für den Anfang)
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



const Dashboard = () => {
  const { user, loading, logout, isLoggedIn } = useAuth(); // 👍 korrekt
  const navigate = useNavigate();
  const [futureAppointments, setFutureAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [dashboardError, setDashboardError] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [employeeStats, setEmployeeStats] = useState(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(false);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
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

  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [isEditingExistingEvent, setIsEditingExistingEvent] = useState(false); // NEU
  
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  


  // --- useEffect für Authentifizierung und Datenabruf ---
  useEffect(() => {
    if (loading) return;

    if (!isLoggedIn) {
      console.log('Dashboard: Benutzer nicht angemeldet. Leite zum Login weiter.');
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setDashboardError(null);
      try {
        if (user?.role === 'customer') {
          await fetchCustomerAppointments();
        } else if (user?.role === 'staff') {
          await fetchEmployeeStatistics();
        } else if (user?.role === 'admin') {
          await fetchAdminStatistics();
        }
      } catch (err) {
        console.error('Fehler beim Laden der Dashboard-Daten:', err);
        setDashboardError(err.message);
      }
    };

    if (user && isLoggedIn) {
      fetchData();
  
      if (user?.role === 'staff') {
        fetch('/api/all-customers', { credentials: 'include' })
          .then(res => res.json())
          .then(setAllCustomers)
          .catch(err => console.error('❌ Fehler beim Laden der Kunden:', err));
      }
    }
  }, [loading, isLoggedIn, user, logout, navigate]); // Abhängigkeiten optimiert


  // --- Logout Funktion ---
  const handleLogout = async () => {
    await logout(); // Nutzt die logout-Funktion aus dem AuthContext
    localStorage.clear();
    navigate('/login');
  };

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
      const response = await fetch('http://localhost:3000/api/employee/statistics', { credentials: 'include' });
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

  // --- Kunden-Termine abrufen und gruppieren ---
  const fetchCustomerAppointments = async () => {
    setIsCustomerLoading(true);
    try {
      const [pastResponse, futureResponse] = await Promise.all([
        fetch('http://localhost:3000/api/past-appointments', { credentials: 'include' }),
        fetch('http://localhost:3000/api/future-appointments', { credentials: 'include' }),
      ]);

      if (!pastResponse.ok || !futureResponse.ok) {
        if (pastResponse.status === 401 || futureResponse.status === 401) { logout(); return; }
        throw new Error('Fehler beim Abrufen der Termine');
      }

      const pastData = await pastResponse.json();
      const futureData = await futureResponse.json();

      const allPast = pastData?.listData || [];
      const allFuture = futureData?.listData || [];
      const all = [...allPast, ...allFuture].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayAppointments = [];
      const upcomingAppointments = [];
      const pastAppointmentsList = []; // Um Verwechslung mit State zu vermeiden

      all.forEach((appointment) => {
        const startTime = new Date(appointment.start_time);
        startTime.setHours(0, 0, 0, 0);

        if (startTime.getTime() === today.getTime()) {
          todayAppointments.push(appointment);
        } else if (startTime > today) {
          upcomingAppointments.push(appointment);
        } else {
          pastAppointmentsList.push(appointment);
        }
      });

      pastAppointmentsList.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

      // Hier füllen wir die States für zukünftige und vergangene Termine
      // Je nachdem, wie du sie im JSX trennen möchtest.
      // Für Einfachheit, füllen wir hier direkt die benötigten Arrays
      // und geben sie ggf. an eine Rendering-Funktion weiter.
      // Für dieses Beispiel fassen wir sie zusammen und sortieren dann neu im JSX.
      setFutureAppointments([...todayAppointments, ...upcomingAppointments]);
      setPastAppointments(pastAppointmentsList);

    } catch (error) {
      console.error('Fehler beim Abrufen der Kundentermine:', error);
      setDashboardError('Fehler beim Laden Ihrer Termine.');
    } finally {
      setIsCustomerLoading(false);
    }
  };

  // --- Notizen speichern ---
  const saveNote = async (appointmentId, type) => {
    const noteType = type === 'client' ? 'client_note' : 'staff_note'; // Angepasst an Server-API-Namen
    const editorElement = clientNoteEditorRef.current[appointmentId]; // Zugriff über Ref-Objekt
    const noteContent = editorElement ? editorElement.innerHTML : '';

    try {
      const response = await fetch(`http://localhost:3000/api/appointment/${appointmentId}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientNote: noteContent // korrekt benannt für den Server
        }),
                credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fehler beim Speichern der ${type} Notiz: ${response.status} ${errorText}`);
      }

      // Aktualisiere den State der Termine, um die Notiz anzuzeigen
      setFutureAppointments(prev =>
        prev.map(app =>
          app.id === appointmentId ? { ...app, [noteType]: noteContent } : app
        )
      );
      setPastAppointments(prev =>
        prev.map(app =>
          app.id === appointmentId ? { ...app, [noteType]: noteContent } : app
        )
      );

      setEditingNoteIds(prevId => (prevId === appointmentId ? null : prevId));

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
  
    // Fallbacks für Datumsprüfung
    const isValidDate = (date) => date instanceof Date && !isNaN(date);
  
    // Formatierer für Datum und Zeit
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
              {/* Datum + Startzeit */}
              <p>🗓️<strong>Datum | Zeit:</strong>{formattedDate} | {formattedTime} Uhr </p>
              </div>
              <div className="info-field">
              {/* Dauer */}
              <p>🕒 <strong>Dauer:</strong>{durationMinutes} Minuten</p>
              </div>
              <div className="info-field">
              {/* Ort */}
              {appointment.location && (
                <p>📍 <strong>Ort:</strong> {appointment.location}</p>
              )}
              </div>
              <div className="info-field">
              {/* Mitarbeiter */}
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
                        setEditingNoteIds(prev => ({ ...prev, [appointment.id]: false }));
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
    // Diese Funktion wird aufgerufen, wenn der Kalender sich ändert (Monat/Woche vor/zurück)
    if (calendarTitleRef.current) {
      calendarTitleRef.current.textContent = arg.view.title;
    }
  };

  

  // --- Render-Logik für Ladezustand und Fehler ---
  if (loading) {
    return <LoadingSpinner message="Lade Dashboard..." />;
  }

  if (!user) {
    return null; // Oder eine Umleitung, falls nicht angemeldet
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
              {isCustomerLoading ? (
                <LoadingSpinner message="Lade Ihre Termine..." />
              ) : (
                <>
                  {futureAppointments.length === 0 && pastAppointments.length === 0 ? (
                    <p id="no-appointments-message">Keine Termine gefunden.</p>
                  ) : (
                    <>
                      {/* Hier könntest du die Gruppen "Heutige Termine", "Zukünftige Termine", "Vergangene Termine" rendern */}
                      {/* Für dieses Beispiel, fassen wir sie zusammen und rendern sie. Du kannst die Gruppierung wieder einführen, wenn du möchtest. */}
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
          <CalendarComponent setIsCalendarModalOpen={setIsCalendarModalOpen} user={user}   onEventClick={handleEventClick}   selectedCustomerId={selectedCustomerId}
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



      </main>
    </div>
  );
};



export default Dashboard;