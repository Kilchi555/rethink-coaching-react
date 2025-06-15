// components/AppointmentNotes.jsx
import React, { useState } from 'react';
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
      {/* Kundennotiz-Bereich */}
      <div className="note-container client-note-area">
        <h4>Notiz des Kunden:</h4>
        {user?.role === 'client' ? (
            <>
                {/* 📌 Editor nur im Bearbeitungsmodus */}
                {isEditingClientNote ? (
                <>
                    <EditableNoteField
                    initialContent={tempClientNoteContent?.[appointment.id] ?? appointment.client_note ?? ''}
                    isEditing={true}
                    content={tempClientNoteContent?.[appointment.id] ?? appointment.client_note ?? ''}
                    onContentChange={(newContent) =>
                        setTempClientNoteContent(prev => ({ ...prev, [appointment.id]: newContent }))
                    }
                    onSave={(contentToSave) =>
                        saveNote(appointment.id, 'client', contentToSave)
                    }
                    editorRef={clientNoteEditorRef}
                    maxLength={500}
                    />


                    <button
                    className="note-action-button client-note-button"
                    onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const el = clientNoteEditorRef.current;
                        const html = el?.innerHTML || '';
                        const saved = await saveNote(appointment.id, 'client', html, true);
                        if (saved) console.log('✅ Client-Notiz gespeichert');
                        setTempClientNoteContent(prev => ({ ...prev, [appointment.id]: html }));
                    }}
                    >
                    Client-Notiz speichern
                    </button>
                </>
                ) : (
                <>
                    {/* 📄 Lesemodus – Notiz anzeigen, falls vorhanden */}
                    {appointment.client_note ? (
                    <div
                        className="note-text"
                        dangerouslySetInnerHTML={{ __html: appointment.client_note }}
                    />
                    ) : (
                    <div className="note-text">Keine Notiz vorhanden.</div>
                    )}

                    <button
                    className="note-action-button client-note-button"
                    onClick={(e) => {
                        e.stopPropagation();
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
            // 🔒 Staff/Admin oder andere sehen die Notiz im Lesemodus
            <div
                className="note-text"
                dangerouslySetInnerHTML={{ __html: appointment.client_note || 'Keine Notiz vorhanden.' }}
            />
            )}

      </div>

      {/* Staff-Notiz-Bereich */}
      {(user?.role === 'staff' || user?.role === 'admin') && (
  <div className="note-container staff-note-area">
    <h4>Notiz des Coaches:</h4>
        {isEditingStaffNote ? (
        <>
           <EditableNoteField
                initialContent={tempStaffNoteContent?.[appointment.id] ?? appointment.staff_note ?? ''}
                isEditing={true}
                content={tempStaffNoteContent?.[appointment.id] ?? appointment.staff_note ?? ''}
                onContentChange={(newContent) =>
                    setTempStaffNoteContent(prev => ({ ...prev, [appointment.id]: newContent }))
                }
                onSave={(contentToSave) =>
                    saveNote(appointment.id, 'staff', contentToSave)
                }
                editorRef={staffNoteEditorRef}
                maxLength={500}
                />

            <button
            className="note-action-button staff-note-button"
            onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                const el = staffNoteEditorRef.current;
                const html = el?.innerHTML || '';
                const saved = await saveNote(appointment.id, 'staff', html, true);
                if (saved) {
                console.log('✅ Staff-Notiz gespeichert');
                setTempStaffNoteContent(prev => ({ ...prev, [appointment.id]: html }));
                if (user?.role === 'staff') setShouldLoadStats?.(true);
                }
            }}
            >
            Staff-Notiz speichern
            </button>
        </>
        ) : (
        <>
            {/* 📄 Lesemodus – Notiz anzeigen, falls vorhanden */}
            {(() => {
                const currentNote =
                    calendarAppointments.find(a => a.id === appointment.id)?.staff_note ||
                    '';

                return currentNote ? (
                    <div className="note-text" dangerouslySetInnerHTML={{ __html: currentNote }} />
                ) : (
                    <div className="note-text">Keine Notiz vorhanden.</div>
                );
                })()}

            <button
            className="note-action-button staff-note-button"
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleEditNoteClick(appointment.id, 'staff');
            }}
            >
            Staff-Notiz bearbeiten
            </button>
        </>
        )}
  </div>
)}

    </div>
  );
}
