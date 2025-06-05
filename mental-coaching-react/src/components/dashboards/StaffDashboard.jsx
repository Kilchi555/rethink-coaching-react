// src/components/dashboards/StaffDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../hooks/useAppointments';
import LoadingSpinner from '../LoadingSpinner';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [copiedAppointment, setCopiedAppointment] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    start_time: '',
    end_time: '',
    title: '',
    location: ''
  });
  const [editingId, setEditingId] = useState(null);
  const { appointments, loading } = useAppointments('staff', true);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `/api/admin/appointments/${editingId}`
      : '/api/admin/appointments';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, staff_id: user.id })
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  };

  const handleCopy = (a) => {
    setCopiedAppointment({ ...a, start_time: '', end_time: '' });
    alert('Kopiert! Füge ihn unten mit neuem Datum/Zeit ein.');
  };

  const handlePaste = () => {
    if (!copiedAppointment) return;
    setFormData({
      user_id: copiedAppointment.user_id,
      title: copiedAppointment.title,
      location: copiedAppointment.location,
      start_time: '',
      end_time: ''
    });
  };

  const handleEdit = (a) => {
    setEditingId(a.id);
    setFormData({
      user_id: a.user_id,
      title: a.title,
      location: a.location,
      start_time: a.start_time?.slice(0, 16),
      end_time: a.end_time?.slice(0, 16)
    });
  };

  return (
    <section className="dashboard-section staff-dashboard">
      <h2>👨‍🏫 Mitarbeiter-Dashboard</h2>
      {loading ? (
        <LoadingSpinner message="Lade Termine..." />
      ) : (
        <>
          <p>📅 Geplante Sitzungen: <strong>{appointments.length}</strong></p>
          <div className="create-appointment-form">
            <h3>{editingId ? '✏️ Bearbeiten' : '➕ Neuer Termin'}</h3>
            <button onClick={handlePaste} disabled={!copiedAppointment}>📋 Einfügen</button>
            <input name="user_id" placeholder="Kunden-ID" value={formData.user_id} onChange={handleChange} />
            <input name="title" placeholder="Titel" value={formData.title} onChange={handleChange} />
            <input name="location" placeholder="Ort" value={formData.location} onChange={handleChange} />
            <input name="start_time" type="datetime-local" value={formData.start_time} onChange={handleChange} />
            <input name="end_time" type="datetime-local" value={formData.end_time} onChange={handleChange} />
            <button onClick={handleSubmit}>{editingId ? '💾 Aktualisieren' : '✅ Erstellen'}</button>
          </div>
          <div className="staff-appointment-preview">
            {appointments.map((a) => (
              <div key={a.id} className="staff-appointment">
                <strong>{a.title}</strong> <br />
                🧑‍💼 {a.customer_first_name} {a.customer_last_name} <br />
                🕒 {new Date(a.start_time).toLocaleString('de-CH')} <br />
                📍 {a.location} <br />
                <button onClick={() => handleCopy(a)}>📋 Kopieren</button>
                <button onClick={() => handleEdit(a)}>✏️ Bearbeiten</button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default StaffDashboard;
