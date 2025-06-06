// App.jsx
import React, { useEffect, Suspense, lazy } from 'react'; // Suspense und lazy direkt importieren
import { Route, Routes, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';

// Hauptinhaltskomponenten für die Startseite (unverändert)
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import CoachesSection from './components/CoachesSection';
import TestimonialsSection from './components/TestimonialsSection';
import FAQSection from './components/FAQSection';

// Authentifizierungs- und Fehlerseiten (unverändert)
import Login from './components/Login';
import Unauthorized from './components/Unauthorized';
import RoleError from './components/RoleError'; // Wenn diese Komponente noch verwendet wird
import ProtectedRoute from './components/ProtectedRoute'; // Wichtig: Die von uns überarbeitete ProtectedRoute

// NEU: Nur das zentrale Dashboard importieren und NICHT lazy laden,
// da es alle Rollen abdeckt und oft direkt benötigt wird.
import Dashboard from './components/Dashboard'; 

// ALT: Diese Lazy-Imports sind NICHT mehr notwendig und können entfernt werden:
// const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard')); // <-- ENTFERNEN
// const StaffDashboard = lazy(() => import('./components/dashboards/StaffDashboard')); // <-- ENTFERNEN
// const CustomerDashboard = lazy(() => import('./components/dashboards/Dashboard')); // <-- ENTFERNEN (da jetzt direkt importiert)


function App() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return (
    <div>
      {/* Header nur auf der Startseite anzeigen */}
      {location.pathname === '/' && <Header />}
      
      {/* Suspense ist jetzt nur noch für die Startseite nötig, falls dort Lazy-Loading verwendet wird.
          Da wir das Dashboard direkt importieren, ist Suspense hier für die Dashboard-Routen nicht mehr nötig.
          Ich belasse es aber vorerst, falls Sie andere Lazy-Komponenten haben, die noch nicht deklariert sind.
          Optimalerweise ist Suspense um die einzelnen lazy geladenen Komponenten, nicht um die gesamte Routes.
          Für dieses Setup ist es unschädlich, aber auch nicht mehr unbedingt notwendig für die Dashboards.
      */}
      <Suspense fallback={<div>⏳ Lädt Inhalte…</div>}> 
        <Routes>
          <Route path="/" element={
            <>
              <HeroSection />
              <AboutSection />
              <CoachesSection />
              <TestimonialsSection />
              <FAQSection />
            </>
          } />
          <Route path="/login" element={<Login />} />
          
          {/* ALT: Diese Route ist NICHT mehr notwendig und kann entfernt werden,
                  da SwitchDashboard nicht mehr existiert und die Rolle direkt im AuthContext geprüft wird. */}
          {/* <Route path="/dashboard" element={<SwitchDashboard />} /> */} 

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/role-error" element={<RoleError />} /> {/* Wenn diese Route noch benötigt wird */}

          {/* NEU: Alle rollenbasierten Dashboard-Routen verwenden nun das EINE zentrale Dashboard */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute requiredRole="customer">
                <Dashboard /> {/* Hier das zentrale Dashboard verwenden */}
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute requiredRole="staff">
                <Dashboard /> {/* Hier das zentrale Dashboard verwenden */}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Dashboard /> {/* Hier das zentrale Dashboard verwenden */}
              </ProtectedRoute>
            }
          />

          {/* Optional: Eine Standard-Dashboard-Route, falls kein spezifischer Pfad passt */}
          {/* <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> */}
          {/* WICHTIG: Wenn Sie '/dashboard' als primären Zielpfad nach dem Login verwenden möchten,
                       müssen Sie die Login-Logik so anpassen, dass sie zu '/dashboard' navigiert
                       und dann das Dashboard selbst die Benutzerrolle prüft, ODER den
                       ProtectedRoute ohne requiredRole verwenden.
                       Aktuell navigiert Login.jsx zu /admin, /staff, /customer. */}

        </Routes>
      </Suspense>
      <Footer />
    </div>
  );
}

export default App;