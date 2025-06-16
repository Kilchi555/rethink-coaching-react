import React from 'react';
import AppointmentNotes from './AppointmentNotes'; // falls gebraucht

const ClientDashboard = ({
  user,
  authLoading,
  futureAppointments,
  pastAppointments,
  calendarAppointments,
  calendarRef,
  handleDelete,
  editingNoteIds,
  expandedAppointmentIds,
  tempClientNoteContent,
  tempStaffNoteContent,
  setTempClientNoteContent,
  setTempStaffNoteContent,
  clientNoteEditorRef,
  staffNoteEditorRef,
  handleEditNoteClick,
  saveNote,
  showNoteSavedMessage,
  renderAppointmentItem,
  setIsCalendarModalOpen
}) => {
  return (
    <section id="client-section" className="dashboard-section">
      <h2>Hallo {user?.first_name?.charAt(0).toUpperCase() + user?.first_name?.slice(1) || 'Benutzer'}!</h2>
      <button
        id="open-calendar-button"
        className="open-calendar-button"
        onClick={() => setIsCalendarModalOpen(true)}
      >
        Kalender öffnen
      </button>

      <div id="client-appointments">
        {authLoading ? (
          <p>Lade Ihre Termine...</p>
        ) : (
          <>
            {futureAppointments.length === 0 && pastAppointments.length === 0 ? (
              <p>Keine Termine gefunden.</p>
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
  );
};

export default ClientDashboard;
