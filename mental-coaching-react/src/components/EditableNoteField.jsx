import React, { useRef, useEffect, useState } from 'react';

const EditableNoteField = React.memo(({
  id,
  initialContent,
  isEditing,
  content,
  onContentChange,
  onSave,
  onNoteSaved,
  editorRef,
  maxLength = 500,
  showCharCount = true
}) => {
  const innerRef = useRef(null);
  const [charCount, setCharCount] = useState(0);

  const prevIsEditing = useRef(false);

  // ⚙️ Synchronisiere Editor-Inhalt mit props
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
  
    const safeContent = String(content || '');
  
    if (isEditing) {
      if (el.innerHTML !== safeContent) {
        el.innerHTML = safeContent;
      }
  
      // Nur Cursor setzen, wenn gerade in den Editiermodus gewechselt
      if (!prevIsEditing.current && isEditing) {
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
      }
  
    } else {
      const safeInitialContent = String(initialContent || 'Keine Notiz vorhanden.');
      if (el.innerHTML !== safeInitialContent) {
        el.innerHTML = safeInitialContent;
      }
    }
  
    // Merke den aktuellen Status für das nächste Rendern
    prevIsEditing.current = isEditing;
  }, [isEditing, content, initialContent]);
  

  useEffect(() => {
    if (editorRef) {
      editorRef.current = innerRef.current;
    }
  }, [editorRef]);

  const handleInput = (e) => {
    let raw = e.currentTarget.innerHTML;
    let cleaned = raw === '<br>' ? '' : raw;

    if (maxLength && cleaned.length > maxLength) {
      cleaned = cleaned.slice(0, maxLength);
      e.currentTarget.innerHTML = cleaned;

      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(e.currentTarget);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    setCharCount(cleaned.length);
    onContentChange(cleaned);
  };

  const handleBlur = () => {
    if (isEditing && onSave) {
      const currentHTML = innerRef.current?.innerHTML || '';
      onSave(currentHTML).then((success) => {
        if (success && onNoteSaved) onNoteSaved();
      });
    }
  };  

  return (
    <div className="note-wrapper">
      <div
        id={id}
        ref={innerRef}
        className={`note-editor ${isEditing ? 'editing' : 'view-only'}`}
        contentEditable={isEditing}
        suppressContentEditableWarning={true}
        onInput={handleInput}
      />
      {showCharCount && isEditing && (
        <div className={`char-counter ${charCount >= maxLength ? 'limit-reached' : ''}`}>
          {charCount} / {maxLength}
        </div>
      )}
    </div>
  );
});

export default EditableNoteField;
