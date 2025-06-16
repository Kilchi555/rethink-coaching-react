import React, { useEffect, useState } from 'react';

const AdminCancelLimitSetting = () => {
  const [cancelLimit, setCancelLimit] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCancelLimit = async () => {
      try {
        const res = await fetch('/api/settings/cancel_limit_hours', {
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok) {
          setCancelLimit(data.value);
        } else {
          setStatusMessage(data.error || 'Fehler beim Laden');
        }
      } catch (err) {
        setStatusMessage('Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    };

    fetchCancelLimit();
  }, []);

  const saveCancelLimit = async () => {
    const res = await fetch('/api/settings/cancel_limit_hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ value: cancelLimit }),
    });

    const data = await res.json();
    setStatusMessage(res.ok ? 'Gespeichert ✅' : data.error || 'Fehler beim Speichern');
  };

  if (loading) return <p>Lade Einstellungen...</p>;

  return (
    <div
      style={{
        border: '1px solid #ccc',
        padding: '1rem',
        borderRadius: '8px',
        maxWidth: '400px',
      }}
    >
      <h3>🕒 Stornofrist (in Stunden)</h3>
      <input
        type="number"
        value={cancelLimit}
        onChange={(e) => setCancelLimit(e.target.value)}
        style={{ padding: '0.5rem', width: '100%', marginTop: '0.5rem' }}
        min="0"
      />
      <button
        onClick={saveCancelLimit}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
      >
        Speichern
      </button>
      {statusMessage && (
        <p style={{ marginTop: '0.5rem', color: res.ok ? 'green' : 'red' }}>
          {statusMessage}
        </p>
      )}
    </div>
  );
};

export default AdminCancelLimitSetting;
