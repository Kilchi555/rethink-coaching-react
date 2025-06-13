// src/components/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <--- Link hier importieren!
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { login, isLoggedIn, user, loading: authLoading } = useAuth(); 
  const navigate = useNavigate();

  const isMounted = useRef(true); 

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.role) { 
      console.log('fetchDataForRole wird aufgerufen für Rolle:', user.role); 
      console.log(`🔁 Bereits eingeloggt oder Login erfolgreich → redirect nach /${user.role}`);
      navigate(`/${user.role}`);
    } else { 
      console.log('Redirect-useEffect wird NICHT ausgelöst. Status:', { isLoggedIn, authLoading, user });
    }
  }, [isLoggedIn, user, navigate, authLoading]); 
  
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

        login(userId, userEmail, role, first_name, last_name, street, street_nr, zip, city, phone); 
        
        if (isMounted.current) {
          setSuccessMessage(data.message || 'Login erfolgreich!'); 
        }
        
      } else {
        console.error('❌ Login fehlgeschlagen:', data.error);
        if (isMounted.current) {
          setError(data.error || 'Login fehlgeschlagen. Bitte versuche es erneut.');
        }
      }
    } catch (err) {
      console.error('🚨 Netzwerkfehler beim Login:', err);
      if (isMounted.current) {
        setError('Verbindungsfehler. Der Server ist möglicherweise nicht erreichbar.');
      }
    }
  };

  return (
    <div className="login-container">
      {/* login-box als Wrapper wieder eingeführt, um Ihr CSS zu nutzen */}
      <div className="login-box">
        {/* NEU: Rethink Logo */}
        <div className="logo-container">
        <img src="/images/ReThink-Coaching-Logo.webp"
            alt="Rethink Logo"
            className="rethink-logo"
          />
        </div>

        <h2>Anmelden</h2>
        {error && <p className="error-message">{error}</p>}
        {successMessage && !error && <p className="success-message">{successMessage}</p>}

        {/* Die Form war vorher direkt im login-container, jetzt im login-box */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-Mail:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value); 
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
                setPassword(e.target.value); 
              }}
              required
              aria-label="Passwort"
            />
          </div>

          <button type="submit" className="login-button">Anmelden</button>
        </form>

        {/* NEU: Link zur Registrierungsseite */}
        <p className="register-link-text">
          Noch kein Konto? <Link to="/register" className="register-link">Jetzt registrieren</Link>
        </p>
      </div> {/* Ende login-box */}
    </div>
  );
}

export default Login;