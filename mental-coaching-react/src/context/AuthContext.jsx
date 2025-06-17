// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const [calendarAppointments, setCalendarAppointments] = useState([]);
  const [futureAppointments, setFutureAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);

  const navigate = useNavigate();

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const checkUser = async () => {
    console.log('🔄 AuthContext: Führe initiale Benutzerprüfung durch...');
    setLoading(true);
    try {
      const response = await fetch('/api/user', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!isMounted.current) return;
      if (response.ok) {
        const data = await response.json();
        const newUser = {
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
          phone: data.phone,
          assigned_staff_id: data.assigned_staff_id
        };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        console.log('✅ AuthContext: Benutzer-Session gefunden.');
      } else {
        console.log('⚠️ AuthContext: Keine Benutzer-Session gefunden.');
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('❌ AuthContext: Fehler bei der Benutzerprüfung:', error);
      if (isMounted.current) {
        setUser(null);
        localStorage.removeItem('user');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const fetchAppointments = useCallback(async () => {
    console.log('📅 AuthContext: Lade Termine...');
    try {
      if (!user) {
        console.log('AuthContext: Kein User angemeldet, überspringe Terminladen.');
        return;
      }
      const now = new Date();
      let future = [];
      let past = [];

      if (user.role === 'client') {
        const [futureRes, pastRes] = await Promise.all([
          fetch('/api/future-appointments', { credentials: 'include' }),
          fetch('/api/past-appointments', { credentials: 'include' })
        ]);

        if (futureRes.ok) {
          const futureData = await futureRes.json();
          future = (futureData.listData || futureData).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        }
        if (pastRes.ok) {
          const pastData = await pastRes.json();
          past = (pastData.listData || pastData).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
        }
      } else {
        const response = await fetch('/api/staff/appointments', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          future = data.filter(app => new Date(app.start_time) >= now).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
          past = data.filter(app => new Date(app.start_time) < now).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
        }
      }

      if (isMounted.current) {
        setFutureAppointments(future);
        setPastAppointments(past);
        setCalendarAppointments([...future, ...past]);
      }
    } catch (err) {
      console.error('❌ AuthContext: Netzwerkfehler beim Laden der Termine:', err);
      if (isMounted.current) {
        setFutureAppointments([]);
        setPastAppointments([]);
        setCalendarAppointments([]);
      }
    }
  }, [user]);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && !loading) {
      fetchAppointments();
    } else if (!user && !loading) {
      setCalendarAppointments([]);
    }
  }, [user, loading, fetchAppointments]);

  const login = async (userId, email, role, first_name, last_name, street, street_nr, zip, city, phone, assigned_staff_id) => {
    const newUser = {
      id: userId,
      email,
      role,
      first_name,
      last_name,
      street,
      street_nr,
      zip,
      city,
      phone,
      assigned_staff_id
    };
    if (isMounted.current) {
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!isMounted.current) return;
      if (response.ok) {
        setUser(null);
        setCalendarAppointments([]);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('❌ AuthContext: Fehler während des Logout-Fetches:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      loading,
      logout,
      login,
      calendarAppointments,
      setCalendarAppointments,
      futureAppointments,
      setFutureAppointments,
      pastAppointments,
      setPastAppointments,
      fetchAppointments
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
