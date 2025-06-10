// dashboard.js (wird von dashboard.html geladen)
document.addEventListener('DOMContentLoaded', async function() {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');

    // Prüfen, ob der Benutzer überhaupt eingeloggt ist (Basisschutz)
    if (!userId || !userRole) {
        console.warn("Keine Benutzerdaten im localStorage gefunden. Weiterleitung zum Login.");
        window.location.href = '/index.html'; // Oder deine Login-Seite
        return;
    }

    console.log(`Willkommen auf dem Dashboard, Rolle: ${userRole}, E-Mail: ${userEmail}`);

    // UI-Elemente
    const clientDashboard = document.getElementById('client-dashboard');
    const staffDashboard = document.getElementById('staff-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');
    const logoutButton = document.getElementById('logout-button'); // Füge einen Logout-Button hinzu!

    // Alle Dashboards erstmal ausblenden
    if (clientDashboard) clientDashboard.style.display = 'none';
    if (staffDashboard) staffDashboard.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'none';

    // Richtiges Dashboard anzeigen
    switch (userRole) {
        case 'client':
            if (clientDashboard) clientDashboard.style.display = 'block';
            await fetchAndDisplayPastAppointments(); // Lade Termine für Kunden
            await fetchAndDisplayFutureAppointments();
            break;
        case 'staff': // Oder 'staff'
            if (staffDashboard) staffDashboard.style.display = 'block';
            await fetchAndDisplayPastAppointments(); // Lade Termine für Mitarbeiter (ggf. andere Ansicht/Daten)
            await fetchAndDisplayFutureAppointments();
            break;
        case 'admin':
            if (adminDashboard) adminDashboard.style.display = 'block';
            // Hier könnten spezifische Admin-Funktionen geladen werden
            break;
        default:
            console.warn("Unbekannte Benutzerrolle. Weiterleitung zum Login.");
            window.location.href = '/index.html';
            break;
    }

    // Logout-Funktionalität
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout', { // Dein Backend-Logout-Endpunkt
                    method: 'POST',
                    credentials: 'include'
                });

                if (response.ok) {
                    localStorage.clear(); // Alle gespeicherten Benutzerdaten löschen
                    window.location.href = '/index.html'; // Zurück zur Login-Seite
                } else {
                    console.error('Logout fehlgeschlagen.');
                    // Fehlermeldung anzeigen
                }
            } catch (error) {
                console.error('Netzwerkfehler beim Logout:', error);
            }
        });
    }

    // Funktionen zum Abrufen und Anzeigen von Terminen (als Beispiele)
    async function fetchAndDisplayPastAppointments() {
        try {
            const response = await fetch('/api/past-appointments', { // SERVER-URL ANPASSEN!
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Vergangene Termine:', data.calendarEvents);
                // Hier Logik, um data.calendarEvents oder data.listData in pastAppointmentsSection anzuzeigen
                const pastAppointmentsSection = document.getElementById('past-appointments-section');
                if (pastAppointmentsSection) {
                    pastAppointmentsSection.innerHTML = '<h3>Vergangene Termine:</h3>';
                    if (data.listData && data.listData.length > 0) {
                        const ul = document.createElement('ul');
                        data.listData.forEach(appt => {
                            const li = document.createElement('li');
                            li.textContent = `${appt.title} von ${new Date(appt.start_time).toLocaleString()} bis ${new Date(appt.end_time).toLocaleString()}`;
                            ul.appendChild(li);
                        });
                        pastAppointmentsSection.appendChild(ul);
                    } else {
                        pastAppointmentsSection.innerHTML += '<p>Keine vergangenen Termine gefunden.</p>';
                    }
                     pastAppointmentsSection.style.display = 'block'; // Sektion anzeigen
                }
            } else {
                console.error('Fehler beim Abrufen vergangener Termine:', response.status);
            }
        } catch (error) {
            console.error('Netzwerkfehler beim Abrufen vergangener Termine:', error);
        }
    }

    async function fetchAndDisplayFutureAppointments() {
        try {
            const response = await fetch('/api/future-appointments', { // SERVER-URL ANPASSEN!
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Zukünftige Termine:', data.calendarEvents);
                // Hier Logik, um data.calendarEvents oder data.listData in futureAppointmentsSection anzuzeigen
                const futureAppointmentsSection = document.getElementById('future-appointments-section');
                if (futureAppointmentsSection) {
                    futureAppointmentsSection.innerHTML = '<h3>Zukünftige Termine:</h3>';
                    if (data.listData && data.listData.length > 0) {
                        const ul = document.createElement('ul');
                        data.listData.forEach(appt => {
                            const li = document.createElement('li');
                            li.textContent = `${appt.title} von ${new Date(appt.start_time).toLocaleString()} bis ${new Date(appt.end_time).toLocaleString()} (${appt.location || 'N/A'})`;
                            ul.appendChild(li);
                        });
                        futureAppointmentsSection.appendChild(ul);
                    } else {
                        futureAppointmentsSection.innerHTML += '<p>Keine zukünftigen Termine gefunden.</p>';
                    }
                    futureAppointmentsSection.style.display = 'block'; // Sektion anzeigen
                }
            } else {
                console.error('Fehler beim Abrufen zukünftiger Termine:', response.status);
            }
        } catch (error) {
            console.error('Netzwerkfehler beim Abrufen zukünftiger Termine:', error);
        }
    }
});