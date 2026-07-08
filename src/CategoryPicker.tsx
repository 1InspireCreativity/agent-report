import { useEffect, useRef, useState } from 'react';
import { CATEGORY_L1_OPTIONS, CATEGORY_OPTIONS } from './utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function CategoryPicker({ value, onChange, placeholder = '分类…', style }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState('');
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

  const label = value.includes('::') ? value.replace('::', ' · ') : value || placeholder;

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setExpanded('');
  };

  return (
    <div className="cat-picker" ref={rootRef} style={style}>
      <button
        type="button"
        className="cat-picker-trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? '' : 'cat-picker-placeholder'}>{label}</span>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </button>
      {open && (
        <div className="cat-picker-panel">
          {CATEGORY_L1_OPTIONS.map((l1) => {
            const isExpanded = expanded === l1;
            const isSelected = value === l1;
            return (
              <div className="cat-picker-group" key={l1}>
                <div className={`cat-picker-l1 ${isSelected ? 'selected' : ''}`}>
                  <span className="cat-picker-l1-label" onClick={() => pick(l1)}>
                    {l1}
                  </span>
                  <button
                    type="button"
                    className="cat-picker-toggle"
                    onClick={() => setExpanded(isExpanded ? '' : l1)}
                    title="展开二级分类"
                  >
                    <svg
                      width="11"
                      height="11"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}
                    >
                      <path d="M9 6l6 6-6 6"></path>
                    </svg>
                  </button>
                </div>
                {isExpanded && (
                  <div className="cat-picker-l2-list">
                    {(CATEGORY_OPTIONS[l1] || []).map((l2) => (
                      <div
                        key={l2}
                        className={`cat-picker-l2 ${value === `${l1}::${l2}` ? 'selected' : ''}`}
                        onClick={() => pick(`${l1}::${l2}`)}
                      >
                        {l2}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
