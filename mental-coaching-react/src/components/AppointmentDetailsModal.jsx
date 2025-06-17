// src/components/AppointmentDetailsModal.jsx
import React from 'react';
import EditableNoteField from './EditableNoteField';
import '../pages/Dashboard.css'; 
import '/src/index.css'; // ✅ absoluter Pfad funktioniert immer mit Vite

const AppointmentDetailsModal = ({
  appointment,
  user,
  calendarAppointments,
  tempClientNoteContent,
  tempStaffNoteContent,
  setTempClientNoteContent,
  setTempStaffNoteContent,
  clientNoteEditorRef,
  staffNoteEditorRef,
  editingNoteIds,
  handleEditNoteClick,
  saveNote,
  setIsAppointmentDetailsModalOpen,
  handleDelete,
  triggerCopyAppointment
}) => {
  if (!appointment) return null;

  const isPast = new Date(appointment.end_time) < new Date();
  const isClient = user.role === 'client' || user.role === 'customer';
  const isStaff = user.role === 'staff';
  const isAdmin = user.role === 'admin';

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Termindetails</h3>

        <div className="appointment-info">
          <p><strong>📚 Thema:</strong> {appointment.title || 'Kein Titel'}</p>
          <p><strong>📍 Ort:</strong> {appointment.location || 'Unbekannt'}</p>
          <p><strong>🕒 Zeit:</strong> {new Date(appointment.start_time).toLocaleString('de-CH')}</p>
          <p><strong>⏱️ Dauer:</strong> {appointment.durationMinutes || 'Unbekannt'} Minuten</p>
        </div>

        {/* 📝 CLIENT NOTE */}
        {(isClient || isStaff || isAdmin) && (
          <div className="note-section">
            <h4>📝 Eigene Notiz:</h4>
            <EditableNoteField
              noteType="client"
              appointmentId={appointment.id}
              note={appointment.client_note}
              tempNote={tempClientNoteContent}
              setTempNote={setTempClientNoteContent}
              editingNoteIds={editingNoteIds}
              editorRef={clientNoteEditorRef}
              handleEditNoteClick={handleEditNoteClick}
              saveNote={saveNote}
              isPast={isPast}
            />
          </div>
        )}

        {/* 📝 STAFF NOTE */}
        {(isStaff || isAdmin) && (
          <div className="note-section">
            <h4>🔒 Coach-Notiz:</h4>
            <EditableNoteField
              noteType="staff"
              appointmentId={appointment.id}
              note={appointment.staff_note}
              tempNote={tempStaffNoteContent}
              setTempNote={setTempStaffNoteContent}
              editingNoteIds={editingNoteIds}
              editorRef={staffNoteEditorRef}
              handleEditNoteClick={handleEditNoteClick}
              saveNote={saveNote}
              isPast={isPast}
            />
          </div>
        )}

        <div className="button-row">
          <button
            className="btn"
            onClick={() => {
              setIsAppointmentDetailsModalOpen(false);
              triggerCopyAppointment(appointment);
            }}
          >
            📋 Kopieren
          </button>

          <button
            className="btn cancel-button"
            onClick={() => setIsAppointmentDetailsModalOpen(false)}
          >
            Schließen
          </button>

          {(isStaff || isAdmin) && (
            <button
              className="btn delete-button"
              style={{ backgroundColor: '#e53935', color: 'white', marginLeft: 'auto' }}
              onClick={async () => {
                const confirmed = window.confirm("Willst du diesen Termin wirklich löschen?");
                if (!confirmed) return;
                setIsAppointmentDetailsModalOpen(false);
                setTimeout(() => {
                  handleDelete(appointment);
                }, 150);
              }}
            >
              🗑️ Löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;
