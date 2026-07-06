import { useState } from 'react';
import { highlightJson } from './utils';

interface Props {
  label: string;
  meta: string;
  payload: unknown;
  onCopy: () => void;
}

export default function PayloadPanel({ label, meta, payload, onCopy }: Props) {
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(payload, null, 2);
  const parts = highlightJson(json);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(json).then(onCopy);
  };

  return (
    <div className="payload-wrap">
      <div
        className="payload-topbar"
        onClick={() => setExpanded((v) => !v)}
        style={{ cursor: 'pointer', borderRadius: expanded ? undefined : 'var(--r-md)' }}
      >
        <span className="payload-label">{label}</span>
        <div className="payload-actions">
          <span className="payload-meta">{meta}</span>
          <button className="payload-copy" onClick={handleCopy}>
            复制 JSON
          </button>
          <svg
            width="12"
            height="12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#9CA3AF"
            strokeWidth="2.5"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}
          >
            <path d="M6 9l6 6 6-6"></path>
          </svg>
        </div>
      </div>
      {expanded && (
        <div className="payload-body">
          {parts.map((p, i) =>
            p.cls ? (
              <span key={i} className={p.cls}>
                {p.text}
              </span>
            ) : (
              <span key={i}>{p.text}</span>
            )
          )}
        </div>
      )}
    </div>
  );
}
