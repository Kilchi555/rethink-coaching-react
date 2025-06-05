import React, { useEffect, useState } from 'react';
import UserList from './UserList';
import AppointmentsList from './AppointmentsList';
import StatsPanel from './StatsPanel';
import NotesOverview from './NotesOverview';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [u, a, s, n] = await Promise.all([
      fetch('/api/admin/users').then(res => res.json()),
      fetch('/api/admin/appointments').then(res => res.json()),
      fetch('/api/admin/stats').then(res => res.json()),
      fetch('/api/admin/notes').then(res => res.json())
    ]);

    setUsers(u);
    setAppointments(a);
    setStats(s);
    setNotes(n);
  };

  return (
    <div className="admin-dashboard">
      <h1>🔐 Admin Dashboard</h1>
      <StatsPanel stats={stats} />
      <UserList users={users} onUpdate={fetchData} />
      <AppointmentsList appointments={appointments} />
      <NotesOverview notes={notes} />
    </div>
  );
};

export default AdminDashboard;
