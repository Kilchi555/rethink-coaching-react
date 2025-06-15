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

  // ⚙️ Synchronisiere Editor-Inhalt mit props
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    if (isEditing) {
      const safeContent = String(content || '');
      if (el.innerHTML !== safeContent) {
        el.innerHTML = safeContent;
      }

      // Cursor ans Ende setzen
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
      const safeInitialContent = String(initialContent || 'Keine Notiz vorhanden.');
      if (el.innerHTML !== safeInitialContent) {
        el.innerHTML = safeInitialContent;
      }
    }
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
      onSave(content).then((success) => {
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
