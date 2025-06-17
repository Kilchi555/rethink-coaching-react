import React from 'react';
import EditableNoteField from './EditableNoteField';

export default function AppointmentNotes({
  appointment,
  calendarAppointments,
  user,
  tempClientNoteContent,
  tempStaffNoteContent,
  setTempClientNoteContent,
  setTempStaffNoteContent,
  clientNoteEditorRef,
  staffNoteEditorRef,
  editingNoteIds,
  handleEditNoteClick,
  saveNote,
  setShouldLoadStats
}) {
  const isEditingClientNote = editingNoteIds[appointment.id] === 'client';
  const isEditingStaffNote = editingNoteIds[appointment.id] === 'staff';

  return (
    <div className="notes-section" onClick={(e) => e.stopPropagation()}>
      {/* CLIENT NOTE */}
      <div className="note-container client-note-area">
        <h4>Notiz des Kunden:</h4>
        {user?.role === 'client' ? (
          <>
            {isEditingClientNote ? (
              <>
                <EditableNoteField
                  initialContent={appointment.client_note ?? ''}
                  isEditing={true}
                  content={tempClientNoteContent?.[appointment.id] ?? appointment.client_note ?? ''}
                  onContentChange={(newContent) =>
                    setTempClientNoteContent(prev => ({ ...prev, [appointment.id]: newContent }))
                  }
                  editorRef={clientNoteEditorRef}
                  maxLength={500}
                />
                <button
                  className="note-action-button client-note-button"
                  onClick={async (e) => {
                    e.preventDefault();
                    const el = clientNoteEditorRef.current;
                    const html = el?.innerHTML || '';
                    const saved = await saveNote(appointment.id, 'client', html, true);
                    if (saved) {
                      console.log('✅ Client-Notiz gespeichert');
                      setTempClientNoteContent(prev => ({ ...prev, [appointment.id]: html }));
                    }
                  }}
                >
                  Client-Notiz speichern
                </button>
              </>
            ) : (
              <>
                <div
                  className="note-text"
                  dangerouslySetInnerHTML={{
                    __html: tempClientNoteContent?.[appointment.id] ?? appointment.client_note ?? 'Keine Notiz vorhanden.',
                  }}
                />
                <button
                  className="note-action-button client-note-button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEditNoteClick(appointment.id, 'client');
                  }}
                >
                  Client-Notiz bearbeiten
                </button>
              </>
            )}
          </>
        ) : (
          <div
            className="note-text"
            dangerouslySetInnerHTML={{
              __html: appointment.client_note ?? 'Keine Notiz vorhanden.',
            }}
          />
        )}
      </div>

      {/* STAFF NOTE */}
      <div className="note-container staff-note-area">
        <h4>Notiz des Coaches:</h4>
        {user?.role === 'staff' || user?.role === 'admin' ? (
          isEditingStaffNote ? (
            <>
              <EditableNoteField
                initialContent={appointment.staff_note ?? ''}
                isEditing={true}
                content={tempStaffNoteContent?.[appointment.id] ?? appointment.staff_note ?? ''}
                onContentChange={(newContent) =>
                  setTempStaffNoteContent(prev => ({ ...prev, [appointment.id]: newContent }))
                }
                editorRef={staffNoteEditorRef}
                maxLength={500}
              />
              <button
                className="note-action-button staff-note-button"
                onClick={async (e) => {
                    e.preventDefault();
                    const el = staffNoteEditorRef.current;
                    const html = el?.innerHTML || '';
                  
                    // 1. 🔐 TEMP-Content direkt vor dem Speichern setzen
                    setTempStaffNoteContent(prev => ({ ...prev, [appointment.id]: html }));
                  
                    // 2. ✅ Danach speichern
                    const saved = await saveNote(appointment.id, 'staff', html, true);
                    
                    if (saved) {
                      console.log('✅ Staff-Notiz gespeichert');
                      if (user?.role === 'staff') setShouldLoadStats?.(true);
                    }
                  }}
                  
              >
                Staff-Notiz speichern
              </button>
            </>
          ) : (
            <>
              <div
                className="note-text"
                dangerouslySetInnerHTML={{
                  __html: tempStaffNoteContent?.[appointment.id] ?? appointment.staff_note ?? 'Keine Notiz vorhanden.',
                }}
              />
              <button
                className="note-action-button staff-note-button"
                onClick={(e) => {
                  e.preventDefault();
                  handleEditNoteClick(appointment.id, 'staff');
                }}
              >
                Staff-Notiz bearbeiten
              </button>
            </>
          )
        ) : (
          <div
            className="note-text"
            dangerouslySetInnerHTML={{
              __html: appointment.staff_note ?? 'Keine Notiz vorhanden.',
            }}
          />
        )}
      </div>
    </div>
  );
}
