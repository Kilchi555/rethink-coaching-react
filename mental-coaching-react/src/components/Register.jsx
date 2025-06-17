import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client',
    first_name: '',
    last_name: '',
    street: '',
    street_nr: '',
    zip: '',
    city: '',
    phone: '',
    birthdate: ''
  });

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    // Validierung
    for (let key in formData) {
      if (key !== 'confirmPassword' && !formData[key]) {
        setError(`Feld "${key}" darf nicht leer sein.`);
        setLoading(false);
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Ungültiges E-Mail-Format.');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...payload } = formData;

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Registrierung erfolgreich!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'Registrierung fehlgeschlagen.');
      }
    } catch (err) {
      setError('Verbindungsfehler. Der Server ist möglicherweise nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="logo-container">
          <img src="/images/ReThink-Coaching-Logo.webp" alt="Rethink Logo" className="rethink-logo" />
        </div>

        <h2>Registrieren</h2>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>E-Mail:</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
          <div className="form-group"><label>Passwort:</label><input type="password" name="password" value={formData.password} onChange={handleChange} required /></div>
          <div className="form-group"><label>Passwort bestätigen:</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required /></div>
          <div className="form-group"><label>Rolle:</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="client">Client</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group"><label>Vorname:</label><input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required /></div>
          <div className="form-group"><label>Nachname:</label><input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required /></div>
          <div className="form-group"><label>Strasse:</label><input type="text" name="street" value={formData.street} onChange={handleChange} required /></div>
          <div className="form-group"><label>Nr.:</label><input type="text" name="street_nr" value={formData.street_nr} onChange={handleChange} required /></div>
          <div className="form-group"><label>PLZ:</label><input type="text" name="zip" value={formData.zip} onChange={handleChange} required /></div>
          <div className="form-group"><label>Ort:</label><input type="text" name="city" value={formData.city} onChange={handleChange} required /></div>
          <div className="form-group"><label>Telefon:</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} required /></div>
          <div className="form-group"><label>Geburtsdatum:</label><input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} required /></div>
          <label htmlFor="coach">Bevorzugter Fahrlehrer (optional):</label>
          <select
            id="coach"
            value={assignedStaffId}
            onChange={(e) => setAssignedStaffId(e.target.value)}
          >
            <option value="">-- Kein Coach ausgewählt --</option>
            {allStaff.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.first_name} {staff.last_name}
              </option>
            ))}
          </select>

          <button type="submit" disabled={loading} className="register-button">
            {loading ? 'Registrieren...' : 'Registrieren'}
          </button>
        </form>

        <p className="login-link-text">
          Bereits registriert? <Link to="/login" className="login-link">Hier anmelden</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
