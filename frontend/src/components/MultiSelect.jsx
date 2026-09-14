import { useEffect, useRef, useState } from 'react';

export default function MultiSelect({ name, placeholder, options, value, onChange, searchable = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef(null);

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

  function toggleOption(opt) {
    const next = value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt];
    onChange(next);
  }

  const filteredOptions = options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="multi-select" data-name={name} ref={rootRef}>
      <div className={`ms-trigger${open ? ' open' : ''}`} onClick={toggleOpen}>
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
              placeholder="Search skills..."
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
      </div>
    </div>
  );
}
