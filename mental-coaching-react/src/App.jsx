// App.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';

import Header from './components/Header'; // <--- dein eigener Header
import Footer from './components/Footer';

import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import CoachesSection from './components/CoachesSection';
import TestimonialsSection from './components/TestimonialsSection';
import FAQSection from './components/FAQSection';

import Login from './components/Login';
import Unauthorized from './components/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import SwitchDashboard from './components/dashboards/SwitchDashboard';
import RoleError from './components/RoleError';



const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const StaffDashboard = lazy(() => import('./components/dashboards/StaffDashboard'));
const CustomerDashboard = lazy(() => import('./components/dashboards/CustomerDashboard'));


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
      {/* Nur auf der Startseite anzeigen */}
      {location.pathname === '/' && <Header />}
      <Suspense fallback={<div>⏳ Lädt Dashboard…</div>}>
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
        <Route path="/dashboard" element={<SwitchDashboard />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/role-error" element={<RoleError />} />
        <Route
        path="/customer"
        element={
          <ProtectedRoute requiredRole="customer">
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/staff" element={<StaffDashboard />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Suspense>
      <Footer />
    </div>
  );
}

export default App;
