import React, { useState, useEffect } from 'react';

// Dies ist die Hauptkomponente deiner React-Anwendung für das Dashboard.
// Sie könnte in einer Datei wie 'src/App.js' liegen.
const App = () => {
  // State-Variablen zum Speichern der Benutzerdaten und Termine
  const [user, setUser] = useState(null);
  const [futureAppointments, setFutureAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect Hook, um Daten beim Laden der Komponente abzurufen
  useEffect(() => {
    const fetchUserDataAndAppointments = async () => {
      try {
        // Zuerst Benutzerdaten abrufen, um den Authentifizierungsstatus zu überprüfen
        // Der Server prüft das Session-Cookie, das automatisch vom Browser gesendet wird
        const userResponse = await fetch('/api/user', { // Verwende relative Pfade, wenn du einen Proxy nutzt
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Wichtig, damit das Session-Cookie gesendet wird
        });

        if (!userResponse.ok) {
          // Wenn der Benutzer nicht authentifiziert ist, leite ihn zur Login-Seite zurück
          if (userResponse.status === 401) {
            console.log('Nicht authentifiziert. Leite zum Login weiter.');
            window.location.href = '/index.html'; // Oder deine Login-Seite
          }
          throw new Error(`Fehler beim Abrufen der Benutzerdaten: ${userResponse.statusText}`);
        }

        const userData = await userResponse.json();
        setUser(userData);
        console.log('Benutzerdaten erfolgreich abgerufen:', userData);

        // Wenn Benutzerdaten erfolgreich abgerufen wurden, hole die zukünftigen Termine
        const appointmentsResponse = await fetch('/api/future-appointments', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!appointmentsResponse.ok) {
          throw new Error(`Fehler beim Abrufen der Termine: ${appointmentsResponse.statusText}`);
        }

        const appointmentsData = await appointmentsResponse.json();
        // Hier wird angenommen, dass appointmentsData ein Objekt mit 'calendarEvents' und 'listData' enthält
        setFutureAppointments(appointmentsData.listData || []); // Oder appointmentsData.calendarEvents, je nachdem was du anzeigen willst
        console.log('Zukünftige Termine erfolgreich abgerufen:', appointmentsData.listData);

      } catch (err) {
        console.error('Fehler beim Laden der Dashboard-Daten:', err);
        setError(err.message);
      } finally {
        setLoading(false); // Ladezustand beenden
      }
    };

    fetchUserDataAndAppointments();
  }, []); // Leeres Array bedeutet, dass der Effekt nur einmal beim Mounten ausgeführt wird

  // Funktion zum Abmelden
  const handleLogout = async () => {
    try {
      // Annahme: Du hast einen Logout-Endpunkt auf deinem Server
      const response = await fetch('/api/logout', { // Erstelle diesen Endpunkt auf deinem Express-Server!
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        console.log('Erfolgreich abgemeldet.');
        setUser(null); // Benutzerdaten im State löschen
        setFutureAppointments([]); // Termine löschen
        localStorage.clear(); // Optional: localStorage leeren, falls dort Daten gespeichert sind
        window.location.href = '/index.html'; // Zurück zur Login-Seite
      } else {
        const errorData = await response.json();
        console.error('Fehler beim Abmelden:', errorData.error);
        setError(errorData.error || 'Fehler beim Abmelden.');
      }
    } catch (err) {
      console.error('Netzwerkfehler beim Abmelden:', err);
      setError('Verbindungsfehler beim Abmelden.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Lade Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-red-100 text-red-800 p-4 rounded-lg shadow-md">
        <p className="text-xl font-bold mb-2">Fehler:</p>
        <p className="text-lg">{error}</p>
        <button
          onClick={() => window.location.href = '/index.html'}
          className="mt-4 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
        >
          Zurück zum Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          Willkommen im Dashboard, {user?.email}!
        </h1>

        <div className="flex justify-between items-center mb-8">
          <p className="text-lg text-gray-700">
            Deine Rolle: <span className="font-semibold text-blue-600">{user?.role}</span>
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-500 text-white font-semibold rounded-md shadow-md hover:bg-red-600 transition duration-300 ease-in-out transform hover:scale-105"
          >
            Abmelden
          </button>
        </div>

        <section className="mb-8 p-6 bg-blue-50 rounded-lg shadow-inner">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Deine zukünftigen Termine</h2>
          {futureAppointments.length === 0 ? (
            <p className="text-gray-600">Keine zukünftigen Termine gefunden.</p>
          ) : (
            <ul className="space-y-4">
              {futureAppointments.map((appointment) => (
                <li key={appointment.id} className="bg-white p-4 rounded-md shadow-sm border border-blue-200">
                  <p className="text-lg font-semibold text-gray-800">{appointment.title || 'Unbenannter Termin'}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Start:</span> {new Date(appointment.start_time).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Ende:</span> {new Date(appointment.end_time).toLocaleString()}
                  </p>
                  {appointment.location && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Ort:</span> {appointment.location}
                    </p>
                  )}
                  {appointment.staff_email && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Mitarbeiter:</span> {appointment.staff_email}
                    </p>
                  )}
                  {appointment.client_note && (
                    <p className="text-sm text-gray-600 italic">
                      <span className="font-medium">Deine Notiz:</span> {appointment.client_note}
                    </p>
                  )}
                  {appointment.staff_note && (
                    <p className="text-sm text-gray-600 italic">
                      <span className="font-medium">Mitarbeiter-Notiz:</span> {appointment.staff_note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Hier könnten weitere Sektionen für vergangene Termine, Notizen etc. hinzugefügt werden */}
        {/* Basierend auf der Rolle (user, staff, admin) könntest du hier bedingt Inhalte rendern */}
        {user?.role === 'staff' && (
          <section className="mt-8 p-6 bg-green-50 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-green-800 mb-4">Mitarbeiter-spezifische Inhalte</h2>
            <p className="text-gray-600">Hier erscheinen Inhalte und Funktionen nur für Mitarbeiter.</p>
            {/* Beispiel: Button zum Buchen eines Termins für einen Kunden */}
            <button
              onClick={() => console.log('Terminbuchung für Mitarbeiter')}
              className="mt-4 px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition duration-300 ease-in-out"
            >
              Neuen Termin buchen
            </button>
          </section>
        )}

        {user?.role === 'admin' && (
          <section className="mt-8 p-6 bg-purple-50 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-purple-800 mb-4">Admin-Bereich</h2>
            <p className="text-gray-600">Hier erscheinen Inhalte und Funktionen nur für Administratoren.</p>
            {/* Beispiel: Benutzerverwaltung */}
            <button
              onClick={() => console.log('Benutzerverwaltung aufrufen')}
              className="mt-4 px-6 py-3 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 transition duration-300 ease-in-out"
            >
              Benutzer verwalten
            </button>
          </section>
        )}

      </div>
    </div>
  );
};

export default App;
