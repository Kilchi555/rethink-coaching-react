import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminCancelLimitSetting from '../components/AdminCancelLimitSetting';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const {
    user,
    adminStats,
    isAdminLoading,
    fetchAdminStatistics,
  } = useContext(AuthContext); // oder deine Props, je nach Struktur

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminStatistics();
    }
  }, [user, fetchAdminStatistics]);

  if (!user || user.role !== 'admin') {
    return <p>Zugriff verweigert</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>

      {isAdminLoading ? (
        <LoadingSpinner message="Lade Admin-Daten..." />
      ) : (
        <p>{adminStats ? `👥 Gesamtzahl der Nutzer: ${adminStats.totalUsers}` : 'Keine Statistik gefunden.'}</p>
      )}

      <section style={{ marginTop: '2rem' }}>
        <AdminCancelLimitSetting />
      </section>
    </div>
  );
};

export default AdminDashboard;
