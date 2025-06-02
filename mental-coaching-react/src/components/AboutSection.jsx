// mental-coaching-react/src/components/AboutSection.jsx
import React from 'react'; // React importieren, da JSX verwendet wird

function AboutSection() {
  return (
    <section id="about" className="about-section">
      <div className="container">
        <h2>Über uns – dein Mental Coaching Team</h2>
        <p className="intro">
          Wir sind ein erfahrenes Team aus zertifizierten Mental Coaches, das Menschen auf ihrem Weg zur persönlichen, beruflichen und sportlichen Weiterentwicklung begleitet.
        </p>

        {/* Coach Team */}
        <div className="about-content">
          <div className="about-text">
            <p>
              Unsere Mission ist es, dir zu helfen, mentale Blockaden zu lösen, neue Perspektiven zu entwickeln und dein volles Potenzial zu entfalten.
              Mit modernen Coaching-Methoden und bewährten Tools unterstützen wir dich dabei, Klarheit zu gewinnen, Ziele zu setzen – und diese konsequent zu erreichen.
            </p>
            <p>
              Ob du mehr Selbstvertrauen aufbauen, dich beruflich neu orientieren oder sportlich über dich hinauswachsen willst – als professionelle Mental Coaches stehen wir an deiner Seite.
            </p>
          </div>

          <div className="about-image">
            <img src="/images/Team Foto.webp" alt="Mental Coach Team" loading="lazy"/>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;