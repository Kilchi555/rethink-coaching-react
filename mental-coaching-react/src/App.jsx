// App.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Header from './components/Header'; // <--- dein eigener Header
import Footer from './components/Footer';

import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import CoachesSection from './components/CoachesSection';
import TestimonialsSection from './components/TestimonialsSection';
import FAQSection from './components/FAQSection';

import Login from './components/Login';
import Dashboard from './components/Dashboard';

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
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>

      <Footer />
    </div>
  );
}

export default App;
