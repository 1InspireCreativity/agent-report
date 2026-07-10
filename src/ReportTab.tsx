import { useState } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import type { ReportState } from './types';
import { buildReportPayload, CYCLE_OPTIONS, CHART_TYPE_OPTIONS } from './utils';
import { submitReportConfig } from './api';
import SubmitHistoryPanel from './SubmitHistoryPanel';
import {
  addSubmissionRecord,
  clearSubmissionHistory,
  deleteSubmissionRecord,
  loadSubmissionHistory,
  REPORT_SUBMIT_HISTORY_KEY,
} from './submissionHistory';

interface Props {
  state: ReportState;
  setState: React.Dispatch<React.SetStateAction<ReportState>>;
  toast: (msg: string) => void;
  onSave: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function ReportTab({ state, setState, toast, onSave, onUndo, onRedo, canUndo, canRedo }: Props) {
  const [templateIdDraft, setTemplateIdDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [submitHistory, setSubmitHistory] = useState(() => loadSubmissionHistory(REPORT_SUBMIT_HISTORY_KEY));

  const handleSave = () => {
    onSave();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const update = <K extends keyof ReportState>(key: K, value: ReportState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const addTemplateIdValue = (val: string) => {
    if (!val) return;
    setState((prev) => ({ ...prev, templateIds: [...prev.templateIds, val] }));
  };

  const addTemplateId = () => {
    const val = templateIdDraft.trim();
    addTemplateIdValue(val);
    setTemplateIdDraft('');
  };

  const delTemplateId = (idx: number) => {
    setState((prev) => ({ ...prev, templateIds: prev.templateIds.filter((_, i) => i !== idx) }));
  };

  const submit = async () => {
    if (!state.name) {
      toast('⚠️ 请填写报告名称');
      return;
    }
    setSubmitting(true);
    const reportPayload = buildReportPayload(state);
    const result = await submitReportConfig(reportPayload);
    setSubmitting(false);
    const status = result.ok ? 'ok' : result.offline ? 'offline' : 'error';
    setSubmitHistory(
      addSubmissionRecord(REPORT_SUBMIT_HISTORY_KEY, {
        label: state.name,
        owner: '',
        meta: `${state.cycle} · ${state.chartType}`,
        status,
        error: result.error,
        payload: reportPayload,
      })
    );
    if (result.ok) {
      toast('✅ 报告取数配置已提交给后端，报告生成中…');
    } else if (result.offline) {
      toast('✅ 配置已生成（后端未配置，可复制 Agent Payload 使用）');
    } else {
      toast('⚠️ 提交失败：' + result.error);
    }
  };

  const reset = () => {
    if (!confirm('确认重置所有报告配置？')) return;
    setState((prev) => ({
      ...prev,
      name: '',
      cycle: 'W',
      chartType: 'wuhuaro',
      description: '',
      templateIds: [],
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
      {/* Editor Toolbar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Undo"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Redo"
          >
            <Redo2 size={18} />
          </button>
        </div>
        <div>
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-md shadow-sm font-medium transition-all text-sm w-24 flex justify-center"
          >
            {isSaved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Existing content, unchanged */}
      <div className="flex-1 overflow-y-auto p-6">
    <div className="tab-panel active">
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <div className="page-head-title">报告取数配置</div>
          </div>
        </div>
      </div>

      {/* 报告信息 */}
      <div className="section-label">报告信息</div>
      <div className="card">
        <div className="card-head">
          <div className="card-icon-wrap" style={{ background: '#FFFBEB' }}>
            📋
          </div>
          <div className="card-head-text">
            <div className="card-head-title">基础设置</div>
          </div>
        </div>
        <div className="card-body">
          <div className="field" style={{ margin: 0, marginBottom: 16 }}>
            <div className="field-label">
              报告名称 <span className="req">*</span>
            </div>
            <input
              type="text"
              placeholder="NAAP Weekly Report"
              value={state.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>
          <div className="field" style={{ margin: 0, marginBottom: 16 }}>
            <div className="field-label">
              报告描述 <span className="opt">可选</span>
            </div>
            <textarea
              placeholder="例：CNOB分析报告给XX周会使用"
              value={state.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>
          <div className="grid-2" style={{ margin: 0 }}>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">
                汇报周期 <span className="req">*</span>
              </div>
              <select value={state.cycle} onChange={(e) => update('cycle', e.target.value as ReportState['cycle'])}>
                {CYCLE_OPTIONS.map((o) => (
                  <option value={o.value} key={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">
                图表类型 <span className="req">*</span>
              </div>
              <select
                value={state.chartType}
                onChange={(e) => update('chartType', e.target.value as ReportState['chartType'])}
              >
                {CHART_TYPE_OPTIONS.map((o) => (
                  <option value={o.value} key={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field" style={{ margin: '16px 0 0' }}>
            <div className="field-label">
              Template ID <span className="req">*</span> <span className="hint">支持添加多个 Template ID (键盘Enter来添加)</span>
            </div>
            <div className="tags-wrap">
              {state.templateIds.map((t, i) => (
                <span className="tag" title={t} key={i}>
                  <span className="tag-text">{t}</span>
                  <button className="tag-x" onClick={() => delTemplateId(i)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="tag-input-row">
              <input
                type="text"
                placeholder="motz7cum6ntsj6"
                value={templateIdDraft}
                onChange={(e) => setTemplateIdDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTemplateId();
                    e.preventDefault();
                  }
                }}
              />
              <button className="btn btn-secondary btn-xs" onClick={addTemplateId}>
                + 添加
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submission History */}
      <div className="section-label" style={{ marginTop: 20 }}>
        提交记录
      </div>
      <SubmitHistoryPanel
        records={submitHistory}
        onCopy={(json) => {
          navigator.clipboard.writeText(json).then(() => toast('✅ 已复制到剪贴板'));
        }}
        onDelete={(id) => {
          setSubmitHistory(deleteSubmissionRecord(REPORT_SUBMIT_HISTORY_KEY, id));
          toast('✅ 已删除该提交记录');
        }}
        onClear={() => {
          if (!confirm('确认清空全部提交记录？此操作不可撤销。')) return;
          setSubmitHistory(clearSubmissionHistory(REPORT_SUBMIT_HISTORY_KEY));
          toast('✅ 已清空提交记录');
        }}
      />

      <div className="footer-bar" style={{ border: 'none', paddingTop: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={reset}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 109-9M3 3v5h5"></path>
          </svg>
          重置
        </button>
        <button className="btn btn-success" onClick={submit} disabled={submitting}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
          </svg>
          {submitting ? '提交中…' : '提交报告取数配置给Agent'}
        </button>
        <div className="autosave">
          <div className="autosave-dot"></div>自动保存中
        </div>
      </div>
    </div>
      </div>
    </div>
  );
}
