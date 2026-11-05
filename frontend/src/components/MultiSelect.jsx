/* Reusable searchable multi-select dropdown (used for Technical Skills, Industries, Career Interests, etc. in AssessmentForm.jsx). Generic component — not tied to any one field. */
import { useEffect, useRef, useState } from 'react';

export default function MultiSelect({ name, placeholder, options, value, onChange, searchable = false, error = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [addingOther, setAddingOther] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const rootRef = useRef(null);

  // Close only when a click lands outside this dropdown; remove the listener on unmount.
  useEffect(() => {
    function handleOutsideClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  function toggleOpen() {
    if (!open) setSearch('');
    setOpen((v) => !v);
  }

  // The parent owns the selected values; this component only proposes the next array.
  function toggleOption(opt) {
    const next = value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt];
    onChange(next);
  }

  function addCustomValue() {
    const text = customValue.trim();
    if (!text) return;
    const existing = [...options, ...value].find(opt => opt.toLowerCase() === text.toLowerCase());
    const entry = existing || text;
    if (entry.toLowerCase() === 'other') return;
    if (!value.includes(entry)) onChange([...value, entry]);
    setCustomValue('');
    setAddingOther(false);
  }

  const filteredOptions = [...new Set([...options, ...value])]
    .filter(opt => opt.toLowerCase() !== 'other')
    .filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="multi-select" data-name={name} ref={rootRef}>
      <div className={`ms-trigger${open ? ' open' : ''}${error ? ' error' : ''}`} onClick={toggleOpen} role="button" tabIndex={0} aria-expanded={open} aria-label={placeholder}
        onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleOpen(); } }} aria-invalid={error}>
        <div className="ms-display">
          {value.length === 0 ? (
            <span className="ms-placeholder">{placeholder}</span>
          ) : (
            value.map((v) => (
              <span className="ms-tag" key={v}>
                {v + ' '}
                <span
                  className="ms-tag-remove"
                  onClick={(e) => { e.stopPropagation(); toggleOption(v); }}
                >×</span>
              </span>
            ))
          )}
        </div>
        <span className="ms-arrow">▾</span>
      </div>
      <div className={`ms-dropdown${open ? ' open' : ''}`}>
        {searchable && (
          <div className="ms-search-wrap">
            <input
              className="ms-search"
              type="text"
              placeholder="Search options..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
        <div className="ms-options">
          {filteredOptions.map((opt) => (
            <label className="ms-option" key={opt}>
              <input type="checkbox" checked={value.includes(opt)} onChange={() => toggleOption(opt)} />
              <span className="ms-check"></span>
              <span>{opt}</span>
            </label>
          ))}
        </div>
        <button type="button" className="ms-other-button" onClick={() => { setAddingOther(true); setOpen(false); }}>
          Other — enter your own
        </button>
      </div>
      {addingOther && (
        <div className="ms-custom-entry">
          <label className="form-label" htmlFor={`${name}-other`}>Enter another option</label>
          <div className="ms-custom-entry__row">
            <input id={`${name}-other`} className="form-input" type="text" autoFocus
              maxLength={120} value={customValue} placeholder="Type your answer…"
              onChange={e => setCustomValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomValue(); } }} />
            <button type="button" className="btn" disabled={!customValue.trim() || customValue.trim().toLowerCase() === 'other'} onClick={addCustomValue}>Add</button>
            <button type="button" className="btn" onClick={() => { setAddingOther(false); setCustomValue(''); }}>Cancel</button>
          </div>
          <small>Click Add to include your answer. You can add more than one.</small>
        </div>
      )}
    </div>
  );
}
