// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialisiere user mit null und loading mit true.
  // Wir gehen davon aus, dass wir beim Start immer prüfen müssen, ob ein Benutzer eingeloggt ist.
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true); // WICHTIG: Auf true setzen, da eine Prüfung erfolgt
  const [futureAppointments, setFutureAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const navigate = useNavigate();

  const isMounted = useRef(true); 
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 🔄 checkUser: Überprüft den Benutzerstatus beim Laden der Komponente.
  // Diese Funktion wird jetzt beim Mounten des AuthProviders einmalig ausgeführt.
  const checkUser = async () => {
    console.log('🔄 AuthContext: Führe initiale Benutzerprüfung durch...');
    setLoading(true); // Setze Ladezustand auf true, während die Prüfung läuft
    try {
      const response = await fetch('/api/user', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!isMounted.current) return; // Frühzeitiger Exit, falls unmounted

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
        await fetchAppointments(); // Lade Termine für den gefundenen Benutzer
      } else {
        console.log('⚠️ AuthContext: Keine Benutzer-Session gefunden.');
        setUser(null);
        setFutureAppointments([]); // Termine leeren, wenn kein Benutzer
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
        setLoading(false); // Ladevorgang beendet
      }
    }
  };
  
  // Führe checkUser einmalig beim Mounten des AuthProviders aus
  useEffect(() => {
    checkUser();
  }, []); // Leeres Array als Abhängigkeit, um es nur einmal auszuführen

  // 🔐 Login
  const login = async (userId, email, role, first_name, last_name, street, street_nr, zip, city, phone) => {
    if (isMounted.current) { 
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
    console.log('✅ AuthContext: Login erfolgreich, lade Termine...');
    await fetchAppointments(); // Nach erfolgreichem Login Termine laden
  };

  // 🚪 Logout
  const logout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!isMounted.current) return; // Frühzeitiger Exit, falls unmounted

      if (response.ok) {
        setUser(null);
        setFutureAppointments([]);
        setPastAppointments([]);
        console.log('👋 AuthContext: Erfolgreich ausgeloggt.');
        // Optional: Hier könnten Sie auch navigate('/login') aufrufen,
        // oder dies der Komponente überlassen, die logout aufruft.
        // Da Login.jsx das schon macht, lassen wir es hier auskommentiert,
        // um keine doppelten Navigationsbefehle zu haben.
        // navigate('/login'); 
      } else {
        console.error('❌ AuthContext: Logout auf dem Server fehlgeschlagen.');
      }
    } catch (error) {
      console.error('❌ AuthContext: Fehler während des Logout-Fetches:', error);
    }
  };

  // 📅 Termine laden
  const fetchAppointments = async () => {
    console.log('📅 AuthContext: Lade Termine...');
    // Keine isMounted.current Prüfung bei den einzelnen setStates hier,
    // da diese Funktion nur aufgerufen wird, wenn der Context aktiv ist
    // und der Benutzer eingeloggt ist (oder gerade eingeloggt wurde).
    // React's Scheduler ist intelligent genug, unmounted Component-Updates zu ignorieren.
    try {
      const [futureRes, pastRes] = await Promise.all([
        fetch('/api/future-appointments', { credentials: 'include' }),
        fetch('/api/past-appointments', { credentials: 'include' }),
      ]);
  
      if (futureRes.ok) {
        const futureData = await futureRes.json();
        if (isMounted.current) { // isMounted ist hier noch sinnvoll für den Fall, dass ein fetch lange dauert
          setFutureAppointments(futureData.listData || []);
        }
      } else {
        if (isMounted.current) {
          setFutureAppointments([]); 
        }
        console.error('Fehler beim Laden zukünftiger Termine:', futureRes.status, futureRes.statusText);
      }
      
      if (pastRes.ok) {
        const pastData = await pastRes.json();
        if (isMounted.current) {
          setPastAppointments(pastData.listData || []);
        }
      } else {
        if (isMounted.current) {
          setPastAppointments([]); 
        }
        console.error('Fehler beim Laden vergangener Termine:', pastRes.status, pastRes.statusText);
      }
  
    } catch (err) {
      console.error('❌ AuthContext: Netzwerkfehler beim Laden der Termine:', err);
      if (isMounted.current) {
        setFutureAppointments([]);
        setPastAppointments([]);
      }
    }
  };
  
  const authContextValue = {
    user,
    isLoggedIn: !!user,
    loading, // Dies ist der Ladezustand für die initiale Prüfung
    login,
    logout,
    futureAppointments, // Wird jetzt von hier bereitgestellt
    pastAppointments,   // Wird jetzt von hier bereitgestellt
    fetchAppointments,  // Funktion zum manuellen Neuladen der Termine
  };

  console.log('ℹ️ AuthContext: Aktueller Loading-Status:', loading); 
  console.log('ℹ️ AuthContext: Aktueller User-Status:', user); 

  // Zeige einen Lade-Spinner, solange der AuthProvider den Benutzerstatus prüft.
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