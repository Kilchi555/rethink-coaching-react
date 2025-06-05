// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { login, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn && user?.role) {
      console.log(`🔁 Bereits eingeloggt → redirect nach /${user.role}`);
      navigate(`/${user.role}`);
    }
  }, [isLoggedIn, user, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setError('E-Mail und Passwort sind erforderlich.');
      return;
    }

    try {
      console.log('📨 Sende Login-Anfrage an Backend:', { email, password });

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();

      if (response.ok) {
        console.log('✅ Login erfolgreich:', data);

        const { userId, email: userEmail, role } = data;

        if (!userId || !userEmail || !role) {
          throw new Error('Login-Antwort unvollständig.');
        }

        login(userId, userEmail, role);
        setSuccessMessage(data.message || 'Login erfolgreich!');
        console.log(`→ Navigiere zu /${role}`);
        navigate(`/${role}`);
              } else {
        console.error('❌ Login fehlgeschlagen:', data.error);
        setError(data.error || 'Login fehlgeschlagen. Bitte versuche es erneut.');
      }
    } catch (err) {
      console.error('🚨 Netzwerkfehler beim Login:', err);
      setError('Verbindungsfehler. Der Server ist möglicherweise nicht erreichbar.');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Anmelden</h2>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div className="form-group">
          <label htmlFor="email">E-Mail:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="E-Mail-Adresse"
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

        <button type="submit" className="login-button">Anmelden</button>
      </form>
    </div>
  );
}

export default Login;
