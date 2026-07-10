import { useState } from 'react';
import { Undo2, Redo2, Folder, LayoutTemplate, Plus, Trash2 } from 'lucide-react';
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

  const addTemplateId = () => {
    setState((prev) => ({ ...prev, templateIds: [...prev.templateIds, ''] }));
  };

  const setTemplateId = (idx: number, value: string) => {
    setState((prev) => ({
      ...prev,
      templateIds: prev.templateIds.map((t, i) => (i === idx ? value : t)),
    }));
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
      cycle: '',
      chartType: '',
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

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
            {/* Folder Header */}
            <div className="bg-slate-100 border-b border-slate-200 px-5 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex-1 flex items-center gap-3">
                <div className="bg-indigo-200 text-indigo-800 p-1.5 rounded flex-shrink-0">
                  <Folder className="w-5 h-5" />
                </div>
                <div className="flex-1 flex items-center gap-2 relative">
                  <span className="text-sm font-medium text-slate-600 whitespace-nowrap">报告名称</span>
                  <input
                    type="text"
                    placeholder="NAAP Weekly Report"
                    value={state.name}
                    onChange={(e) => update('name', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className="px-5 py-4 border-b border-slate-200 bg-white grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">报告描述</label>
                <textarea
                  placeholder="例：CNOB分析报告给XX周会使用"
                  value={state.description}
                  onChange={(e) => update('description', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[60px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">汇报周期</label>
                <select
                  value={state.cycle}
                  onChange={(e) => update('cycle', e.target.value as ReportState['cycle'])}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">请选择…</option>
                  {CYCLE_OPTIONS.map((o) => (
                    <option value={o.value} key={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">图表类型</label>
                <select
                  value={state.chartType}
                  onChange={(e) => update('chartType', e.target.value as ReportState['chartType'])}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">请选择…</option>
                  {CHART_TYPE_OPTIONS.map((o) => (
                    <option value={o.value} key={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-500">Template ID (支持添加多个)</label>
                  <button
                    onClick={addTemplateId}
                    className="text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    Add Template ID
                  </button>
                </div>
                <div className="space-y-2">
                  {state.templateIds.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic pl-1">No template IDs added yet.</p>
                  ) : (
                    state.templateIds.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 relative group">
                        <div className="text-slate-400">
                          <LayoutTemplate className="w-3 h-3" />
                        </div>
                        <input
                          type="text"
                          placeholder="motz7cum6ntsj6"
                          value={t}
                          onChange={(e) => setTemplateId(i, e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-shadow"
                        />
                        <button
                          onClick={() => delTemplateId(i)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                          title="Remove Template ID"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
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

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={reset}
              className="text-slate-600 hover:text-slate-800 bg-white border border-slate-300 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              重置
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-md shadow-sm font-medium transition-all text-sm"
            >
              {submitting ? '提交中…' : '提交报告取数配置给Agent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
