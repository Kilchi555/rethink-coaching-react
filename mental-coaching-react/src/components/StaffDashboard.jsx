import React from 'react';

const StaffDashboard = ({
  user,
  staffStats,
  isstaffLoading,
  showAllMonthsModal,
  setShowAllMonthsModal,
  myStaffclients,
  handleClientCardClick,
  monthNames
}) => {
  return (
    <section id="staff-section" className="dashboard-section">
      <h2>Hallo {user?.first_name?.charAt(0).toUpperCase() + user?.first_name?.slice(1) || 'Benutzer'}!</h2>

      {isstaffLoading ? (
        <p>Lade Mitarbeiter-Daten...</p>
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

            {staffStats?.monthlyCompletedSessions?.length > 0 && (
              <button onClick={() => setShowAllMonthsModal(true)} className="btn btn-secondary view-all-months-btn">
                Alle Monate anzeigen
              </button>
            )}
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

          <div className="staff-clients-list">
            <h3>Ihre zugewiesenen Kunden:</h3>
            {myStaffclients.length > 0 ? (
              <div className="clients-card-list">
                {myStaffclients.map(client => (
                  <div
                    key={client.id}
                    className="client-card"
                    onClick={() => handleClientCardClick(client)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-header">
                      <h4>{client.first_name} {client.last_name}</h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Noch keine zugewiesenen Kunden gefunden.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default StaffDashboard;
