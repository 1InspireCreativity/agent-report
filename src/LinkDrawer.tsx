import { useEffect, useState } from 'react';
import type { ReportChartItem } from './types';

interface Props {
  open: boolean;
  items: ReportChartItem[];
  onClose: () => void;
  onSave: (updates: Record<number, string>) => void;
}

export default function LinkDrawer({ open, items, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<Record<number, string>>({});

  useEffect(() => {
    if (open) {
      const d: Record<number, string> = {};
      items.forEach((it) => (d[it.id] = it.link));
      setDraft(d);
    }
  }, [open, items]);

  if (!open) return null;

  const handleSave = () => {
    const changes: Record<number, string> = {};
    let changedCount = 0;
    items.forEach((it) => {
      if (draft[it.id] !== undefined && draft[it.id] !== it.link) {
        changes[it.id] = draft[it.id];
        changedCount += 1;
      }
    });
    onSave(changes);
    onClose();
    return changedCount;
  };

  return (
    <div
      className="overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-top">
          <div className="drawer-icon">🔗</div>
          <div>
            <div className="drawer-title">快速修改取数链接</div>
            <div className="drawer-sub">
              集中编辑所有图表的取数链接
              <br />
              修改完成后点击「保存并同步」生效
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="drawer-scroll">
          {!items.length ? (
            <div className="empty">
              <div className="empty-emoji">🗂️</div>
              <p>
                还没有图表配置。
                <br />
                请先在「图表配置列表」中添加图表。
              </p>
            </div>
          ) : (
            items.map((it, i) => {
              const val = draft[it.id] ?? '';
              const isEmpty = !val;
              const changed = val !== it.link;
              return (
                <div className="link-row" key={it.id}>
                  <div className="link-row-top">
                    <div className="link-row-n">{i + 1}</div>
                    <div className="link-row-name">{it.title || `图表 ${i + 1}`}</div>
                    <span className={`link-status ${isEmpty ? 'empty' : 'ok'}`}>
                      {isEmpty ? '待填写' : '已配置'}
                    </span>
                  </div>
                  <div className="link-input-wrap">
                    <input
                      type="url"
                      value={val}
                      placeholder="粘贴取数链接…"
                      onChange={(e) => setDraft((prev) => ({ ...prev, [it.id]: e.target.value }))}
                    />
                    <button
                      className="link-open"
                      title="打开链接"
                      onClick={() => {
                        if (val) window.open(val, '_blank');
                      }}
                    >
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </button>
                  </div>
                  {changed && (
                    <div className="changed-hint show">
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 8v4m0 4h.01"></path>
                      </svg>
                      已修改，保存后生效
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="drawer-foot">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M5 12l5 5L20 7"></path>
            </svg>
            保存并同步
          </button>
        </div>
      </div>
    </div>
  );
}
