import { useEffect, useRef } from 'react';

export default function DuplicateAssessmentDialog({ onClose, onViewResults }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="duplicate-assessment-dialog"
      role="alertdialog" aria-labelledby="duplicate-assessment-title"
      aria-describedby="duplicate-assessment-description"
      onCancel={e => { e.preventDefault(); onClose(); }}>
      <h2 id="duplicate-assessment-title">Assessment already submitted</h2>
      <p id="duplicate-assessment-description">
        You have already submitted these answers and received career recommendations.
        No duplicate assessment has been saved. You can view your existing results or change your answers.
      </p>
      <div className="duplicate-assessment-dialog__actions">
        <button type="button" onClick={onClose} autoFocus>Keep editing</button>
        <button type="button" onClick={onViewResults}>View my results</button>
      </div>
    </dialog>
  );
}
