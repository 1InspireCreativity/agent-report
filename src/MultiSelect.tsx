import { useEffect, useRef, useState } from 'react';

interface Props {
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  style?: React.CSSProperties;
}

export default function MultiSelect({ options, selected, onChange, placeholder, style }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const toggleOption = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };

  return (
    <div className="multi-select" ref={rootRef} style={style}>
      <button type="button" className="multi-select-trigger" onClick={() => setOpen((v) => !v)}>
        <span className="multi-select-chips">
          {selected.length === 0 && <span className="multi-select-placeholder">{placeholder}</span>}
          {selected.map((s) => (
            <span className="tag" key={s} style={{ marginBottom: 0 }}>
              <span className="tag-text">{s}</span>
            </span>
          ))}
        </span>
        <svg
          className={`multi-select-chevron ${open ? 'open' : ''}`}
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </button>
      {open && (
        <div className="multi-select-panel">
          {options.map((opt) => (
            <div className="multi-select-option" key={opt} onClick={() => toggleOption(opt)}>
              <input type="checkbox" checked={selected.includes(opt)} readOnly />
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
