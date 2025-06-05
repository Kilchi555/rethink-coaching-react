// src/components/dashboards/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../hooks/useAppointments';
import LoadingSpinner from '../LoadingSpinner';
import NoteEditor from '../NoteEditor';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    user_id: '',
    staff_id: '',
    start_time: '',
    end_time: '',
    title: '',
    location: ''
  });
  const { appointments: futureAppointments, loading: loadingFuture } = useAppointments('admin', true);
  const { appointments: pastAppointments, loading: loadingPast } = useAppointments('admin', false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/admin/users', { credentials: 'include' })
        .then(res => res.json())
        .then(setAllUsers)
        .catch(err => console.error('❌ Fehler beim Laden der Nutzer:', err));
    }
  }, [user]);

  const handleInputChange = (e) => {
    setNewAppointment({ ...newAppointment, [e.target.name]: e.target.value });
  };

  const handleCreateAppointment = async () => {
    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newAppointment)
      });
      if (!response.ok) throw new Error(await response.text());
      window.location.reload();
    } catch (err) {
      alert('Fehler beim Erstellen des Termins: ' + err.message);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Termin wirklich löschen?')) return;
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (err) {
      alert('Fehler beim Löschen: ' + err.message);
    }
  };

  const renderAppointment = (a) => (
    <div key={a.id} className="admin-appointment">
      <strong>{a.title || 'Kein Titel'}</strong><br />
      🧑‍💼 Kunde: {a.customer_first_name} {a.customer_last_name} <br />
      👨‍🏫 Coach: {a.staff_first_name} {a.staff_last_name} <br />
      🕒 {new Date(a.start_time).toLocaleString('de-CH')} <br />
      📍 {a.location}<br />
      <NoteEditor
        appointmentId={a.id}
        initialContent={a.client_note || ''}
        noteType="client"
      />
      <NoteEditor
        appointmentId={a.id}
        initialContent={a.employee_note || ''}
        noteType="staff"
      />
      <button onClick={() => handleDeleteAppointment(a.id)} className="delete-button">🗑️ Löschen</button>
    </div>
  );

  return (
    <section className="dashboard-section admin-dashboard">
      <h2>🛠️ Admin-Dashboard</h2>
      <div className="create-appointment-form">
        <h3>➕ Termin erstellen</h3>
        <select name="user_id" value={newAppointment.user_id} onChange={handleInputChange}>
          <option value="">Kunde wählen</option>
          {allUsers.filter(u => u.role === 'customer').map(u => (
            <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
          ))}
        </select>
        <select name="staff_id" value={newAppointment.staff_id} onChange={handleInputChange}>
          <option value="">Coach wählen</option>
          {allUsers.filter(u => u.role === 'staff').map(u => (
            <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
          ))}
        </select>
        <input name="title" placeholder="Titel" value={newAppointment.title} onChange={handleInputChange} />
        <input name="location" placeholder="Ort" value={newAppointment.location} onChange={handleInputChange} />
        <input name="start_time" type="datetime-local" value={newAppointment.start_time} onChange={handleInputChange} />
        <input name="end_time" type="datetime-local" value={newAppointment.end_time} onChange={handleInputChange} />
        <button onClick={handleCreateAppointment}>✅ Speichern</button>
      </div>
      {(loadingFuture || loadingPast) ? (
        <LoadingSpinner message="Lade Termine..." />
      ) : (
        <>
          <p>📊 Zukünftige Termine: <strong>{futureAppointments.length}</strong></p>
          <div className="admin-appointment-preview">
            {futureAppointments.map(renderAppointment)}
          </div>
          <h3>📂 Vergangene Termine</h3>
          <div className="admin-appointment-preview">
            {pastAppointments.map(renderAppointment)}
          </div>
        </>
      )}
    </section>
  );
};

export default AdminDashboard;
