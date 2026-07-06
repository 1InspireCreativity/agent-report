import { useEffect, useState } from 'react';
import type { ReportState, ReportTemplate } from './types';
import { buildReportPayload, normalizeReport, CYCLE_OPTIONS, CHART_TYPE_OPTIONS, OWNER_DEPT_OPTIONS } from './utils';
import PayloadPanel from './PayloadPanel';

interface Props {
  state: ReportState;
  setState: React.Dispatch<React.SetStateAction<ReportState>>;
  toast: (msg: string) => void;
}

const TEMPLATES_KEY = 'reportTemplates';

function loadTemplates(): ReportTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTemplates(arr: ReportTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(arr));
}

export default function ReportTab({ state, setState, toast }: Props) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTplId, setSelectedTplId] = useState('');
  const [chartIdDraft, setChartIdDraft] = useState('');

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const update = <K extends keyof ReportState>(key: K, value: ReportState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const addChartId = () => {
    const val = chartIdDraft.trim();
    if (!val) return;
    setState((prev) => ({ ...prev, chartIds: [...prev.chartIds, val] }));
    setChartIdDraft('');
  };

  const delChartId = (idx: number) => {
    setState((prev) => ({ ...prev, chartIds: prev.chartIds.filter((_, i) => i !== idx) }));
  };

  const submit = () => {
    if (!state.name) {
      toast('⚠️ 请填写周报名称');
      return;
    }
    toast('✅ 配置已提交，周报生成中…');
  };

  const reset = () => {
    if (!confirm('确认重置所有周报配置？')) return;
    setState((prev) => ({
      ...prev,
      name: '',
      cycle: 'W',
      chartType: 'wuhuaro',
      description: '',
      chartIds: [],
      owner: '',
      ownerEmail: '',
      ownerDept: '',
    }));
  };

  const saveTemplate = () => {
    const name = state.templateName.trim();
    if (!name) {
      toast('⚠️ 请填写当前配置名称');
      return;
    }
    const arr = loadTemplates();
    let idx = selectedTplId ? arr.findIndex((t) => t.id === selectedTplId) : -1;
    if (idx < 0) idx = arr.findIndex((t) => t.name === name);
    const item: ReportTemplate = {
      id: idx >= 0 ? arr[idx].id : String(Date.now()),
      name,
      updated_at: new Date().toLocaleString(),
      state,
    };
    if (idx >= 0) arr[idx] = item;
    else arr.unshift(item);
    saveTemplates(arr);
    setTemplates(arr);
    setSelectedTplId(item.id);
    toast('✅ 已保存配置：' + name);
  };

  const newTemplate = () => {
    const ok = !state.name || confirm('新增配置会清空当前页面，确认继续？');
    if (!ok) return;
    setState((prev) => ({
      ...prev,
      templateName: '',
      name: '',
      cycle: 'W',
      description: '',
      chartIds: [],
      owner: '',
      ownerEmail: '',
      ownerDept: '',
    }));
    setSelectedTplId('');
    toast('✅ 已新增空白报表配置');
  };

  const loadTemplate = (id: string) => {
    if (!id) return;
    const item = templates.find((t) => t.id === id);
    if (!item) {
      toast('⚠️ 未找到历史配置');
      return;
    }
    setState(normalizeReport(item.state));
    setSelectedTplId(id);
    toast('✅ 已载入历史配置：' + item.name);
  };

  const editTemplate = () => {
    if (!selectedTplId) {
      toast('⚠️ 请先选择一个历史配置');
      return;
    }
    saveTemplate();
    toast('✅ 历史配置已更新');
  };

  const payload = buildReportPayload(state);

  return (
    <div className="tab-panel active">
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <div className="page-head-title">周报取数配置</div>
            <div className="page-head-desc">配置周报名称、汇报周期与图表 ID，以及负责人信息。</div>
          </div>
          <button className="btn btn-success" onClick={submit}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            提交配置 · 生成周报
          </button>
        </div>
        <div className="page-head-meta">
          <div className="meta-chip">
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            自动草稿保存
          </div>
        </div>
      </div>

      {/* 周报信息 */}
      <div className="section-label">周报信息</div>
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
              周报名称 <span className="req">*</span>
            </div>
            <input
              type="text"
              placeholder="电商业务周报 W26"
              value={state.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>
          <div className="field" style={{ margin: 0, marginBottom: 16 }}>
            <div className="field-label">
              周报描述 <span className="opt">可选</span>
            </div>
            <textarea
              placeholder="简要描述该周报的分析目标与覆盖范围…"
              value={state.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>
          <div className="grid-2" style={{ margin: 0 }}>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">汇报周期</div>
              <select value={state.cycle} onChange={(e) => update('cycle', e.target.value as ReportState['cycle'])}>
                {CYCLE_OPTIONS.map((o) => (
                  <option value={o.value} key={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">图表类型</div>
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
          <div className="grid-2" style={{ margin: '16px 0 0' }}>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">
                Chart ID <span className="req">*</span> <span className="hint">支持添加多个 Chart ID</span>
              </div>
              <div className="tags-wrap">
                {state.chartIds.map((c, i) => (
                  <span className="tag" title={c} key={i}>
                    <span className="tag-text">{c}</span>
                    <button className="tag-x" onClick={() => delChartId(i)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="tag-input-row">
                <input
                  type="text"
                  placeholder="cht_auto_weekly_001"
                  value={chartIdDraft}
                  onChange={(e) => setChartIdDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addChartId();
                      e.preventDefault();
                    }
                  }}
                />
                <button className="btn btn-secondary btn-xs" onClick={addChartId}>
                  + 添加
                </button>
              </div>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">
                Owner <span className="req">*</span>
              </div>
              <input
                type="text"
                placeholder="负责人姓名"
                value={state.owner}
                onChange={(e) => update('owner', e.target.value)}
              />
            </div>
          </div>
          <div className="grid-2" style={{ margin: '16px 0 0' }}>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">
                Owner Email <span className="opt">可选</span>
              </div>
              <input
                type="text"
                placeholder="owner@example.com"
                value={state.ownerEmail}
                onChange={(e) => update('ownerEmail', e.target.value)}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">
                Owner Department <span className="opt">可选</span>
              </div>
              <select value={state.ownerDept} onChange={(e) => update('ownerDept', e.target.value)}>
                <option value="">请选择…</option>
                {OWNER_DEPT_OPTIONS.map((o) => (
                  <option value={o.value} key={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 模版流程 */}
      <div className="section-label" style={{ marginTop: 20 }}>
        模版流程
      </div>
      <div className="card">
        <div className="card-head">
          <div className="card-icon-wrap" style={{ background: '#EFF6FF' }}>
            🏵️
          </div>
          <div className="card-head-text">
            <div className="card-head-title">报表模版配置管理</div>
          </div>
        </div>
        <div className="card-body">
          <div className="grid-2" style={{ margin: 0 }}>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">历史配置 / 报表模版</div>
              <select value={selectedTplId} onChange={(e) => loadTemplate(e.target.value)}>
                <option value="">{templates.length ? '选择历史配置…' : '暂无历史配置'}</option>
                {templates.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">当前配置名称</div>
              <input
                type="text"
                placeholder="例：xx周报 / 电商业务周报 W26"
                value={state.templateName}
                onChange={(e) => update('templateName', e.target.value)}
              />
            </div>
          </div>
          <div className="footer-bar" style={{ padding: '14px 0 0', marginTop: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={saveTemplate}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7"></path>
              </svg>
              保存配置
            </button>
            <button className="btn btn-secondary btn-sm" onClick={newTemplate}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              新增其他报表配置
            </button>
            <button className="btn btn-warning btn-sm" onClick={editTemplate}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              更改历史配置
            </button>
            <div className="autosave">
              <div className="autosave-dot"></div>
              {templates.length} 个历史配置
            </div>
          </div>
        </div>
      </div>

      {/* Payload */}
      <div className="section-label" style={{ marginTop: 20 }}>
        Agent Payload
      </div>
      <PayloadPanel
        label="Weekly Report Config"
        meta={state.name || '未命名周报'}
        payload={payload}
        onCopy={() => toast('✅ 已复制到剪贴板')}
      />

      <div className="footer-bar" style={{ border: 'none', paddingTop: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={reset}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 109-9M3 3v5h5"></path>
          </svg>
          重置
        </button>
        <button className="btn btn-success" onClick={submit}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
          </svg>
          提交配置 · 生成周报
        </button>
        <div className="autosave">
          <div className="autosave-dot"></div>自动保存中
        </div>
      </div>
    </div>
  );
}
