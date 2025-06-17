import React from 'react';

const ClientDashboard = ({
  user,
  authLoading,
  futureAppointments,
  pastAppointments,
  renderAppointmentItem,
  showNoteSavedMessage,
  setIsCalendarModalOpen,
}) => {
  const userName = user?.first_name
    ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1)
    : 'Benutzer';

  return (
    <section id="client-section" className="dashboard-section">
      <div className="welcome-container">
        <h2>Hallo {userName}!</h2>
        <button
          id="open-calendar-button"
          className="open-calendar-button"
          onClick={() => setIsCalendarModalOpen(true)}
        >
          📅 Kalender öffnen
        </button>
      </div>

      <div id="client-appointments">
        {authLoading ? (
          <p>Lade Ihre Termine...</p>
        ) : (
          <>
            {futureAppointments.length === 0 && pastAppointments.length === 0 ? (
              <p id="no-appointments-message">Keine Termine gefunden.</p>
            ) : (
              <>
                {futureAppointments.length > 0 && (
                  <div className="appointment-group">
                    <h3>Zukünftige Termine</h3>
                    {futureAppointments.map((app) => renderAppointmentItem(app, 'future'))}
                  </div>
                )}
                {pastAppointments.length > 0 && (
                  <div className="appointment-group">
                    <h3>Vergangene Termine</h3>
                    {pastAppointments.map((app) => renderAppointmentItem(app, 'past'))}
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
