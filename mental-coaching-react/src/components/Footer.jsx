// mental-coaching-react/src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // <-- Link importieren

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Kontaktbereich */}
          <div className="footer-section contact">
            <h3>Kontakt</h3>
            <ul>
              <li><a href="tel:+491234567890">Telefon: +41 123 456 7890</a></li>
              <li><a href="mailto:info@rethinkcoaching.ch">E-Mail: info@rethinkcoaching.ch</a></li>
              {/* Login-Link: onClick={closeMenu} entfernt, da es hier nicht nötig ist und nicht funktioniert */}
              <li><Link to="/login">Anmelden</Link></li>
            </ul>
          </div>

          {/* Schnellzugriffs-Links */}
          <div className="footer-section quick-links">
            <h3>Schnellzugriff</h3>
            <ul>
              {/* Diese Links bleiben als normale Anker-Tags */}
              <li><a href="#about">Über uns</a></li>
              <li><a href="#coaches">Coaches</a></li>
              <li><a href="#testimonials">Kundenbewertungen</a></li>
              <li><a href="#faq">Häufige Fragen</a></li>
            </ul>
          </div>

          <div className="footer-section social-media">
            <h3>Folge uns</h3>
            <ul>
              {/* HINWEIS: Hier fehlen die Font Awesome Icons.
                 Stellen Sie sicher, dass Font Awesome über einen CDN oder npm installiert ist,
                 damit die Icons angezeigt werden. Andernfalls sehen Sie nur leere Kästchen.
              */}
              <li><a href="https://facebook.com/rethinkcoaching" target="_blank" aria-label="Facebook"><i className="fab fa-facebook"></i></a></li>
              <li><a href="https://instagram.com/rethinkcoaching" target="_blank" aria-label="Instagram"><i className="fab fa-instagram"></i></a></li>
              <li><a href="https://linkedin.com/company/rethinkcoaching" target="_blank" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a></li>
            </ul>
          </div>
        </div>

        {/* Urheberrecht */}
        <div className="footer-bottom">
          <p>&copy; 2025 ReThink Coaching | Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;