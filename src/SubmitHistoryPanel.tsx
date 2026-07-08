import { useState } from 'react';
import type { SubmissionRecord } from './types';
import { highlightJson } from './utils';

interface Props {
  records: SubmissionRecord[];
  onCopy: (json: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

const STATUS_LABEL: Record<SubmissionRecord['status'], string> = {
  ok: '✅ 已提交',
  offline: '📦 离线生成',
  error: '⚠️ 失败',
};

export default function SubmitHistoryPanel({ records, onCopy, onDelete, onClear }: Props) {
  const [expandedId, setExpandedId] = useState('');

  if (!records.length) {
    return <div className="sl-folder-empty">暂无提交记录</div>;
  }

  return (
    <div className="submit-history">
      <div className="submit-history-head">
        <span>共 {records.length} 条记录</span>
        <button className="btn btn-secondary btn-xs" onClick={onClear}>
          清空记录
        </button>
      </div>
      <div className="submit-history-list">
        {records.map((r) => {
          const expanded = expandedId === r.id;
          const json = JSON.stringify(r.payload, null, 2);
          const parts = highlightJson(json);
          return (
            <div className="submit-history-item" key={r.id}>
              <div className="submit-history-row" onClick={() => setExpandedId(expanded ? '' : r.id)}>
                <span className="submit-history-status">{STATUS_LABEL[r.status]}</span>
                <span className="submit-history-topic" title={r.topic}>
                  {r.topic || '（未填写）'}
                </span>
                <span className="submit-history-meta">
                  {r.region} · {r.analyst || '未填写'}
                </span>
                <span className="submit-history-time">{r.submitted_at}</span>
                <button
                  className="icon-btn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(r.id);
                  }}
                  title="删除该记录"
                >
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              {expanded && (
                <div className="payload-wrap" style={{ margin: '0 0 4px' }}>
                  {r.error && <div className="submit-history-error">错误：{r.error}</div>}
                  <div className="payload-body" style={{ borderRadius: 'var(--r-md)', position: 'relative' }}>
                    <button
                      className="payload-copy"
                      style={{ position: 'absolute', top: 8, right: 8 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(json);
                      }}
                    >
                      复制 JSON
                    </button>
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
