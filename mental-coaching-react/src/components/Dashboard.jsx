import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';
import CalendarComponent from './CalendarComponent';
import AppointmentModal from './AppointmentModal'; // <<-- NEU: Dein umbenanntes Modal
import EditableNoteField from './EditableNoteField'; // <-- NEU: Importiere die neue Komponente
import AppointmentNotes from './AppointmentNotes';



// --- Hilfskomponenten ---
const LoadingSpinner = ({ message }) => (
  <div className="loading">
    <div className="spinner"></div>
    <span>{message || "Lädt Daten..."}</span>
  </div>
);

// --- Hauptkomponente: Dashboard ---
const Dashboard = () => {
  const {
    user,
    isLoggedIn,
    loading: authLoading,
    logout,
    calendarAppointments,
    setCalendarAppointments,
    fetchAppointments,
    authProps,
    futureAppointments = [],
    pastAppointments = [],
  } = useAuth();
  
  const navigate = useNavigate();

  const [dashboardError, setDashboardError] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [staffStats, setstaffStats] = useState(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isstaffLoading, setIsstaffLoading] = useState(false);
  const [allclients, setAllclients] = useState([]);
  const [myStaffclients, setMyStaffclients] = useState([]);
  const [showClientDetailsModal, setShowClientDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null); 

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isAppointmentDetailsModalOpen, setIsAppointmentDetailsModalOpen] = useState(false);
  const [appointment, setappointment] = useState(null);

  const [editingNoteIds, setEditingNoteIds] = useState({});
  const [expandedAppointmentIds, setExpandedAppointmentIds] = useState({});
  const clientNoteEditorRef = useRef({});
  const staffNoteEditorRef = useRef({}); 
  const [tempClientNoteContent, setTempClientNoteContent] = useState('');
  const [tempStaffNoteContent, setTempStaffNoteContent] = useState('');

  const [showNoteSavedMessage, setShowNoteSavedMessage] = useState(false);
  const noteSavedTimeoutRef = useRef(null);

  const calendarRef = useRef(null);
  const calendarTitleRef = useRef(null);

  const [showAllMonthsModal, setShowAllMonthsModal] = useState(false);
  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  // === STATES FÜR DAS NEUE APPOINTMENT MODAL ===
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false); // <-- Geändert von isAppointmentFormModalOpen
  const [initialEventDataForModal, setInitialEventDataForModal] = useState(null); // <-- Geändert von initialEventData
  const [selectedDateAndTimeForModal, setSelectedDateAndTimeForModal] = useState(null); // <-- Geändert von selectedDateAndTimeForNewEvent

  // === STATES FÜR "Zuletzt verwendet" ===
  const [lastUsedTitle, setLastUsedTitle] = useState('');
  const [lastUsedLocation, setLastUsedLocation] = useState('');
  const [lastUsedDuration, setLastUsedDuration] = useState(60);

  const [copiedAppointment, setCopiedAppointment] = useState(null);
  const [originalCalendarAppointments, setOriginalCalendarAppointments] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isclientsLoading, setIsclientsLoading] = useState(false);
  const hasFetchedclients = useRef(false);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingEventDrop, setPendingEventDrop] = useState(null);
  const [sendSmsNotification, setSendSmsNotification] = useState(true);
  const [originalDroppedEvent, setOriginalDroppedEvent] = useState(null);
  const [shouldLoadStats, setShouldLoadStats] = useState(true);

  

  const handleLogout = useCallback(async () => {
    console.log('User initiated logout.');
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [logout, navigate]);

  const fetchAdminStatistics = useCallback(async () => {
    console.log('--- fetchAdminStatistics gestartet ---');
    if (isAdminLoading) {
      console.log('Admin statistics already loading, skipping fetch.');
      return;
    }
    setIsAdminLoading(true);
    console.log('isAdminLoading auf true gesetzt.');
    try {
      const response = await fetch('http://localhost:3000/api/admin/statistics', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Admin stats: 401 Unauthorized, logging out.');
          logout();
          return;
        }
        throw new Error(`Fehler beim Abrufen der Admin-Daten: ${response.statusText}`);
      }
      const data = await response.json();
      setAdminStats(data);
      console.log('API-Antwort für Admin-Statistiken erhalten und setAdminStats gesetzt:', data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Admin-Daten:', error);
      setDashboardError('Fehler beim Laden der Admin-Daten.');
    } finally {
      setIsAdminLoading(false);
      console.log('isAdminLoading auf false gesetzt.');
      console.log('--- fetchAdminStatistics beendet ---');
    }
  }, [logout, setAdminStats, setDashboardError]); // is AdminLoading HIER ENTFERNT!

  const fetchstaffStatistics = useCallback(async () => {
    console.log('--- fetchstaffStatistics gestartet ---');
    if (isstaffLoading) {
      console.log('staff statistics already loading, skipping fetch.');
      return;
    }
    setIsstaffLoading(true);
    setDashboardError(null);
    console.log('isstaffLoading auf true gesetzt.');

    try {
      const response = await fetch('http://localhost:3000/api/staff/statistics', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('staff stats: 401 Unauthorized, logging out.');
          logout();
          return;
        }
        throw new Error(`Fehler beim Abrufen der Mitarbeiter-Daten: ${response.statusText}`);
      }
      const data = await response.json();
      setstaffStats(data);
      console.log('API-Antwort für Mitarbeiter-Statistiken erhalten und setstaffStats gesetzt:', data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Mitarbeiter-Daten:', error);
      setDashboardError('Fehler beim Laden der Mitarbeiter-Daten.');
    } finally {
      setIsstaffLoading(false);
      console.log('isstaffLoading auf false gesetzt.');
      console.log('--- fetchstaffStatistics beendet ---');
    }
  }, [logout, setstaffStats, setDashboardError]); // isstaffLoading HIER ENTFERNT!

  const fetchclients = useCallback(async () => {
    console.log('Innerhalb von fetchclients-Funktion gestartet.');
    // Der if(isclientsLoading)-Check bleibt hier, da er eine schnelle Ausstiegsbedingung ist
    if (isclientsLoading) {
      console.log('Kunden-Daten werden bereits geladen, überspringe Fetch.');
      return;
    }
    setIsclientsLoading(true);
    setDashboardError(null);
    console.log('isclientsLoading auf true gesetzt.');

    try {
      console.log('Versuche /api/all-clients zu laden...');
      const allclientsRes = await fetch('/api/all-clients', { credentials: 'include' });
      if (!allclientsRes.ok) {
        if (allclientsRes.status === 401) {
          console.warn('All clients fetch: 401 Unauthorized, logging out.');
          logout();
          return;
        }
        throw new Error('Fehler beim Laden aller Kunden');
      }
      const allclientsData = await allclientsRes.json();
      setAllclients(allclientsData);
      console.log('setAllclients gesetzt. Anzahl aller Kunden:', allclientsData.length);

      // myStaffclients.length wird hier gelesen, also muss es in den Abhängigkeiten sein ODER
      // wir nutzen einen Callback-Formular für setMyStaffclients, um alte Werte zu nutzen,
      // und myStaffclients.length kann aus useCallback entfernt werden.
      // Für diesen Fall ist es am einfachsten, den Wert weiterhin als Abhängigkeit zu behandeln,
      // oder alternativ den if-Check so zu gestalten, dass er nicht zur Schleife führt.
      // Da der Hauptfehler die Statistik-Schleife war, lassen wir dies vorerst so.
      if (user?.role === 'staff' && myStaffclients.length === 0) {
        console.log('User ist staff. Versuche /api/staff/my-clients zu laden...');
        const myclientsRes = await fetch('/api/staff/my-clients', { credentials: 'include' });
        if (!myclientsRes.ok) {
          if (myclientsRes.status === 401) {
            console.warn('My staff clients fetch: 401 Unauthorized, logging out.');
            logout();
            return;
          }
          throw new Error('Fehler beim Laden der Mitarbeiter-Kundenliste');
        }
        const myclientsData = await myclientsRes.json();
        setMyStaffclients(myclientsData);
        console.log('setMyStaffclients gesetzt. Anzahl Mitarbeiter-Kunden:', myclientsData.length);
      } else if (user?.role === 'staff') {
        console.log('User ist staff, aber myStaffclients ist bereits geladen. Überspringe fetch.');
      }

      hasFetchedclients.current = true;

    } catch (err) {
      console.error('Fehler beim Laden der Dashboard-Kundenlisten:', err);
      setDashboardError(err.message);
    } finally {
      setIsclientsLoading(false);
      console.log('isclientsLoading auf false gesetzt.');
      console.log('fetchclients-Funktion beendet.');
    }
  }, [
    logout,
    user,
    setAllclients,
    setMyStaffclients,
    setDashboardError,
    // isclientsLoading, // HIER KÖNNTE ES AUCH ZU EINER SCHLEIFE FÜHREN, ABER NICHT IMMER. SICHERHEITSHALBER ENTFERNEN.
    myStaffclients.length // BLEIBT, WEIL ES IN DER LOGIK GELESEN WIRD UND SO DIE FUNKTION BEI ÄNDERUNG NEU ERZEUGT WIRD.
                          // Alternative: myStaffclients über functional update in setMyStaffclients nutzen, dann ist dies nicht nötig.
                          // Für jetzt fokussieren wir uns auf den Statistik-Loop.
  ]);

  // useEffect zum Laden der Admin-Statistiken
  useEffect(() => {
    // Nur laden, wenn der Benutzer eingeloggt ist und die Rolle 'admin' hat
    if (isLoggedIn && user?.role === 'admin') {
      console.log('useEffect: Lade Admin-Statistiken...');
      fetchAdminStatistics();
    }
  }, [isLoggedIn, user?.role, fetchAdminStatistics]); // Abhängigkeiten
  
  useEffect(() => {
    if (shouldLoadStats && isLoggedIn && (user?.role === 'staff' || user?.role === 'admin')) {
      console.log('useEffect: Lade Mitarbeiter-Statistiken...');
      fetchstaffStatistics();
      setShouldLoadStats(false);
    }
  }, [shouldLoadStats, isLoggedIn, user?.role, fetchstaffStatistics]);
  
  // Ihr Haupt-useEffect (Kunden/Kalender) - BEHALTEN SIE NUR EINEN DIESER BLÖCKE
  useEffect(() => {
    console.log('--- Haupt-useEffect (Kunden/Kalender) wird ausgeführt ---');
    console.log('Abhängigkeiten Haupt-useEffect:', {
      authLoading,
      isLoggedIn,
      user: user ? user.role : 'kein User',
      isclientsLoading,
      hasFetchedclients: hasFetchedclients.current,
      futureAppointmentsLength: calendarAppointments?.filter(a => new Date(a.end_time) >= new Date())?.length ?? 0,
      pastAppointmentsLength: calendarAppointments?.filter(a => new Date(a.end_time) < new Date())?.length ?? 0,
      originalCalendarAppointmentsLength: originalCalendarAppointments?.length ?? 0,      
    });
  
    if (authLoading) {
      console.log('Haupt-useEffect übersprungen: authLoading ist true.');
      return;
    }
  
    if (!isLoggedIn) {
      console.log('Haupt-useEffect übersprungen: isLoggedIn ist false. Navigiere zu /login.');
      navigate('/login');
      return;
    }
  
    // ✅ NEU: Kombinierte Logik für alle Rollen → alle Termine (future + past)
    const combinedAppointments = [...calendarAppointments]; // oder direkte Prüfung
  
    if (JSON.stringify(combinedAppointments) !== JSON.stringify(originalCalendarAppointments)) {
      console.log('📅 Setze Kalendertermine (inkl. vergangene)');
      setCalendarAppointments(combinedAppointments);
      setOriginalCalendarAppointments(combinedAppointments);
    } else {
      console.log('📅 Keine Änderungen an combinedAppointments');
    }
  
    // 👇 Staff/Admin: Kunden laden (wie gehabt)
    if (user && (user?.role === 'staff' || user?.role === 'admin')) {
      if (!hasFetchedclients.current && !isclientsLoading) {
        console.log('Starte fetchclients, da noch nicht geladen und nicht in Ladezustand.');
        fetchclients();
      } else {
        console.log('Kunden-Fetches übersprungen: bereits geladen oder in Ladezustand.');
      }
    } else {
      console.log('Kunden-Fetches übersprungen, da User-Rolle nicht Staff/Admin ist.');
    }
  
  }, [
    authLoading,
    isLoggedIn,
    user,
    navigate,
    fetchclients,
    isclientsLoading,
    calendarAppointments, // ✅ statt future/past
    originalCalendarAppointments,
    setCalendarAppointments,
    setOriginalCalendarAppointments
  ]);
  

  // NEU: Funktion zum Duplizieren nach dem Drag & Drop
  const duplicateEventDrop = useCallback(async () => {
    if (!pendingEventDrop) return;

    // Erstelle ein "kopiertes" Event-Objekt aus dem Pending-Event
    const duplicatedData = {
      title: pendingEventDrop.extendedProps.title || pendingEventDrop.title,
      location: pendingEventDrop.extendedProps.location,
      start_time: pendingEventDrop.start.toISOString(), // Verwende die NEUE Position vom Drag & Drop
      end_time: pendingEventDrop.end.toISOString(),     // Verwende die NEUE Position vom Drag & Drop
      user_id: pendingEventDrop.extendedProps.user_id, // Übernimm den Kunden des verschobenen Termins
    };

    try {
      // API-Aufruf zum Erstellen eines NEUEN Termins
      const response = await fetch('/api/book-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(duplicatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Fehler beim Duplizieren des Termins.`);
      }

      alert('✅ Termin erfolgreich dupliziert!');

      // Setze den Kalenderzustand auf den ursprünglichen Zustand zurück (Termin nicht verschieben)
      setCalendarAppointments(originalCalendarAppointments); // WICHTIG: Originalzustand wiederherstellen
      setHasChanges(false);

      setShowConfirmationModal(false); // Modal schliessen
      setPendingEventDrop(null);
      setOriginalDroppedEvent(null);
      await fetchAppointments(); // Termine im AuthContext neu laden
    } catch (err) {
      console.error('❌ Fehler beim Duplizieren des Termins:', err);
      alert('Fehler beim Duplizieren des Termins: ' + err.message);
    }
  }, [pendingEventDrop, originalCalendarAppointments, setCalendarAppointments, setHasChanges, fetchAppointments]);

  const handleEventDrop = useCallback(({ event, oldEvent }) => {
    console.log('🟢 handleEventDrop ausgelöst');
    console.log('Neuer Event:', event);
    console.log('Alter Event:', oldEvent);
  
    // Prüfe, ob extendedProps existieren, sonst aus dem lokalen State holen
    let extendedProps = event.extendedProps;
    if (!extendedProps) {
      const original = calendarAppointments.find(a => a.id.toString() === event.id.toString());
      extendedProps = original
        ? {
            topic: original.title,
            location: original.location,
            user_id: original.user_id,
            client_note: original.client_note,
            staff_note: original.staff_note,
          }
        : {};
    }
  
    console.log('🔍 extendedProps beim Verschieben:', extendedProps);
  
    const id = parseInt(event.id);
  
    const updated = calendarAppointments?.map(app =>
      app.id === id
        ? {
            ...app,
            start_time: event.start.toISOString(),
            end_time: event.end.toISOString(),
            title: event.title,
            topic: extendedProps.topic,
            location: extendedProps.location,
            user_id: extendedProps.user_id,
            client_note: extendedProps.client_note,
            staff_note: extendedProps.staff_note,
          }
        : app
    );
  
    setCalendarAppointments(updated);
    setHasChanges(true);
    setPendingEventDrop(event);
    setOriginalDroppedEvent(oldEvent);
    setShowConfirmationModal(true);
  }, [
    calendarAppointments,
    setCalendarAppointments,
    setHasChanges,
    setPendingEventDrop,
    setOriginalDroppedEvent,
    setShowConfirmationModal,
  ]);
  

  const confirmEventDrop = useCallback(async () => {
    if (!pendingEventDrop) return;

    const id = parseInt(pendingEventDrop.id);
    const updatedAppointment = calendarAppointments.find(app => app.id === id);

    if (!updatedAppointment) {
      console.error('Bestätigung fehlgeschlagen: Aktualisierter Termin nicht gefunden.');
      setShowConfirmationModal(false);
      setPendingEventDrop(null);
      setOriginalDroppedEvent(null);
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          start_time: updatedAppointment.start_time,
          end_time: updatedAppointment.end_time,
          location: updatedAppointment.location,  // HIER hinzufügen!
          title: updatedAppointment.title,        // HIER hinzufügen!
          sendSms: sendSmsNotification,
          old_start_time: originalDroppedEvent.start.toISOString(),
          old_end_time: originalDroppedEvent.end.toISOString(),
          client_first_name: updatedAppointment.client_first_name,
          client_last_name: updatedAppointment.client_last_name,
          client_phone_number: updatedAppointment.client_phone_number
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fehler beim Speichern der Terminänderung für ID ${id}: ${response.status} ${errorText}`);
      }

      alert('Termin erfolgreich verschoben!');
      setOriginalCalendarAppointments(prev => prev.map(app => app.id === id ? updatedAppointment : app));
      setHasChanges(false);
      await fetchAppointments();

      if (sendSmsNotification) {
        console.log('SMS-Benachrichtigung wird gesendet (falls im Backend implementiert).');
      }

    } catch (err) {
      console.error('Fehler beim Bestätigen der Terminverschiebung:', err);
      alert('Fehler beim Speichern der Verschiebung: ' + err.message);
      setCalendarAppointments(originalCalendarAppointments);
      setHasChanges(false);
    } finally {
      setShowConfirmationModal(false);
      setPendingEventDrop(null);
      setOriginalDroppedEvent(null);
    }
  }, [
    pendingEventDrop,
    calendarAppointments,
    sendSmsNotification,
    originalDroppedEvent,
    setOriginalCalendarAppointments,
    setHasChanges,
    fetchAppointments,
    originalCalendarAppointments
  ]);


  const triggerCopyAppointment = useCallback((appointmentToCopy) => { // <-- HIER FEHLT DER ANFANG!
    // Überprüfe, ob appointmentToCopy gültige Daten enthält
    if (!appointmentToCopy || !appointmentToCopy.start_time || !appointmentToCopy.end_time) {
      console.error("Ungültige Termindaten zum Kopieren:", appointmentToCopy);
      alert("Fehler: Termin konnte nicht kopiert werden. Ungültige Daten.");
      return;
    }

  const durationMinutes = Math.floor((new Date(appointmentToCopy.end_time).getTime() - new Date(appointmentToCopy.start_time).getTime()) / 60000);

  setCopiedAppointment({
    // WICHTIG: Hier die Daten aufbereiten, die später im AppointmentModal vorbesetzt werden sollen.
    // initialEventData wird dies nutzen.
    title: appointmentToCopy.title || appointmentToCopy.title,
    location: appointmentToCopy.location,
    durationMinutes: durationMinutes, // Die Dauer muss hier übergeben werden
    user_id: appointmentToCopy.user_id, // Die Kunden-ID des Originaltermins
    // start_time und end_time werden NICHT kopiert, da der neue Termin eine neue Zeit bekommt
    // id wird auch nicht kopiert, da es ein neuer Termin ist
  });
  alert('Termin kopiert! Klicke nun im Kalender auf einen freien Slot, um ihn einzufügen.');
  // Nach dem Kopieren: Das aktuelle Modal schliessen und den Kalender öffnen,
  // damit der Nutzer einfuegen kann.
  setIsAppointmentDetailsModalOpen(false); // Falls das Details-Modal offen war
  setIsAppointmentModalOpen(false); // Falls das Bearbeitungs-Modal offen war
  setIsCalendarModalOpen(true); // Öffnet den Kalender
}, [setCopiedAppointment, setIsAppointmentDetailsModalOpen, setIsAppointmentModalOpen, setIsCalendarModalOpen]);

    const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);


    const onEventClick = useCallback((info) => {
      const eventId = parseInt(info.event.id);
      const appointment = calendarAppointments.find(app => app.id === eventId);
      if (!appointment) {
        console.warn('Kein Termin im State gefunden:', eventId);
        return;
      }

      const isPast = new Date(appointment.end_time) < new Date();
      console.log(`📅 Termin ${eventId} geklickt – isPast:`, isPast);

      if (isPast) {
        setappointment(appointment);
        setExpandedAppointmentIds(prev => ({ ...prev, [appointment.id]: true }));
      
        if (user?.role === 'staff' || user?.role === 'admin') {
          setEditingNoteIds(prev => ({ ...prev, [appointment.id]: 'staff' }));
        } else if (user?.role === 'client') {
          setEditingNoteIds(prev => ({ ...prev, [appointment.id]: 'client' }));
        }
      
        // 🆕 Zeige das Notiz-Modal explizit an
        setIsAppointmentDetailsModalOpen(true);
      }
       else {
        // 👉 Zukunftstermin – wie gehabt: Modal öffnen
        if (user?.role === 'staff' || user?.role === 'admin') {
          console.log('*** Termin aus Kalender (ZUKUNFT - STAFF/ADMIN):', appointment);
          setappointment(appointment);

          setInitialEventDataForModal({
            id: appointment.id,
            title: appointment.title,
            location: appointment.location,
            start_time: new Date(appointment.start_time),
            end_time: new Date(appointment.end_time),
            user_id: appointment.user_id,
          });

          setIsAppointmentModalOpen(true);
        } else {
          // Kunde – Zukunftstermin Detailmodal öffnen
          console.log('*** Termin aus Kalender (ZUKUNFT - CLIENT):', appointment);
          setappointment(appointment);
          setIsAppointmentDetailsModalOpen(true);
        }
      }
    }, [
      user,
      calendarAppointments,
      setappointment,
      setIsAppointmentDetailsModalOpen,
      setIsAppointmentModalOpen,
      setInitialEventDataForModal,
      setExpandedAppointmentId,
      setEditingNoteIds
    ]);

    const cancelEventDrop = useCallback(() => {
      console.log('Abbrechen der Terminverschiebung.');
      setCalendarAppointments(originalCalendarAppointments);
      setHasChanges(false);
      setShowConfirmationModal(false);
      setPendingEventDrop(null);
      setOriginalDroppedEvent(null);
    
      if (calendarRef.current) {
        calendarRef.current.getApi().refetchEvents();
      }
    }, [setCalendarAppointments, originalCalendarAppointments, setHasChanges, calendarRef]);
    

  const handleSaveChanges = useCallback(async () => {
    try {
      for (const app of calendarAppointments) {
        const original = originalCalendarAppointments.find(a => a.id === app.id);
        if (
          !original ||
          original.start_time !== app.start_time ||
          original.end_time !== app.end_time
        ) {
          console.log(`Änderung für Termin ID ${app.id} erkannt. Original: ${original?.start_time}, ${original?.end_time} | Neu: ${app.start_time}, ${app.end_time}`);
          const response = await fetch(`/api/book-appointments/${app.id}`, {
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
      setOriginalCalendarAppointments(calendarAppointments);
      setHasChanges(false);
      await fetchAppointments();
    } catch (err) {
      console.error('Fehler beim Speichern der Kalenderänderungen:', err);
      alert('Fehler beim Speichern: ' + err.message);
    }
  }, [
    calendarAppointments,
    originalCalendarAppointments,
    setOriginalCalendarAppointments,
    setHasChanges,
    fetchAppointments
  ]);

  const handleReset = useCallback(() => {
    setCalendarAppointments(originalCalendarAppointments);
    setHasChanges(false);
  
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents();
    }
  }, [setCalendarAppointments, originalCalendarAppointments, setHasChanges, calendarRef]);
  

  const handleCopy = useCallback((eventId) => {
    const found = calendarAppointments.find(a => a.id === eventId);
    if (found) {
      setCopiedAppointment({
        ...found,
        id: null,
        start_time: '',
        end_time: '',
      });
      alert('Termin kopiert! Du kannst ihn nun im Kalender einfügen.');
    }
  }, [calendarAppointments, setCopiedAppointment]);

  const handleSelectFromCalendar = useCallback((info) => {
    info.jsEvent.preventDefault();
    info.view.calendar.unselect();

    console.log('🟢 handleSelectFromCalendar ausgeführt:', info);

    setSelectedDateAndTimeForModal(new Date(info.startStr)); // Setze die Startzeit für den NEUEN Termin

    if (copiedAppointment) {
      console.log('Kopierter Termin gefunden, setze Initialdaten für Modal:', copiedAppointment);
      // setInitialEventDataForModal wird jetzt die kopierten Daten + neue Zeit erhalten
      setInitialEventDataForModal({
        ...copiedAppointment, // Kopierte title, location, durationMinutes, user_id
        start_time: new Date(info.startStr), // Neue Startzeit vom Klick
        // end_time wird im AppointmentModal aus start_time + durationMinutes berechnet
      });
      setCopiedAppointment(null); // Den kopierten Termin zurücksetzen, sobald er genutzt wurde
    } else {
      setInitialEventDataForModal(null); // Sicherstellen, dass kein Bearbeitungsmodus aktiv ist
      console.log('Kein kopierter Termin gefunden, Modal wird mit "Zuletzt verwendet" initialisiert.');
    }

    setIsAppointmentModalOpen(true); // Öffne das neue Termin-Formular-Modal
  }, [copiedAppointment, setCopiedAppointment, setInitialEventDataForModal, setSelectedDateAndTimeForModal, setIsAppointmentModalOpen]);

  const handleDateClick = useCallback((info) => {
    // Diese Funktion wird nicht mehr primär für das Erstellen von Terminen verwendet,
    // da `handleSelectFromCalendar` (vom `select`-Prop des FullCalendar) die Aufgabe übernimmt.
    // Sie könnte für spezielle Kopiervorgänge oder andere Logik genutzt werden.
    console.log("Date Clicked (This might be redundant if 'select' handles creation):", info);
    if (copiedAppointment) {
      // Logik zum Einfügen eines kopierten Termins.
      // Normalerweise würde hier ein API-Aufruf zum Erstellen des Termins stattfinden.
      // Die `onSave` des Modals wäre der richtige Ort dafür.
      alert('Termin einfügen ist noch nicht vollständig implementiert. Bitte Änderungen manuell speichern.');
    } else {
      // Wenn nichts kopiert ist, verhalte dich wie ein Klick auf einen Zeitbereich (für die Erstellung)
      handleSelectFromCalendar({ startStr: info.dateStr });
    }
  }, [copiedAppointment, handleSelectFromCalendar]);


  // NEU: Callback für das Speichern/Aktualisieren eines Termins aus dem AppointmentModal
  // Dies ist der zentrale Punkt, wo das Dashboard die Daten vom Modal entgegennimmt und verarbeitet
  const handleSaveAppointmentFromModal = useCallback(async (appointmentDataFromModal) => {
    console.log('📤 Dashboard: handleSaveAppointmentFromModal aufgerufen', appointmentDataFromModal);
    try {
      const isEditing = !!initialEventDataForModal?.id; // Prüfen, ob wir einen bestehenden Event bearbeiten

      const endpoint = isEditing
        ? `/api/appointments/${initialEventDataForModal.id}`
        : '/api/book-appointments';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        title: appointmentDataFromModal.title,
        location: appointmentDataFromModal.location,
        start_time: appointmentDataFromModal.start_time,
        end_time: appointmentDataFromModal.end_time,
        // Die user_id im Payload muss korrekt gesetzt werden
        user_id: user?.role === 'staff' ? appointmentDataFromModal.user_id : user?.id,
        // Weitere Daten, die das Backend benötigt (z.B. user_id des eingeloggten Benutzers, etc.)
      };

      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Fehler beim ${isEditing ? 'Aktualisieren' : 'Erstellen'} des Termins.`);
      }

      alert(`✅ Termin erfolgreich ${isEditing ? 'aktualisiert' : 'gebucht'}.`);

      // "Zuletzt verwendet"-States aktualisieren, basierend auf den Daten aus dem Modal
      setLastUsedTitle(appointmentDataFromModal.title);
      setLastUsedLocation(appointmentDataFromModal.location);
      // Die Dauer wird im Modal berechnet und nicht direkt als Prop übergeben,
      // aber wir können sie aus start_time und end_time ableiten.
      const duration = Math.floor((new Date(appointmentDataFromModal.end_time).getTime() - new Date(appointmentDataFromModal.start_time).getTime()) / 60000);
      setLastUsedDuration(duration);


      setIsAppointmentModalOpen(false); // Modal schließen
      setInitialEventDataForModal(null); // Bearbeitungsdaten zurücksetzen
      setSelectedDateAndTimeForModal(null); // Reset der Initialzeit

      await fetchAppointments(); // Termine im AuthContext neu laden
    } catch (err) {
      console.error('❌ Fehler beim Speichern des Termins:', err);
      alert('Fehler beim Speichern des Termins: ' + err.message);
    }
  }, [user, fetchAppointments, initialEventDataForModal, setLastUsedTitle, setLastUsedLocation, setLastUsedDuration]);

  // Erstellen der Event-Objekte für FullCalendar
  const now = new Date();

  const events = calendarAppointments?.map((a) => {
    const isPast = new Date(a.end_time) < now;
    const hasNote = !!a.staff_note || !!a.client_note;
  
    const classNames = [];
  
    if (isPast) {
      classNames.push('past-appointment');
      if (hasNote) {
        classNames.push('has-note');
      }
    }
  
    return {
      id: a.id.toString(), // Sicherstellen, dass es ein String ist
      title: a.title || 'Termin', // Wird im Kalender angezeigt (entspricht Thema)
      start: a.start_time,
      end: a.end_time,
      className: classNames,
      extendedProps: {
        topic: a.title, // ✅ HIER: Das Thema explizit auch in extendedProps rein!
        first_name: a.client_first_name,
        last_name: a.client_last_name,
        location: a.location,
        user_id: a.user_id,
        client_email: a.client_email,
        client_phone_number: a.client_phone_number,
        staff_email: a.staff_email,
        staff_first_name: a.staff_first_name,
        staff_last_name: a.staff_last_name,
        client_note: a.client_note,
        staff_note: a.staff_note,
      }
    };
  });
  
  console.log('🔍 extendedProps beim Verschieben:', JSON.stringify(event.extendedProps, null, 2));

  

    // Funktion zum Öffnen des Kunden-Details-Modals
    const handleClientCardClick = (client) => {
      setSelectedClient(client); // Speichert den geklickten Kunden
      setShowClientDetailsModal(true); // Zeigt das Modal an
    };

    const handleEditNoteClick = useCallback((appointmentId, type) => {
      console.log('--- handleEditNoteClick aufgerufen ---');
      console.log('  appointmentId:', appointmentId, 'type:', type);
    
      // 🔍 Termin finden – aus calendar ODER past
      const currentAppointment =
        calendarAppointments.find(appt => appt.id === appointmentId);
    
      const currentNote = type === 'client'
        ? currentAppointment?.client_note
        : currentAppointment?.staff_note;
    
      // ✅ 1. ZUERST temp content setzen
      if (type === 'client') {
        setTempClientNoteContent(currentNote || '');
      } else if (type === 'staff') {
        setTempStaffNoteContent(currentNote || '');
      }
    
      // ✅ 2. DANN Editor aktivieren
      setEditingNoteIds(prev => {
        const newState = { ...prev, [appointmentId]: type };
        console.log('  Neuer editingNoteIds Zustand nach setEditingNoteIds:', newState);
        return newState;
      });
    
    }, [calendarAppointments, setEditingNoteIds, setTempClientNoteContent, setTempStaffNoteContent]);
    
    

  const renderAppointmentItem = (appointment, type) => {
    const isExpanded = !!expandedAppointmentIds[appointment.id];
    const startDate = new Date(appointment.start_time);
    const durationMinutes = Math.floor((new Date(appointment.end_time) - startDate) / 60000);
    const isEditingClientNote = editingNoteIds[appointment.id] === 'client';
    const isEditingStaffNote = editingNoteIds[appointment.id] === 'staff';
    const isAnyNoteCurrentlyEditing = isEditingClientNote || isEditingStaffNote;
    const noteTypeInEdit = isEditingClientNote ? 'client' : (isEditingStaffNote ? 'staff' : null);
    const isFuture = new Date(appointment.start_time) > new Date();


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


    const handleAppointmentClick = () => {
      setappointment(appointment);
    
      setExpandedAppointmentIds(prev => ({
        ...prev,
        [appointment.id]: !isExpanded
      }));
    
      // Wenn der Termin gerade aufgeklappt wird:
      if (!isExpanded) {
        setTempClientNoteContent(appointment.client_note || '');
        setTempStaffNoteContent(appointment.staff_note || '');
    
        // ❗ Nur Bearbeitungsstatus für diesen Termin zurücksetzen, wenn er NICHT aktiv ist
        setEditingNoteIds(prev => {
          const isEditing = !!prev[appointment.id];
          if (!isEditing) return prev; // Nichts ändern
          // Falls du aktiv zurücksetzen willst, entferne ihn gezielt:
          const newState = { ...prev };
          delete newState[appointment.id];
          return newState;
        });
      }
    };
    

    return (
      <div
      // WICHTIG: Dieser Key muss sich ändern, wenn sich der Notizinhalt ändert!
      key={`${appointment.id}-${appointment.staff_note || ''}-${appointment.client_note || ''}`}
      className={`appointment-item ${isExpanded ? 'expanded' : ''} ${isFuture ? 'future-border' : 'past-border'}`}
      onClick={handleAppointmentClick} // Dein Click-Handler für das Aufklappen
    >
        <div className="appointment-info">
          <div className="info-field">
            <strong>
              <p>{appointment.title || 'Termin'}</p>
            </strong>
          </div>
          <div className="info-field">
            <p>🗓️ <strong>Datum | Zeit:</strong> {formattedDate} | {formattedTime} Uhr </p>
          </div>
          <div className="info-field">
            <p>🕒 <strong>Dauer:</strong> {durationMinutes} Minuten</p>
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
          {(user?.role === 'staff' || user?.role === 'admin') && appointment.client_first_name && (
            <div className="info-field">
              <p>🙋‍♂️ <strong>Kunde:</strong> {appointment.client_first_name} {appointment.client_last_name}</p>
            </div>
          )}
        </div>
    
            {/* Vereinheitlichte Anzeige für den Notizen-Hinweis mit externer CSS-Klasse */}
            <p className="appointment-toggle-hint">
              {isExpanded ? 'Notizen ausblenden' : 'Notizen anzeigen/aufklappen'}
            </p>

            {isExpanded && appointment && (
              <AppointmentNotes
                appointment={appointment}
                user={user}
                calendarAppointments={calendarAppointments}
                tempClientNoteContent={tempClientNoteContent}
                tempStaffNoteContent={tempStaffNoteContent}
                setTempClientNoteContent={setTempClientNoteContent}
                setTempStaffNoteContent={setTempStaffNoteContent}
                clientNoteEditorRef={clientNoteEditorRef}
                staffNoteEditorRef={staffNoteEditorRef}
                editingNoteIds={editingNoteIds}
                handleEditNoteClick={handleEditNoteClick}
                saveNote={saveNote}
                setShouldLoadStats={setShouldLoadStats}
              />
            )}

          </div>
        );
      };

      const saveNote = useCallback(async (appointmentId, type, noteContentToSave, exitEditMode = false) => {
        console.log('--- START saveNote ---');
        console.log(`⚠️ saveNote wurde aufgerufen für Termin ${appointmentId} [${type}]`);
        console.log('1. noteContentToSave (Editor-Inhalt):', noteContentToSave);
      
        // ✨ LEER-VALIDIERUNG ✨
        const cleanedNote = (noteContentToSave || '')
          .replace(/<br\s*\/?>/gi, '')
          .replace(/&nbsp;/gi, '')
          .replace(/\s+/g, '')
          .trim();
      
        if (!user) {
          console.error('⛔ Benutzer ist nicht authentifiziert.');
          return false;
        }
      
        // 🔐 Schutz: Clients dürfen keine staff-Notizen ändern
        if (user.role === 'client' && type === 'staff') {
          console.warn('⛔ Client darf keine Staff-Notiz bearbeiten.');
          alert('Sie sind nicht berechtigt, Mitarbeiter-Notizen zu bearbeiten.');
          return false;
        }
              
        // 🔁 Originalzustände sichern für Rollback
        const originalAppointments = [...calendarAppointments.map(a => ({ ...a }))];
        const originalAppointment = appointment ? { ...appointment } : null;
        const originalTempClientNoteContent = tempClientNoteContent;
        const originalTempStaffNoteContent = tempStaffNoteContent;
        const originalEditingNoteIds = { ...editingNoteIds };

        // 🔄 Optimistisches UI-Update (Kopie)
        const updatedCalendarAppointments = calendarAppointments.map(appt =>
          appt.id === appointmentId
            ? {
                ...appt,
                [type === 'client' ? 'client_note' : 'staff_note']: noteContentToSave,
              }
            : { ...appt } // <- wichtig: immer kopieren
        );

        setCalendarAppointments(updatedCalendarAppointments);

        // 🆕 Einzeltermin aktualisieren (Kopie!)
        const updatedSingleAppointment = updatedCalendarAppointments.find(a => a.id === appointmentId);
        if (updatedSingleAppointment) {
          setappointment({ ...updatedSingleAppointment }); // <- neue Kopie setzen!
          console.log('✅ Termin erfolgreich optimistisch aktualisiert:', updatedSingleAppointment);
        } else {
          console.warn('⚠️ Termin wurde im State nicht gefunden nach Update.');
        }

        // Optional: Bearbeitungsmodus verlassen
        if (exitEditMode === true) {
          setEditingNoteIds(prev => ({ ...prev, [appointmentId]: false }));
        }

        // ✨ Erfolgsmeldung anzeigen
        setShowNoteSavedMessage(true);
        if (noteSavedTimeoutRef.current) clearTimeout(noteSavedTimeoutRef.current);
        noteSavedTimeoutRef.current = setTimeout(() => setShowNoteSavedMessage(false), 3000);

        // 🔁 Backend speichern
        const requestBody = {
          appointmentId,
          note: noteContentToSave,
          type,
        };

        console.log('📡 Sende an Backend:', requestBody);

        try {
          const response = await fetch('/api/update-note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend-Fehler:', response.status, errorText);
            throw new Error(`HTTP ${response.status} – ${errorText}`);
          }

          const responseData = await response.json();
          console.log('✅ Backend-Antwort:', responseData);
          return true;

        } catch (error) {
          console.error(`❌ Fehler beim Speichern der ${type}-Notiz:`, error);
          alert(`Fehler beim Speichern Ihrer ${type}-Notiz. Bitte versuchen Sie es erneut. Details: ${error.message}`);

          // 🔁 Rollback bei Fehler
          setCalendarAppointments(originalAppointments);
          if (originalAppointment) {
            setappointment({ ...originalAppointment });
            if (type === 'client') setTempClientNoteContent(originalTempClientNoteContent);
            if (type === 'staff') setTempStaffNoteContent(originalTempStaffNoteContent);
          }
          setEditingNoteIds(originalEditingNoteIds);
          setShowNoteSavedMessage(false);
          return false;
        } finally {
          console.log('--- END saveNote ---');
        }

      
      }, [
        user,
        calendarAppointments, setCalendarAppointments,
        appointment, setappointment,
        tempClientNoteContent, setTempClientNoteContent,
        tempStaffNoteContent, setTempStaffNoteContent,
        setEditingNoteIds, editingNoteIds,
        setShowNoteSavedMessage, noteSavedTimeoutRef
      ]);
      

  const handleDatesSet = useCallback((arg) => {
    if (calendarTitleRef.current) {
      calendarTitleRef.current.textContent = arg.view.title;
    }
  }, [calendarTitleRef]);

  if (authLoading) {
    return <LoadingSpinner message="Lade Dashboard..." />;
  }

  if (!user) {
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
      <header className="dashboard-header">
        <div className="header-left">
          <a href="/">
            <img src="/images/ReThink-Coaching-Logo.webp" alt="Logo" className="header-logo" />
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

        {user?.role === 'staff' && (
          <section id="staff-section" className="dashboard-section">
            <h2>Mitarbeiter-Bereich</h2>
            {/* Die Lade-Anzeige für Mitarbeiter-spezifische Daten wie Statistiken oder Kundenliste */}
            {isstaffLoading ? (
              <LoadingSpinner message="Lade Mitarbeiter-Daten..." />
            ) : (
              <>
            <div className="staff-stats-container">
              {staffStats && staffStats.monthlyCompletedSessions && staffStats.monthlyCompletedSessions.length > 0 ? (
                (() => {
                  const currentMonthIndex = new Date().getMonth(); // 0-11
                  const lastMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1; // 0-11

                  const currentMonthData = staffStats.monthlyCompletedSessions.find(
                    (data) => parseInt(data.month) === currentMonthIndex + 1
                  );
                  const lastMonthData = staffStats.monthlyCompletedSessions.find(
                    (data) => parseInt(data.month) === lastMonthIndex + 1
                  );

                  return (
                    <div className="stats-text"> {/* Dieser Container wird jetzt ein Flex-Container */}
                      <span className="month-stat">
                        <strong>Aktueller Monat</strong> ({monthNames[currentMonthIndex]}):{" "}
                        {currentMonthData ? `${currentMonthData.count} Termine` : "0 Termine"}
                      </span>
                      <span className="month-stat">
                        <strong>Letzter Monat</strong> ({monthNames[lastMonthIndex]}):{" "}
                        {lastMonthData ? `${lastMonthData.count} Termine` : "0 Termine"}
                      </span>
                    </div>
                  );
                })()
              ) : (
                <p className="stats-text">Keine erledigten Termine für das aktuelle Jahr gefunden.</p>
              )}

              {/* Button, um alle Monate anzuzeigen (jetzt innerhalb des neuen Containers) */}
              {staffStats && staffStats.monthlyCompletedSessions && staffStats.monthlyCompletedSessions.length > 0 && (
                <button onClick={() => setShowAllMonthsModal(true)} className="btn btn-secondary view-all-months-btn">
                  Alle Monate anzeigen
                </button>
              )}
            </div>

            {/* MODAL FÜR ALLE MONATE */}
            {showAllMonthsModal && (
              <div className="modal-overlay"> {/* Styling für Overlay ist wichtig (position: fixed, full screen, background) */}
                <div className="modal-content"> {/* Styling für Modal-Inhalt (background, padding, max-width, center) */}
                  <h3>Alle bisherigen Monatsstatistiken</h3>
                  {staffStats.monthlyCompletedSessions.length > 0 ? (
                    <ul>
                      {staffStats.monthlyCompletedSessions.map((data) => (
                        <li key={data.month}>
                          <strong>{monthNames[parseInt(data.month) - 1]}:</strong> {data.count} Termine
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Keine Monatsstatistiken verfügbar.</p>
                  )}
                  <button onClick={() => setShowAllMonthsModal(false)} className="btn">
                    Schließen
                  </button>
                </div>
              </div>
            )}
                        <div className="staff-clients-list">
              <h3>Ihre zugewiesenen Kunden:</h3>
              {myStaffclients.length > 0 ? (
                <div className="clients-card-list">
                  {myStaffclients.map(client => (
                    // Jede Karte ist jetzt klickbar, um das Modal zu öffnen
                    <div
                      key={client.id}
                      className="client-card"
                      onClick={() => handleClientCardClick(client)}
                      style={{ cursor: 'pointer' }} // Zeigt an, dass die Karte klickbar ist
                    >
                      <div className="card-header">
                        <h4>{client.first_name} {client.last_name}</h4>
                      </div>
                      {/* card-body und card-actions wurden entfernt, da Details im Modal sind */}
                      {/* Hier könnten Sie optional einen kleinen Pfeil oder ein Icon hinzufügen,
                          das anzeigt, dass man klicken kann, um Details zu sehen. */}
                    </div>
                  ))}
                </div>
              ) : (
                <p>Noch keine zugewiesenen Kunden gefunden.</p>
              )}
            </div>

      {/* NEU: Kunden-Details-Modal */}
      {showClientDetailsModal && selectedClient && (
                    <div className="modal-overlay">
                        <div className="modal-content client-details-modal-content">
                            <h3>Details für {selectedClient.first_name} {selectedClient.last_name}</h3>

                            {/* NEU: Grid-Container für die Kundendetails */}
                            <div className="client-detail-grid">
                                <p><strong>E-Mail:</strong></p>
                                <p>{selectedClient.email}</p>

                                <p><strong>Telefon:</strong></p>
                                <p>{selectedClient.phone || '-'}</p> {/* Zeigt '-' an, wenn keine Nummer vorhanden */}

                                {/* NEU: Adresse aus einzelnen Feldern zusammenfügen */}
                                {/* Wir prüfen, ob mindestens eines der Adressfelder vorhanden ist, um die Adresse anzuzeigen */}
                                {(selectedClient.street || selectedClient.street_nr || selectedClient.zip || selectedClient.city) && (
                                    <>
                                        <p><strong>Adresse:</strong></p>
                                        <p>
                                            {/* Zeigt Straße und Hausnummer an, falls vorhanden */}
                                            {(selectedClient.street || selectedClient.street_nr) && (
                                                <>
                                                    {selectedClient.street && `${selectedClient.street}`}
                                                    {selectedClient.street_nr && ` ${selectedClient.street_nr}`}
                                                    <br/> {/* Zeilenumbruch für PLZ und Ort */}
                                                </>
                                            )}
                                            {/* Zeigt PLZ und Ort an, falls vorhanden */}
                                            {(selectedClient.zip || selectedClient.city) && (
                                                <>
                                                    {selectedClient.zip && `${selectedClient.zip}`}
                                                    {selectedClient.city && ` ${selectedClient.city}`}
                                                </>
                                            )}
                                        </p>
                                    </>
                                )}


                                {selectedClient.birthdate && (
                                    <>
                                        <p><strong>Geburtsdatum:</strong></p>
                                        {/* Datum im deutschen Format anzeigen */}
                                        <p>{new Date(selectedClient.birthdate).toLocaleDateString('de-DE')}</p>
                                    </>
                                )}

                                {selectedClient.created_at && (
                                    <>
                                        <p><strong>Kunde seit:</strong></p>
                                        {/* Datum im deutschen Format anzeigen */}
                                        <p>{new Date(selectedClient.created_at).toLocaleDateString('de-DE')}</p>
                                    </>
                                )}
                            </div>
                            {/* Ende des Grid-Containers */}

                            <button
                                onClick={() => setShowClientDetailsModal(false)}
                                className="btn btn-primary mt-3"
                            >
                                Schließen
                            </button>
                        </div>
                    </div>
                )}
            {/* Ende des Kunden-Details-Modals */}

                {/* Der "Kalender öffnen"-Button, falls er weiterhin ein separates Modal öffnen soll */}
                <button
                  id="open-calendar-button"
                  className="open-calendar-button"
                  onClick={() => setIsCalendarModalOpen(true)}
                >
                  📅 Kalender öffnen
                </button>

                {/* --- NEUER BEREICH FÜR TERMINE (ANALOG ZUM KUNDENBEREICH) --- */}
                <div id="staff-appointments">
                    {authLoading ? (
                      <LoadingSpinner message="Lade Ihre Termine..." />
                    ) : (
                      <>
                        {dashboardError && (
                          <p className="error-message">Fehler beim Laden der Termine: {dashboardError}</p>
                        )}

                        {futureAppointments.length === 0 && pastAppointments.length === 0 ? (
                          <p id="no-staff-appointments-message">Keine Termine gefunden.</p>
                        ) : (
                          <>
                            {futureAppointments.length > 0 && (
                              <div className="appointment-group">
                                <h3>Zukünftige Termine (Ihre Coach-Termine)</h3>
                                {futureAppointments.map(app => renderAppointmentItem(app, 'future'))}
                              </div>
                            )}
                            {pastAppointments.length > 0 && (
                              <div className="appointment-group">
                                <h3>Vergangene Termine (Ihre Coach-Termine)</h3>
                                {pastAppointments.map(app => renderAppointmentItem(app, 'past'))}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>

                {showNoteSavedMessage && (
                  <div id="note-saved-message">Ihre Notiz wurde gespeichert.</div>
                )}
              </>
            )}
          </section>
        )}

        {user?.role === 'client' && (
          <section id="client-section" className="dashboard-section">
            <h2>Kundenbereich</h2>
            <button
              id="open-calendar-button"
              className="open-calendar-button"
              onClick={() => setIsCalendarModalOpen(true)}
            >
              Kalender öffnen
            </button>

            <div id="client-appointments">
                {authLoading ? (
                  <LoadingSpinner message="Lade Ihre Termine..." />
                ) : (
                  <>
                    {dashboardError && (
                      <p className="error-message">Fehler beim Laden der Termine: {dashboardError}</p>
                    )}
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


            {showNoteSavedMessage && (
              <div id="note-saved-message">Ihre Notiz wurde gespeichert.</div>
            )}
          </section>
        )}

        {isCalendarModalOpen && (
          <div className="calendar-modal-wrapper">
            <div className="modal-content">
              <span className="close-button" onClick={() => setIsCalendarModalOpen(false)}>&times;</span>
              <h2 ref={calendarTitleRef}>Kalender</h2>
              <CalendarComponent
                user={user}
                onEventClick={onEventClick}
                events={events}
                calendarRef={calendarRef}
                onEventDrop={handleEventDrop}
                handleDatesSet={handleDatesSet}
                handleSelectFromCalendar={handleSelectFromCalendar}
              />
            </div>
          </div>
        )}

        {isAppointmentDetailsModalOpen && appointment && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>📅 Termin-Details</h3>
              <p><strong>Kunde:</strong> {`${appointment.client_first_name || ''} ${appointment.client_last_name || ''}`.trim()}</p>
              <p><strong>Datum:</strong> {new Date(appointment.start_time).toLocaleDateString('de-CH', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}</p>
              <p><strong>Zeit:</strong> {`${new Date(appointment.start_time).toLocaleTimeString('de-CH', {
                hour: '2-digit', minute: '2-digit'
              })} – ${new Date(appointment.end_time).toLocaleTimeString('de-CH', {
                hour: '2-digit', minute: '2-digit'
              })}`}</p>
              <p><strong>Ort:</strong> {appointment.location}</p>
              <p><strong>Thema:</strong> {appointment.title}</p>

              {/* 💬 Hier kommen die Notizfelder für vergangene Termine */}
              <AppointmentNotes
                appointment={appointment}
                user={user}
                calendarAppointments={calendarAppointments}
                tempClientNoteContent={tempClientNoteContent}
                tempStaffNoteContent={tempStaffNoteContent}
                setTempClientNoteContent={setTempClientNoteContent}
                setTempStaffNoteContent={setTempStaffNoteContent}
                clientNoteEditorRef={clientNoteEditorRef}
                staffNoteEditorRef={staffNoteEditorRef}
                editingNoteIds={editingNoteIds}
                handleEditNoteClick={handleEditNoteClick}
                saveNote={saveNote}
                setShouldLoadStats={setShouldLoadStats}
              />

              <div className="button-row">
                <button onClick={() => setIsAppointmentDetailsModalOpen(false)}>Schliessen</button>
                <button
                  onClick={() => triggerCopyAppointment(appointment)}
                  className="copy-button-inline"
                  title="Termin kopieren"
                >📋 Kopieren</button>
              </div>
            </div>
          </div>
        )}



        {/* Das neue/umbenannte AppointmentModal */}
        {isAppointmentModalOpen && (user?.role === 'staff' || user?.role === 'admin' || user?.role === 'client') && ( 
          <AppointmentModal
            isOpen={isAppointmentModalOpen}
            onClose={() => {
              setIsAppointmentModalOpen(false);
              setInitialEventDataForModal(null);
              setSelectedDateAndTimeForModal(null);
            }}
            initialEventData={initialEventDataForModal}
            selectedDateAndTime={selectedDateAndTimeForModal}
            onSave={handleSaveAppointmentFromModal}
            user={user}
            allclients={allclients}
            lastUsedTitle={lastUsedTitle}
            lastUsedLocation={lastUsedLocation}
            lastUsedDuration={lastUsedDuration}
            // Die set-Funktionen für "Zuletzt verwendet" müssen im Dashboard bleiben,
            // da die Werte dort persistieren und von anderen Aktionen beeinflusst werden könnten.
            // Sie werden hier nicht direkt an das Modal übergeben, da das Modal seinen onSave-Callback aufruft.
          />
        )}


      {showConfirmationModal && pendingEventDrop && originalDroppedEvent && (user?.role === 'staff' || user?.role === 'admin') && ( // Nur für Staff/Admin
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Aktion für Termin "{originalDroppedEvent.title}"</h3>
            <p>Was möchten Sie tun?</p>
            <p>
              Ursprünglich: {new Date(originalDroppedEvent.start).toLocaleString('de-CH')}
              <br />
              Neue Position: {new Date(pendingEventDrop.start).toLocaleString('de-CH')}
            </p>
            <div>
              <input
                type="checkbox"
                id="sendSms"
                checked={sendSmsNotification}
                onChange={(e) => setSendSmsNotification(e.target.checked)}
              />
              <label htmlFor="sendSms"> Kunden per SMS benachrichtigen</label>
            </div>
            <div className="button-row">
              <button onClick={duplicateEventDrop} className="duplicate-button">Duplizieren</button>
              <button onClick={confirmEventDrop}>Verschieben</button>
              <button onClick={cancelEventDrop} className="cancel-button">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

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