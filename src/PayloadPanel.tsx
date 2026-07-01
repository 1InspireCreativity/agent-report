import { highlightJson } from './utils';

interface Props {
  label: string;
  meta: string;
  payload: unknown;
  onCopy: () => void;
}

export default function PayloadPanel({ label, meta, payload, onCopy }: Props) {
  const json = JSON.stringify(payload, null, 2);
  const parts = highlightJson(json);

  const handleCopy = () => {
    navigator.clipboard.writeText(json).then(onCopy);
  };

  return (
    <div className="payload-wrap">
      <div className="payload-topbar">
        <span className="payload-label">{label}</span>
        <div className="payload-actions">
          <span className="payload-meta">{meta}</span>
          <button className="payload-copy" onClick={handleCopy}>
            复制 JSON
          </button>
        </div>
      </div>
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
    </div>
  );
}
