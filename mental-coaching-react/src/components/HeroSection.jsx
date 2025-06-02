// mental-coaching-react/src/components/HeroSection.jsx
import React from 'react'; // React importieren, da JSX verwendet wird

function HeroSection() {
  return (
    <section className="hero">
      <div className="container">
        <h1>Dein persönlicher Mental Coach</h1>
        <p>Mehr Klarheit. Mehr Fokus. Mehr Lebensfreude. Starte jetzt mit einem <b>"Kostenlosen Kennenlernen"</b>.</p>
        {/* Wenn der Calendly-Button eine eigene Logik bekommen soll, könnte er später auch eine eigene Komponente werden. */}
        <button className="calendly-button">Termin buchen</button>
      </div>
    </section>
  );
}

export default HeroSection;