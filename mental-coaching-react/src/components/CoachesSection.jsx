// mental-coaching-react/src/components/CoachesSection.jsx
import React from 'react'; // React importieren, da JSX verwendet wird

function CoachesSection() {
  return (
    <section id="coaches" className="coaches-section"> {/* <-- className GEÄNDERT! */}
      <div className="container">
        <h2>Deine Mental Coaches</h2>
        <p className="intro">
          Wir sind ein vielseitiges Team von Mental Coaches, das Menschen in den unterschiedlichsten Lebensbereichen begleitet – individuell, zielorientiert und mit Leidenschaft.
        </p>

        <div className="coach-grid">
          {/* Coach 1 */}
          <div className="coach-card">
            <img src="/images/Nicole-Portrait.webp" alt="Mental Coach Nicole Stohr" loading="lazy"/>
            <h3>Nicole Stohr</h3>
            <p><strong>Fokus:</strong> Familie und Leben</p>
            <p>Nicole hilft dir dabei, innere Blockaden zu lösen und mit Klarheit neue Wege zu gehen – in der Familie und im Leben.</p>
          </div>

          {/* Coach 2 */}
          <div className="coach-card">
            <img src="/images/Pascal-Portrait.webp" alt="Mental Coach Pascal Kilchenmann" loading="lazy"/>
            <h3>Pascal Kilchenmann</h3>
            <p><strong>Fokus:</strong> Leben und Business</p>
            <p>Pascal coacht dich mental zur Bestleistung – mit einem Mix aus mentaler Stärke, Zielsetzung und Fokustechniken.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CoachesSection;