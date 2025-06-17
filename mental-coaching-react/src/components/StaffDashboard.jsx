import React from 'react';
import StaffLocationManager from '../components/StaffLocationManager';
import AppointmentNotes from '../components/AppointmentNotes';
import LoadingSpinner from '../components/LoadingSpinner';

const StaffDashboard = ({
  user,
  staffStats,
  showAllMonthsModal,
  setShowAllMonthsModal,
  isstaffLoading,
  myStaffclients,
  handleClientCardClick,
  showClientDetailsModal,
  setShowClientDetailsModal,
  selectedClient,
  futureAppointments,
  pastAppointments,
  authLoading,
  dashboardError,
  renderAppointmentItem,
  showNoteSavedMessage,
  monthNames,
  setIsCalendarModalOpen
}) => {
  return (
    <section id="staff-section" className="dashboard-section">
      <div className="welcome-container">
        <h2>Hallo {user?.first_name?.charAt(0).toUpperCase() + user?.first_name?.slice(1) || 'Benutzer'}!</h2>
        <button
          id="open-calendar-button"
          className="open-calendar-button"
          onClick={() => setIsCalendarModalOpen(true)}
        >
          📅 Kalender öffnen
        </button>
      </div>

      {isstaffLoading ? (
        <LoadingSpinner message="Lade Mitarbeiter-Daten..." />
      ) : (
        <>
          <div className="staff-stats-container">
            {staffStats?.monthlyCompletedSessions?.length > 0 ? (
              (() => {
                const currentMonthIndex = new Date().getMonth();
                const lastMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;

                const currentMonthData = staffStats.monthlyCompletedSessions.find(
                  (data) => parseInt(data.month) === currentMonthIndex + 1
                );
                const lastMonthData = staffStats.monthlyCompletedSessions.find(
                  (data) => parseInt(data.month) === lastMonthIndex + 1
                );

                return (
                  <div className="stats-text">
                    <span className="month-stat">
                      <strong>Aktueller Monat</strong> ({monthNames[currentMonthIndex]}):{' '}
                      {currentMonthData ? `${currentMonthData.count} Termine` : '0 Termine'}
                    </span>
                    <span className="month-stat">
                      <strong>Letzter Monat</strong> ({monthNames[lastMonthIndex]}):{' '}
                      {lastMonthData ? `${lastMonthData.count} Termine` : '0 Termine'}
                    </span>
                  </div>
                );
              })()
            ) : (
              <p className="stats-text">Keine erledigten Termine für das aktuelle Jahr gefunden.</p>
            )}

            <button
              onClick={() => setShowAllMonthsModal(true)}
              className="btn btn-secondary view-all-months-btn"
            >
              Alle Monate anzeigen
            </button>
          </div>

          {showAllMonthsModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Alle bisherigen Monatsstatistiken</h3>
                <ul>
                  {staffStats.monthlyCompletedSessions.map((data) => (
                    <li key={data.month}>
                      <strong>{monthNames[parseInt(data.month) - 1]}:</strong> {data.count} Termine
                    </li>
                  ))}
                </ul>
                <button onClick={() => setShowAllMonthsModal(false)} className="btn">
                  Schließen
                </button>
              </div>
            </div>
          )}

          <h3>📍 Deine Treffpunkte</h3>
          <StaffLocationManager staffId={user.id} />

          <div className="staff-clients-list">
            <h3>Ihre zugewiesenen Kunden:</h3>
            {myStaffclients.length > 0 ? (
              <div className="clients-card-list">
                {myStaffclients.map((client) => (
                  <div
                    key={client.id}
                    className="client-card"
                    onClick={() => handleClientCardClick(client)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-header">
                      <h4>
                        {client.first_name} {client.last_name}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Noch keine zugewiesenen Kunden gefunden.</p>
            )}
          </div>

          {showClientDetailsModal && selectedClient && (
            <div className="modal-overlay">
              <div className="modal-content client-details-modal-content">
                <h3>
                  Details für {selectedClient.first_name} {selectedClient.last_name}
                </h3>
                <div className="client-detail-grid">
                  <p><strong>E-Mail:</strong></p>
                  <p>{selectedClient.email}</p>
                  <p><strong>Telefon:</strong></p>
                  <p>{selectedClient.phone || '-'}</p>
                  {(selectedClient.street || selectedClient.street_nr || selectedClient.zip || selectedClient.city) && (
                    <>
                      <p><strong>Adresse:</strong></p>
                      <p>
                        {selectedClient.street} {selectedClient.street_nr}<br />
                        {selectedClient.zip} {selectedClient.city}
                      </p>
                    </>
                  )}
                  {selectedClient.birthdate && (
                    <>
                      <p><strong>Geburtsdatum:</strong></p>
                      <p>{new Date(selectedClient.birthdate).toLocaleDateString('de-DE')}</p>
                    </>
                  )}
                  {selectedClient.created_at && (
                    <>
                      <p><strong>Kunde seit:</strong></p>
                      <p>{new Date(selectedClient.created_at).toLocaleDateString('de-DE')}</p>
                    </>
                  )}
                </div>
                <button onClick={() => setShowClientDetailsModal(false)} className="btn btn-primary mt-3">
                  Schließen
                </button>
              </div>
            </div>
          )}

          <div id="staff-appointments">
            {authLoading ? (
              <LoadingSpinner message="Lade Ihre Termine..." />
            ) : (
              <>
                {dashboardError && <p className="error-message">{dashboardError}</p>}
                {futureAppointments.length === 0 && pastAppointments.length === 0 ? (
                  <p id="no-staff-appointments-message">Keine Termine gefunden.</p>
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

          {showNoteSavedMessage && <div id="note-saved-message">Ihre Notiz wurde gespeichert.</div>}

          {showClientDetailsModal && selectedClient && (
            <div className="modal-overlay">
              <div className="modal-content client-details-modal-content">
                <h3>Details für {selectedClient.first_name} {selectedClient.last_name}</h3>
                <div className="client-detail-grid">
                  <p><strong>E-Mail:</strong></p>
                  <p>{selectedClient.email}</p>

                  <p><strong>Telefon:</strong></p>
                  <p>{selectedClient.phone || '-'}</p>

                  {(selectedClient.street || selectedClient.street_nr || selectedClient.zip || selectedClient.city) && (
                    <>
                      <p><strong>Adresse:</strong></p>
                      <p>
                        {selectedClient.street && `${selectedClient.street}`}
                        {selectedClient.street_nr && ` ${selectedClient.street_nr}`}<br/>
                        {selectedClient.zip && `${selectedClient.zip}`}
                        {selectedClient.city && ` ${selectedClient.city}`}
                      </p>
                    </>
                  )}

                  {selectedClient.birthdate && (
                    <>
                      <p><strong>Geburtsdatum:</strong></p>
                      <p>{new Date(selectedClient.birthdate).toLocaleDateString('de-DE')}</p>
                    </>
                  )}

                  {selectedClient.created_at && (
                    <>
                      <p><strong>Kunde seit:</strong></p>
                      <p>{new Date(selectedClient.created_at).toLocaleDateString('de-DE')}</p>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setShowClientDetailsModal(false)}
                  className="btn btn-primary mt-3"
                >
                  Schließen
                </button>
              </div>
            </div>
          )}

        </>
      )}
    </section>
  );
};

export default StaffDashboard;
