// src/components/CalendarComponent.jsx
import React from 'react'; // Nur React importieren, keine Hooks mehr hier
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';


const CalendarComponent = ({
  user,                     // Für editable/selectable basierend auf Rolle
  onEventClick,             // Callback für Klick auf bestehenden Termin (öffnet Details oder Bearbeitung)
  events,                   // Die Termine, die der Kalender anzeigen soll
  calendarRef,              // Ref, um auf die FullCalendar-Instanz zuzugreifen
  onEventDrop,              // Callback für Drag-and-Drop von Terminen
  handleDatesSet,           // Callback, um den Kalendertitel im Dashboard zu aktualisieren
  handleSelectFromCalendar, // Callback, um bei Auswahl eines Zeitbereichs das NEUE Termin-Modal zu öffnen

  // isCalendarModalOpen, // <-- Nicht mehr hier nötig, wenn der Kalender direkt im Dashboard ist.
  // setIsCalendarModalOpen, // <-- Nicht mehr hier nötig.
  // selectedclientId, // <-- Nicht mehr hier nötig.
  // allclients, // <-- Nicht mehr hier nötig.
}) => {

  // ALLE LOKALEN STATES (useState) und FUNKTIONEN, die mit dem Termin-Formular zu tun haben,
  // wurden bereits entfernt. Dazu gehören:
  // calendarTitle, newEventModalOpen, newEventDateTime, durationMinutes, newEventDate,
  // newEventTitle, newEventLocation, formErrors, newEventDuration
  // toDatetimeLocal, handleSelect, handleSaveAppointment

  return (
    // Entfernen des äußeren Modal-Wrappers um den Kalender herum.
    // Der Kalender wird direkt im Dashboard gerendert.
    // Falls der Kalender selbst in einem Modal sein MUSS, dann diese Struktur
    // bitte im Dashboard um <CalendarComponent /> legen.
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
          selectable={user?.role === 'staff' || user?.role === 'admin'} // Nur Staff/Admin können Bereiche auswählen
          editable={user?.role === 'staff' || user?.role === 'admin'}   // Nur Staff/Admin können Events verschieben
          selectMirror={true} // Visuelles Feedback beim Auswählen

          // --- Callbacks, die vom Dashboard kommen ---
          select={handleSelectFromCalendar} // <<-- WICHTIG! Öffnet neues Termin-Modal
          datesSet={handleDatesSet}        // <<-- WICHTIG! Aktualisiert Kalendertitel
          eventClick={onEventClick}        // Klick auf einen bestehenden Termin (öffnet Details oder Bearbeitung)
          eventDrop={onEventDrop}          // Termin per Drag-and-Drop verschieben

          events={events} // Die Events selbst werden direkt als Prop übergeben

          // dateClick ist jetzt überflüssig, da 'select' die Funktionalität abdeckt
          // und handleSelectFromCalendar die Logik übernimmt.
          // onDateClick={onDateClick} // <<-- KANN ENTFERNT WERDEN!

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
  );
};

export default CalendarComponent;