import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: null,
    email: '',
    role: '',
    created_at: '',
    first_name: '',
    last_name: '',
    street: '',
    street_nr: '',
    zip: '',
    city: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [futureAppointments, setFutureAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const navigate = useNavigate();

  // 🔁 Holt User-Daten aus Session
  const checkUser = async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
  
      if (response.ok) {
        const data = await response.json();
        setUser({
          id: data.id,
          email: data.email,
          role: data.role,
          created_at: data.created_at,
          first_name: data.first_name,
          last_name: data.last_name,
          street: data.street,
          street_nr: data.street_nr,
          zip: data.zip,
          city: data.city,
          phone: data.phone
        });
        console.log('✅ User session found:', data);
        await fetchAppointments(); // Termine laden
      } else {
        console.log('⚠️ No user session found or not authenticated.');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Failed to check user session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  

  // 🔐 Login
  const login = async (userId, email, role) => {
    setUser({ id: userId, email, role });
    await checkUser(); // Session erneut prüfen und Termine laden
  };

  // 🚪 Logout
  const logout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        setUser(null);
        setFutureAppointments([]);
        setPastAppointments([]);
        console.log('👋 Logged out successfully.');
        navigate('/login');
      } else {
        console.error('❌ Logout failed on server.');
      }
    } catch (error) {
      console.error('❌ Error during logout fetch:', error);
    }
  };

  // 📅 Termine laden
  const fetchAppointments = async () => {
    try {
      const [futureRes, pastRes] = await Promise.all([
        fetch('/api/future-appointments', { credentials: 'include' }),
        fetch('/api/past-appointments', { credentials: 'include' }),
      ]);

      if (futureRes.ok) {
        const futureData = await futureRes.json();
        setFutureAppointments(futureData.listData || []);
      }
      if (pastRes.ok) {
        const pastData = await pastRes.json();
        setPastAppointments(pastData.listData || []);
      }
    } catch (err) {
      console.error('❌ Fehler beim Laden der Termine:', err);
      setFutureAppointments([]);
      setPastAppointments([]);
    }
  };

  // ⏱ Beim Start: Prüfen, ob bereits eine Session existiert
  useEffect(() => {
    checkUser();
  }, []);

  // 📦 Was der Context nach außen bereitstellt
  const authContextValue = {
    user,
    isLoggedIn: !!user,
    loading,
    login,
    logout,
    futureAppointments,
    pastAppointments,
    fetchAppointments,
  };

  if (loading) {
    return <div>Lade Benutzerdaten...</div>;
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔓 Zugriff auf den Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
