// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true); 
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
        console.log('✅ AuthContext: Benutzer-Session gefunden.');
        // Termine laden, nachdem der Benutzer gesetzt wurde
        // (fetchAppointments wird jetzt explizit den 'user'-State lesen)
      } else {
        console.log('⚠️ AuthContext: Keine Benutzer-Session gefunden.');
        setUser(null);
        setFutureAppointments([]); 
        setPastAppointments([]);
      }
    } catch (error) {
      console.error('❌ AuthContext: Fehler bei der Benutzerprüfung:', error);
      if (isMounted.current) { 
        setUser(null);
        setFutureAppointments([]);
        setPastAppointments([]);
      }
    } finally {
      if (isMounted.current) { 
        setLoading(false); 
      }
    }
  };
  
  // fetchAppointments ist jetzt eine Abhängigkeit des useEffects,
  // der die Termine lädt, um sicherzustellen, dass 'user' aktuell ist.
  const fetchAppointments = useCallback(async () => {
    console.log('📅 AuthContext: Lade Termine...');
    try {
      if (!user) { 
        console.log('AuthContext: Kein User angemeldet, überspringe Terminladen.');
        setFutureAppointments([]);
        setPastAppointments([]);
        return;
      }

      if (user.role === 'client') {
        const [futureRes, pastRes] = await Promise.all([
          fetch('/api/future-appointments', { credentials: 'include' }),
          fetch('/api/past-appointments', { credentials: 'include' }),
        ]);

        let futureAppointmentsRaw = [];
        if (futureRes.ok) {
          const futureData = await futureRes.json();
          // ANPASSUNG HIER: Nimm .listData oder das direkte Array
          futureAppointmentsRaw = futureData.listData || futureData; 
          console.log('Kunde: Rohdaten zukünftiger Termine:', futureAppointmentsRaw); 
        } else {
          console.error('Fehler beim Laden zukünftiger Termine (Kunde):', futureRes.status, futureRes.statusText);
        }

        let pastAppointmentsRaw = [];
        if (pastRes.ok) {
          const pastData = await pastRes.json();
          // ANPASSUNG HIER: Nimm .listData oder das direkte Array
          pastAppointmentsRaw = pastData.listData || pastData; 
          console.log('Kunde: Rohdaten vergangener Termine:', pastAppointmentsRaw); 
        } else {
          console.error('Fehler beim Laden vergangener Termine (Kunde):', pastRes.status, pastRes.statusText);
        }

        if (isMounted.current) {
          setFutureAppointments(futureAppointmentsRaw);
          setPastAppointments(pastAppointmentsRaw);
        }
      } else if (user.role === 'staff' || user.role === 'admin') {
        const response = await fetch('/api/staff/appointments', { credentials: 'include' });
        if (response.ok) {
          const allStaffAppointments = await response.json();
          const now = new Date();
          const future = allStaffAppointments.filter(app => new Date(app.start_time) >= now);
          const past = allStaffAppointments.filter(app => new Date(app.start_time) < now);

          if (isMounted.current) {
            setFutureAppointments(future);
            setPastAppointments(past);
          }
        } else {
          console.error('Fehler beim Laden der Mitarbeiter-Termine:', response.status, response.statusText);
          if (isMounted.current) {
            setFutureAppointments([]);
            setPastAppointments([]);
          }
        }
      }

    } catch (err) {
      console.error('❌ AuthContext: Netzwerkfehler beim Laden der Termine:', err);
      if (isMounted.current) {
        setFutureAppointments([]);
        setPastAppointments([]);
      }
    }
  }, [user, isMounted]); // fetchAppointments hängt jetzt vom 'user'-Objekt ab

  // Führe checkUser einmalig beim Mounten des AuthProviders aus
  useEffect(() => {
    checkUser();
  }, []); 

  // Führe fetchAppointments aus, wenn der Benutzerstatus sich ändert und er eingeloggt ist
  useEffect(() => {
    if (user && !loading) { // Nur Termine laden, wenn user gesetzt und die initiale Ladephase beendet ist
      console.log('AuthContext: User oder Ladezustand geändert, lade Termine neu...');
      fetchAppointments();
    } else if (!user && !loading) {
      // Wenn der User null ist und nicht mehr geladen wird (z.B. nach Logout), Termine leeren
      setFutureAppointments([]);
      setPastAppointments([]);
    }
  }, [user, loading, fetchAppointments]);


  // 🔐 Login
  const login = async (userId, email, role, first_name, last_name, street, street_nr, zip, city, phone) => {
    if (isMounted.current) { 
      // setUser löst den obigen useEffect aus, der dann fetchAppointments aufruft
      setUser({ 
        id: userId, 
        email, 
        role, 
        first_name, 
        last_name, 
        street, 
        street_nr, 
        zip, 
        city, 
        phone 
      });
    }
    console.log('✅ AuthContext: Login erfolgreich. Termine werden im useEffect geladen.');
    // fetchAppointments wird hier nicht mehr direkt aufgerufen,
    // da es der useEffect beim Setzen des Users übernimmt.
  };

  // 🚪 Logout
  const logout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!isMounted.current) return; 

      if (response.ok) {
        setUser(null);
        setFutureAppointments([]);
        setPastAppointments([]);
        console.log('👋 AuthContext: Erfolgreich ausgeloggt.');
      } else {
        console.error('❌ AuthContext: Logout auf dem Server fehlgeschlagen.');
      }
    } catch (error) {
      console.error('❌ AuthContext: Fehler während des Logout-Fetches:', error);
    }
  };
  
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

  console.log('ℹ️ AuthContext: Aktueller Loading-Status:', loading); 
  console.log('ℹ️ AuthContext: Aktueller User-Status:', user); 

  if (loading) {
    return <div className="auth-loading-spinner">Authentifizierung wird geprüft...</div>;
  }

  return (
    <AuthContext.Provider value={authContextValue}>
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