// mental-coaching-react/src/components/TestimonialsSection.jsx
import React from 'react'; // React importieren, da JSX verwendet wird

function TestimonialsSection() {
  return (
    <section id="testimonials" className="testimonials-section">
      <div className="container">
        <h2>Was unsere Kunden sagen</h2>
        <div className="testimonials-grid">
          {/* Bewertung 1 */}
          <div className="testimonial-card">
            <p className="testimonial-text">
              „Ich habe durch das Coaching endlich das Vertrauen in mich selbst gefunden, das ich immer gesucht habe. Nicole hat mir geholfen, meine beruflichen Ziele klar zu definieren und mit mehr Selbstbewusstsein zu arbeiten.“
            </p>
            <div className="testimonial-author">
              <img src="/images/Portrait Mann.webp" alt="Mental Coach Kunde Max Müller" loading="lazy"/>
              <div className="author-info">
                <p className="name">Max Müller</p>
                <p className="occupation">Beruflich erfolgreicher Manager</p>
              </div>
            </div>
          </div>

          {/* Bewertung 2 */}
          <div className="testimonial-card">
            <p className="testimonial-text">
              „Das Coaching mit Pascal hat mich mental stärker gemacht. Ich konnte meine sportlichen Ziele viel schneller erreichen und bin nun viel fokussierter und motivierter.“
            </p>
            <div className="testimonial-author">
              <img src="/images/Portrait junge Frau.webp" alt="Mental Coach Kunde Julia Meier" loading="lazy"/>
              <div className="author-info">
                <p className="name">Julia Meier</p>
                <p className="occupation">Professionelle Sportlerin</p>
              </div>
            </div>
          </div>

          {/* Bewertung 3 */}
          <div className="testimonial-card">
            <p className="testimonial-text">
              Nicole hat mir geholfen, meine Lebensziele zu definieren und einen klaren Plan zu erstellen, wie ich sie erreichen kann. Ich fühle mich jetzt viel sicherer und habe eine klare Vision für meine Zukunft.“
            </p>
            <div className="testimonial-author">
              <img src="/images/Portrait Frau.webp" alt="Mental Coach Kunde Karin Keller" loading="lazy"/>
              <div className="author-info">
                <p className="name">Karin Keller</p>
                <p className="occupation">Mutter und Unternehmerin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;