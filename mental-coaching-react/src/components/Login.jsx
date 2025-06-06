// src/components/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
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

  // isMounted-Ref ist hier weiterhin sinnvoll, um Async-Updates zu schützen
  const isMounted = useRef(true); 

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Diese Logik bleibt korrekt. Sie wird nur ausgelöst, wenn isLoggedIn und user.role
    // tatsächlich wahr sind, was nach der initialen Anmeldung oder nach einem erfolgreichen Login geschieht.
    if (isLoggedIn && user?.role) { 
      console.log(`🔁 Bereits eingeloggt oder Login erfolgreich → redirect nach /${user.role}`);
      navigate(`/${user.role}`);
    }
  }, [isLoggedIn, user, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Diese Zustandslöschungen sind hier in Ordnung, da sie vor dem Fetch passieren
    // und nicht Teil eines asynchronen Flusses sind, der nach einem Unmount passieren könnte.
    setError(null); // KEINE isMounted.current Prüfung hier
    setSuccessMessage(null); // KEINE isMounted.current Prüfung hier

    if (!email || !password) {
      setError('E-Mail und Passwort sind erforderlich.'); // KEINE isMounted.current Prüfung hier
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

        const { 
          id: userId, 
          email: userEmail, 
          role, 
          first_name, 
          last_name, 
          street, 
          street_nr, 
          zip, 
          city, 
          phone 
        } = data;

        // Login-Funktion im AuthContext aufrufen (enthält kein await checkUser mehr)
        login(userId, userEmail, role, first_name, last_name, street, street_nr, zip, city, phone); 
        
        // ZUSTANDS-UPDATE MIT isMounted.current PRÜFEN - HIER IST ES SINNVOLL!
        // da dieser Teil nach einem asynchronen Aufruf geschieht.
        if (isMounted.current) {
          setSuccessMessage(data.message || 'Login erfolgreich!'); 
        }
        
      } else {
        console.error('❌ Login fehlgeschlagen:', data.error);
        // ZUSTANDS-UPDATE MIT isMounted.current PRÜFEN - HIER IST ES SINNVOLL!
        if (isMounted.current) {
          setError(data.error || 'Login fehlgeschlagen. Bitte versuche es erneut.');
        }
      }
    } catch (err) {
      console.error('🚨 Netzwerkfehler beim Login:', err);
      // ZUSTANDS-UPDATE MIT isMounted.current PRÜFEN - HIER IST ES SINNVOLL!
      if (isMounted.current) {
        setError('Verbindungsfehler. Der Server ist möglicherweise nicht erreichbar.');
      }
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Anmelden</h2>
        {error && <p className="error-message">{error}</p>}
        {successMessage && !error && <p className="success-message">{successMessage}</p>}

        <div className="form-group">
          <label htmlFor="email">E-Mail:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value); // <-- KEINE isMounted.current Prüfung hier!
            }}
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
            onChange={(e) => {
              setPassword(e.target.value); // <-- KEINE isMounted.current Prüfung hier!
            }}
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