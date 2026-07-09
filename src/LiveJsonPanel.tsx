import { highlightJson } from './utils';

interface Props {
  payload: unknown;
}

export default function LiveJsonPanel({ payload }: Props) {
  const json = JSON.stringify(payload, null, 2);
  const parts = highlightJson(json);

  return (
    <div className="live-json-panel">
      <div className="live-json-head">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#7EE787" strokeWidth="2">
          <path d="M16 18l6-6-6-6M8 6l-6 6 6 6"></path>
        </svg>
        Live JSON Output
      </div>
      <pre className="live-json-body">
        {parts.map((p, i) =>
          p.cls ? (
            <span key={i} className={p.cls}>
              {p.text}
            </span>
          ) : (
            <span key={i}>{p.text}</span>
          )
        )}
      </pre>
    </div>
  );
}
