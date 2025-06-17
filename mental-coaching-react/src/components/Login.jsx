import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, isLoggedIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.role) {
      navigate(`/${user.role}`);
    }
  }, [isLoggedIn, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!email || !password) {
      setError('E-Mail und Passwort sind erforderlich.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const {
          message,
          user: {
            id,
            email: userEmail,
            role,
            first_name,
            last_name,
            street,
            street_nr,
            zip,
            city,
            phone,
            assigned_staff_id
          }
        } = data;

        login(id, userEmail, role, first_name, last_name, street, street_nr, zip, city, phone);

        if (isMounted.current) {
          setSuccessMessage(message || 'Login erfolgreich!');
        }
      } else {
        if (isMounted.current) {
          setError(data.error || 'Login fehlgeschlagen.');
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setError('Verbindungsfehler. Der Server ist möglicherweise nicht erreichbar.');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <img src="/images/ReThink-Coaching-Logo.webp" alt="Rethink Logo" className="rethink-logo" />
        </div>

        <h2>Anmelden</h2>
        {error && <p className="error-message">{error}</p>}
        {successMessage && !error && <p className="success-message">{successMessage}</p>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-Mail:</label>
            <input
              type="email"
              id="email"
              ref={emailRef}
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

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>

        <p className="register-link-text">
          Noch kein Konto? <Link to="/register" className="register-link">Jetzt registrieren</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
