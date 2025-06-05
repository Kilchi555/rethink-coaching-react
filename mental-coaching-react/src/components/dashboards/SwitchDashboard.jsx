// src/components/dashboards/SwitchDashboard.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SwitchDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // ⏳ warten bis Auth geladen

    console.log('👤 Redirecting based on role:', user?.role);

    if (!user || !user.role) {
      console.warn('⚠️ Kein gültiger Nutzer vorhanden. Navigiere zu /unauthorized');
      navigate('/unauthorized', { replace: true });
      return;
    }

    switch (user.role) {
      case 'admin':
        console.log('➡️ Navigiere zu /admin');
        navigate('/admin', { replace: true });
        break;
      case 'staff':
        console.log('➡️ Navigiere zu /staff');
        navigate('/staff', { replace: true });
        break;
      case 'customer':
        console.log('➡️ Navigiere zu /customer');
        navigate('/customer', { replace: true });
        break;
      default:
        // 🕵️‍♂️ Unerwartete Rolle loggen für spätere Analyse
        fetch('/api/log-unrecognized-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: user.role, user: user.email }),
        }).catch(err => console.error('📉 Fehler beim Logging der unbekannten Rolle:', err));

        console.error('❌ Unbekannte Rolle:', user.role);
        navigate('/unauthorized', { replace: true });
    }
  }, [user, loading, navigate]);

  return <div>🔁 Weiterleitung zum richtigen Dashboard…</div>;
};

export default SwitchDashboard;
