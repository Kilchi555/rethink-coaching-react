<section id="faq" className="faq-section">
        <div className="container">
          <h2>Häufig gestellte Fragen (FAQ)</h2>
          <div className="faq-list">
            {/* Frage 1 */}
            <div className="faq-item">
              <button className="faq-question">Was ist Mental Coaching und wie kann es mir helfen?</button>
              <div className="faq-answer">
                <p>Mental Coaching hilft dir, deine mentalen Blockaden zu erkennen und zu überwinden. Es unterstützt dich dabei, deine Ziele zu definieren, dein Selbstvertrauen zu stärken und deine Leistung zu steigern, sei es im Beruf, im Sport oder im persönlichen Leben.</p>
              </div>
            </div>

            {/* Frage 2 */}
            <div className="faq-item">
              <button className="faq-question">Wie funktioniert das Coaching?</button>
              <div className="faq-answer">
                <p>Unser Coaching findet in Einzelgesprächen statt, in denen wir gemeinsam an deinen Zielen arbeiten. Es gibt unterschiedliche Formate: telefonisch, per Video-Call oder auch persönlich, je nachdem, was dir am besten passt. Gruppencoaching ist natürlich auch möglich.  </p>
              </div>
            </div>

            {/* Frage 3 */}
            <div className="faq-item">
              <button className="faq-question">Wie buche ich eine Session?</button>
              <div className="faq-answer">
                <p>Du kannst ganz einfach über unser Online-Buchungssystem deinen Termin für eine kostenlose Kennenlern-Session buchen. Wähle einfach einen freien Termin, der dir passt, und wir treffen uns virtuell oder telefonisch.</p>
              </div>
            </div>

            {/* Frage 4 */}
            <div className="faq-item">
              <button className="faq-question">Kann ich einen Termin absagen oder verschieben?</button>
              <div className="faq-answer">
                <p>Ja, du kannst deinen Termin bis zu 48 Stunden vorher absagen oder verschieben. Wenn du deinen Termin absagst, erhältst du eine Bestätigung und das Geld wird dir zurückerstattet.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      // mental-coaching-react/src/components/FAQSection.jsx
import React, { useState } from 'react'; // useState für die Interaktivität

function FAQSection() {
  // state, um die aktuell geöffnete Frage zu verfolgen
  // Wir verwenden einen Index. null bedeutet, dass keine Frage offen ist.
  const [openQuestionIndex, setOpenQuestionIndex] = useState(null);

  // Funktion zum Umschalten der Antwort
  const toggleAnswer = (index) => {
    // Wenn die geklickte Frage bereits offen ist, schließe sie.
    // Sonst öffne die geklickte Frage.
    setOpenQuestionIndex(openQuestionIndex === index ? null : index);
  };

  // Daten für die FAQs (könnte später auch aus einer API kommen)
  const faqs = [
    {
      question: 'Was ist Mental Coaching und wie kann es mir helfen?',
      answer: 'Mental Coaching hilft dir, deine mentalen Blockaden zu erkennen und zu überwinden. Es unterstützt dich dabei, deine Ziele zu definieren, dein Selbstvertrauen zu stärken und deine Leistung zu steigern, sei es im Beruf, im Sport oder im persönlichen Leben.',
    },
    {
      question: 'Wie funktioniert das Coaching?',
      answer: 'Unser Coaching findet in Einzelgesprächen statt, in denen wir gemeinsam an deinen Zielen arbeiten. Es gibt unterschiedliche Formate: telefonisch, per Video-Call oder auch persönlich, je nachdem, was dir am besten passt. Gruppencoaching ist natürlich auch möglich.',
    },
    {
      question: 'Wie buche ich eine Session?',
      answer: 'Du kannst ganz einfach über unser Online-Buchungssystem deinen Termin für eine kostenlose Kennenlern-Session buchen. Wähle einfach einen freien Termin, der dir passt, und wir treffen uns virtuell oder telefonisch.',
    },
    {
      question: 'Kann ich einen Termin absagen oder verschieben?',
      answer: 'Ja, du kannst deinen Termin bis zu 48 Stunden vorher absagen oder verschieben. Wenn du deinen Termin absagst, erhältst du eine Bestätigung und das Geld wird dir zurückerstattet.',
    },
  ];

  return (
    <section id="faq" className="faq-section">
      <div className="container">
        <h2>Häufig gestellte Fragen (FAQ)</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            // Hier wird jedes FAQ-Item gerendert
            <div className="faq-item" key={index}> {/* key ist wichtig für Listen in React */}
              <button
                className="faq-question"
                onClick={() => toggleAnswer(index)} // onClick Event-Handler
              >
                {faq.question}
                {/* Optional: Ein Icon für "offen" / "geschlossen" */}
                <span className="faq-icon">{openQuestionIndex === index ? '−' : '+'}</span>
              </button>
              <div
                className={`faq-answer ${openQuestionIndex === index ? 'open' : ''}`} // Klasse 'open' dynamisch hinzufügen
                // Inline-Style für die Höhe basierend auf dem 'open'-Zustand
                style={{
                  maxHeight: openQuestionIndex === index ? '200px' : '0', // Eine maximale Höhe, die der Inhalt haben kann
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out', // Sanfte Animation
                }}
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;