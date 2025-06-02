// src/components/CalendarComponent.jsx
import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';


const CalendarComponent = ({ setIsCalendarModalOpen, user, onEventClick }) => {
  const calendarRef = useRef(null);

  const [calendarTitle, setCalendarTitle] = useState('');
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  const [newEventTitle, setNewEventTitle] = useState(''); // Thema
  const [newEventLocation, setNewEventLocation] = useState('');
  const [events, setEvents] = useState([]);
  const [formErrors, setFormErrors] = useState({});

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
    setNewEventStart(toDatetimeLocal(info.startStr));
    setNewEventEnd(toDatetimeLocal(info.endStr));
    setNewEventModalOpen(true);
  };

  const handleSaveAppointment = async () => {
    const errors = {};

    if (!newEventTitle.trim()) {
      errors.title = 'Thema ist erforderlich.';
    }

    if (!newEventLocation.trim()) {
      errors.location = 'Ort ist erforderlich.';
    }

    if (newEventStart === newEventEnd) {
      errors.time = 'Start- und Endzeit dürfen nicht identisch sein.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      const payload = {
        title: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        thema: newEventTitle,
        location: newEventLocation,
        start_time: newEventStart,
        end_time: newEventEnd,
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

      setNewEventTitle('');
      setNewEventLocation('');
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
      const eventsFromBackend = data.listData.map(appointment => ({
        title:
          (appointment.first_name && appointment.last_name)
            ? `${appointment.first_name} ${appointment.last_name}`
            : appointment.email || 'Unbekannter Termin',
        start: appointment.start_time,
        end: appointment.end_time,
        extendedProps: {
          location: appointment.location,
          thema: appointment.thema,
        },
      }));
      
  
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

        <FullCalendar
                  ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={deLocale}
          timeZone="local"
          height="auto"
          headerToolbar={{ left: '', center: 'prev,next today', right: '' }}
          selectable={true}
          selectMirror={true}
          select={handleSelect}
          datesSet={handleDatesSet}
          events={events}
          eventClick={onEventClick}
          dayHeaderFormat={{ weekday: 'short', day: '2-digit' }}
          slotLabelFormat={{
            hour: 'numeric',
            minute: undefined,
            hour12: false
          }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
        />

        {newEventModalOpen && (
          <div className="calendar-form">
            <h3>Neuen Termin erstellen</h3>

            <label>Kunde:</label>
            <input
              value={user?.name || 'Unbekannt'}
              disabled
              style={{ backgroundColor: '#f0f0f0' }}
            />

            <label>Thema:</label>
            <input
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="z. B. Stressmanagement, berufliche Neuorientierung"
            />
            {formErrors.title && <p style={{ color: 'red' }}>{formErrors.title}</p>}

            <label>Ort:</label>
            <select
              value={newEventLocation}
              onChange={(e) => setNewEventLocation(e.target.value)}
            >
              <option value="">-- Bitte wählen --</option>
              <option value="Zürich-Altstetten">Zürich-Altstetten</option>
              <option value="Zoom Online Meeting">Zoom Online Meeting</option>
              <option value="Telefonisches Coaching">Telefonisches Coaching</option>
            </select>
            {formErrors.location && <p style={{ color: 'red' }}>{formErrors.location}</p>}

            <label>Startzeit:</label>
            <input
              type="datetime-local"
              value={newEventStart}
              onChange={(e) => setNewEventStart(e.target.value)}
            />

            <label>Endzeit:</label>
            <input
              type="datetime-local"
              value={newEventEnd}
              onChange={(e) => setNewEventEnd(e.target.value)}
            />


            <button onClick={handleSaveAppointment}>Speichern</button>
            <button onClick={() => setNewEventModalOpen(false)}>Abbrechen</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarComponent;
