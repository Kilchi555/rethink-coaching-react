// src/components/EditableNoteField.jsx
import React, { useRef, useEffect } from 'react';

const EditableNoteField = React.memo(({
  id,
  initialContent,    // Der Inhalt, der im Nicht-Bearbeitungsmodus angezeigt wird
  isEditing,         // Ist der Bearbeitungsmodus aktiv?
  content,           // Der aktuelle, vom Benutzer eingegebene Inhalt (aus tempState des Parents)
  onContentChange,   // Callback zum Aktualisieren des tempState im Parent
  onSave,            // Callback zum Speichern der Notiz (wenn saveNote aufgerufen wird)
  editorRef,         // Ref vom Parent (Dashboard)
  onNoteSaved        // <--- NEUE PROP: Callback, der nach erfolgreichem Speichern aufgerufen wird
}) => {
  const innerRef = useRef(null);

  useEffect(() => {
    const el = innerRef.current;
    if (el) {
      if (isEditing) {
        const safeContent = String(content || '');
        // Setze den innerHTML nur, wenn er sich vom aktuellen 'content'-Prop unterscheidet
        if (el.innerHTML !== safeContent) {
          el.innerHTML = safeContent;
        }
        setTimeout(() => {
          if (el === document.activeElement) {
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(el);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }, 0);
      } else {
        // Im Anzeigemodus: Synchronisiere den innerHTML mit initialContent.
        // Dies ist der kritische Teil, der sicherstellt, dass der neue, gespeicherte Inhalt angezeigt wird.
        const safeInitialContent = String(initialContent || 'Keine Notiz vorhanden.');
        if (el.innerHTML !== safeInitialContent) {
          el.innerHTML = safeInitialContent;
        }
      }
    }
  }, [isEditing, content, initialContent]); // initialContent ist eine wichtige Abhängigkeit

  useEffect(() => {
    if (editorRef) {
      editorRef.current = innerRef.current;
    }
  }, [editorRef]);

  const handleInput = (e) => {
    onContentChange(e.currentTarget.innerHTML);
  };

  // WICHTIG: handleBlur sollte das Speichern nur auslösen,
  // wenn der Benutzer den Fokus verliert und isEditing aktiv ist.
  // Es ruft onSave auf und wartet auf die Fertigstellung, bevor onNoteSaved aufgerufen wird.
  const handleBlur = async () => {
    if (isEditing && onSave) {
      // Stelle sicher, dass onSave (saveNote) aufgerufen wird und warte darauf.
      // Der Rückgabewert von saveNote sollte true sein, wenn erfolgreich.
      const saveSuccessful = await onSave(content);
      if (saveSuccessful && onNoteSaved) {
        onNoteSaved(); // Erst JETZT den temporären Inhalt leeren
      }
    }
  };

  return (
    <div
      id={id}
      ref={innerRef}
      className={`note-editor ${isEditing ? 'editing' : 'view-only'}`}
      contentEditable={isEditing}
      suppressContentEditableWarning={true}
      // dangeroulySetInnerHTML ist hier nur für die ERSTAUSLIEFERUNG im Anzeigemodus
      // Der useEffect synchronisiert den Inhalt dynamisch.
      dangerouslySetInnerHTML={
        !isEditing
          ? { __html: String(initialContent || 'Keine Notiz vorhanden.') }
          : undefined
      }
      onInput={handleInput}
      onBlur={handleBlur}
    />
  );
});

export default EditableNoteField;