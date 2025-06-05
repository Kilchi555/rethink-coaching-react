import React, { useEffect, useState } from 'react';

const NotesOverview = () => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetch('/api/admin/notes')
      .then(res => res.json())
      .then(setNotes)
      .catch(err => console.error('Fehler beim Laden der Notizen:', err));
  }, []);

  return (
    <div>
      <h3>Letzte Notizen</h3>
      <ul>
        {notes.map(note => (
          <li key={note.id}>
            📝 {note.note.slice(0, 50)}...<br />
            📅 {note.created_at} – Termin: {note.appointment_id}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotesOverview;
