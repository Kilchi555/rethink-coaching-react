import React, { useEffect, useState } from 'react';

function StaffLocationManager({ staffId }) {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/staff/locations', {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Fehler beim Laden');
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      console.error('Fehler beim Laden:', err);
    }
  };

  const handleAddLocation = async () => {
    setError('');
    setSuccess('');

    const trimmed = newLocation.trim();
    if (!trimmed) {
      setError('Bitte gib einen Ort ein.');
      return;
    }

    try {
      const response = await fetch('/api/staff/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ location: trimmed }),
      });
      if (!response.ok) throw new Error('Fehler beim Speichern');

      setNewLocation('');
      setSuccess('Ort erfolgreich hinzugefügt.');
      fetchLocations();
    } catch (err) {
      console.error('Fehler beim Hinzufügen:', err);
      setError('Konnte den Ort nicht speichern.');
    }
  };

  const handleDeleteLocation = async (id) => {
    const confirmed = window.confirm('Willst du diesen Ort wirklich löschen?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/staff/locations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Fehler beim Löschen');

      setSuccess('Ort gelöscht.');
      fetchLocations();
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
      setError('Konnte den Ort nicht löschen.');
    }
  };

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className="location-manager" style={{ width: '100%', maxWidth: '100%', marginTop: '1rem' }}>
      {success && <div className="floating-success">{success}</div>}
      {error && <div className="floating-error">{error}</div>}

      <div style={{ display: 'flex'}}>
        <input
          type="text"
          placeholder="Neuer Ort..."
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
          className="calendar-input"
          style={{ flexGrow: 1 }}
        />
        <button onClick={handleAddLocation}>+ Hinzufügen</button>
      </div>

      <ul>
        {locations.map((loc) => (
          <li key={loc.id} style={{ marginBottom: '0.5rem' }}>
            {loc.location}
            <button
              style={{
                marginLeft: '1rem',
                backgroundColor: '#e53935',
                color: 'white',
                border: 'none',
                padding: '0.2rem 0.5rem',
                cursor: 'pointer',
              }}
              onClick={() => handleDeleteLocation(loc.id)}
            >
              x
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StaffLocationManager;
