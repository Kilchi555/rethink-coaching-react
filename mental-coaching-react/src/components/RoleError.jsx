import React from 'react';

const RoleError = () => (
  <div style={{ padding: '2rem' }}>
    <h1>⚠️ Zugriff verweigert</h1>
    <p>Deine Benutzerrolle ist nicht gültig oder wird derzeit nicht unterstützt.</p>
    <p>Bitte kontaktiere den Support, falls du denkst, dass es sich um einen Fehler handelt.</p>
  </div>
);

export default RoleError;
