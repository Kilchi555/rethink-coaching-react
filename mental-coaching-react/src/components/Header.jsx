// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react'; // <-- useRef hinzufügen
import { Link } from 'react-router-dom';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null); // <-- Eine Referenz für das Navigations-Element

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Effekt, um Klicks außerhalb des Menüs zu erkennen
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Wenn das Menü offen ist UND der Klick NICHT innerhalb des Navigations-Elements ist
      if (navRef.current && !navRef.current.contains(event.target)) {
        // Überprüfen, ob der Klick NICHT auf den Toggle-Button war
        // Dies ist wichtig, da ein Klick auf den Toggle-Button das Menü öffnen/schließen soll
        if (event.target.className !== 'menu-toggle' && event.target.parentNode.className !== 'menu-toggle') {
          closeMenu(); // Schließe das Menü
        }
      }
    };

    // Event Listener hinzufügen, wenn das Menü offen ist oder beim Mounten
    document.addEventListener('mousedown', handleClickOutside);
    // Aufräumfunktion: Event Listener entfernen, wenn die Komponente unmounted wird
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]); // Abhängigkeit: Effekt wird neu ausgeführt, wenn isOpen sich ändert

  // Optional: Menü schließen, wenn die Bildschirmgröße sich ändert (z.B. von Mobile zu Desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isOpen) {
        setIsOpen(false); // Menü auf Desktop-Größe schließen
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  return (
    <header className="header">
      <div className="logo">
        <Link to="/" onClick={closeMenu}> {/* Auch Logo-Klick kann Menü schließen */}
          <img src="/images/ReThinkCoaching Logo.webp" alt="Rethink Coaching Logo" />
        </Link>
      </div>

      <button className="menu-toggle" onClick={toggleMenu}>
        &#9776; {/* Hamburger-Icon */}
      </button>

      {/* Die Referenz (ref) und die bedingte Klasse 'active' für das Menü hinzufügen */}
      <nav ref={navRef} className={`navbar ${isOpen ? 'active' : ''}`}>
        <ul>
          <li>
            <Link to="/#about" onClick={closeMenu}>Über uns</Link> {/* <-- Pfad zu ID geändert */}
          </li>
          <li>
            <Link to="/#coaches" onClick={closeMenu}>Coaches</Link> {/* <-- Pfad zu ID geändert */}
          </li>
          <li>
            <Link to="/#testimonials" onClick={closeMenu}>Kundenbewertungen</Link> {/* <-- Pfad zu ID geändert */}
          </li>
          <li>
            <Link to="/#faq" onClick={closeMenu}>Häufige Fragen</Link> {/* <-- Pfad zu ID geändert */}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;