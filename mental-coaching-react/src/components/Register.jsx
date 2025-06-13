// src/components/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importieren von Link für die Navigation zur Login-Seite
import './Register.css'; // Wir erstellen eine neue CSS-Datei für dieses Formular

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Für die Passwortbestätigung
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false); // Für den Ladezustand des Buttons
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);         // Fehler zurücksetzen
    setSuccessMessage(null); // Erfolgsmeldung zurücksetzen
    setLoading(true);       // Ladezustand aktivieren

    // Client-seitige Validierung
    if (!email || !password || !confirmPassword) {
      setError('Bitte füllen Sie alle Felder aus.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      setLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) { // Grundlegende E-Mail-Formatprüfung
      setError('Ungültiges E-Mail-Format.');
      setLoading(false);
      return;
    }

    try {
      console.log('📨 Sende Registrierungs-Anfrage an Backend:', { email, password });
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Registrierung erfolgreich:', data);
        setSuccessMessage(data.message || 'Registrierung erfolgreich!');
        // Optional: Nach erfolgreicher Registrierung zum Login weiterleiten
        setTimeout(() => {
          navigate('/login');
        }, 2000); // Weiterleitung nach 2 Sekunden
      } else {
        console.error('❌ Registrierung fehlgeschlagen:', data.error);
        setError(data.error || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } catch (err) {
      console.error('🚨 Netzwerkfehler bei der Registrierung:', err);
      setError('Verbindungsfehler. Der Server ist möglicherweise nicht erreichbar.');
    } finally {
      setLoading(false); // Ladezustand deaktivieren, unabhängig vom Ergebnis
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        {/* Logo, passend zur Login-Seite */}
        <div className="logo-container">
          <img src="/images/ReThink-Coaching-Logo.webp"
            alt="Rethink Logo"
            className="rethink-logo"
          />
        </div>

        <h2>Registrieren</h2>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>} {/* Erfolgsmeldung anzeigen */}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-Mail:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="E-Mail-Adresse für die Registrierung"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Passwort"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Passwort bestätigen:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              aria-label="Passwort bestätigen"
            />
          </div>

          <button type="submit" disabled={loading} className="register-button">
            {loading ? 'Registriert...' : 'Registrieren'}
          </button>
        </form>

        {/* Link zurück zur Login-Seite */}
        <p className="login-link-text">
          Bereits registriert? <Link to="/login" className="login-link">Hier anmelden</Link>
        </p>
      </div> {/* Ende register-box */}
    </div>
  );
}

export default Register;