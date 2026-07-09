import { useState } from 'react';
import type { StorylineState, StorylineDataType, ChartGroup, ChartCapability, TemplateGroup } from './types';
import {
  blankStoryline,
  buildStorylinePayload,
  emptyTemplateGroup,
  loadTemplateCatalog,
  nextTagId,
  nextTemplateGroupId,
  nextGroupId,
  nextLinkId,
  parseQueryLink,
  CAPABILITY_OPTIONS,
  GROUP_OPTIONS,
  REGION_OPTIONS,
  STORYLINE_TYPE_OPTIONS,
} from './utils';
import { submitChartConfig } from './api';
import PayloadPanel from './PayloadPanel';
import SubmitHistoryPanel from './SubmitHistoryPanel';
import CategoryPicker from './CategoryPicker';
import {
  addSubmissionRecord,
  clearSubmissionHistory,
  deleteSubmissionRecord,
  loadSubmissionHistory,
  STORYLINE_SUBMIT_HISTORY_KEY,
} from './submissionHistory';

interface Props {
  state: StorylineState;
  setState: React.Dispatch<React.SetStateAction<StorylineState>>;
  toast: (msg: string) => void;
  onSave: (visibility: StorylineDataType) => void;
}

export default function StorylineTab({ state, setState, toast, onSave }: Props) {
  const templateCatalog = loadTemplateCatalog();
  const [linkDrafts, setLinkDrafts] = useState<Record<number, string>>({});
  const [linkGroupDrafts, setLinkGroupDrafts] = useState<Record<number, string>>({});
  const [fieldDrafts, setFieldDrafts] = useState<Record<number, string>>({});
  const [drillDrafts, setDrillDrafts] = useState<Record<number, string>>({});
  const [tagDrafts, setTagDrafts] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitHistory, setSubmitHistory] = useState(() => loadSubmissionHistory(STORYLINE_SUBMIT_HISTORY_KEY));

  const update = <K extends keyof StorylineState>(key: K, value: StorylineState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const updateTemplateGroup = (tgId: number, updater: (tg: TemplateGroup) => TemplateGroup) => {
    setState((prev) => ({
      ...prev,
      templateGroups: prev.templateGroups.map((tg) => (tg.id === tgId ? updater(tg) : tg)),
    }));
  };

  const addTemplateGroup = () => {
    setState((prev) => ({ ...prev, templateGroups: [...prev.templateGroups, emptyTemplateGroup()] }));
  };

  const delTemplateGroup = (tgId: number) => {
    setState((prev) => ({ ...prev, templateGroups: prev.templateGroups.filter((tg) => tg.id !== tgId) }));
  };

  const duplicateTemplateGroup = (tgId: number) => {
    setState((prev) => {
      const idx = prev.templateGroups.findIndex((tg) => tg.id === tgId);
      if (idx < 0) return prev;
      const src = prev.templateGroups[idx];
      const copy: TemplateGroup = {
        ...src,
        id: nextTemplateGroupId(),
        drillDimensions: [...src.drillDimensions],
        tags: src.tags.map((t) => ({ ...t, id: nextTagId() })),
        chartGroups: src.chartGroups.map((g) => ({
          ...g,
          id: nextGroupId(),
          fieldList: [...g.fieldList],
          dataReports: g.dataReports.map((d) => ({ ...d, id: nextLinkId() })),
        })),
      };
      const templateGroups = [...prev.templateGroups];
      templateGroups.splice(idx + 1, 0, copy);
      return { ...prev, templateGroups };
    });
  };

  const setTemplateId = (tgId: number, value: string) => updateTemplateGroup(tgId, (tg) => ({ ...tg, templateId: value }));
  const setBusinessScene = (tgId: number, value: string) => updateTemplateGroup(tgId, (tg) => ({ ...tg, businessScene: value }));
  const setTemplateType = (tgId: number, value: StorylineDataType) => updateTemplateGroup(tgId, (tg) => ({ ...tg, type: value }));

  const addDrillDimension = (tgId: number) => {
    const val = (drillDrafts[tgId] || '').trim();
    if (!val) return;
    updateTemplateGroup(tgId, (tg) => ({ ...tg, drillDimensions: [...tg.drillDimensions, val] }));
    setDrillDrafts((prev) => ({ ...prev, [tgId]: '' }));
  };
  const delDrillDimension = (tgId: number, idx: number) => {
    updateTemplateGroup(tgId, (tg) => ({ ...tg, drillDimensions: tg.drillDimensions.filter((_, i) => i !== idx) }));
  };

  const addTemplateTag = (tgId: number) => {
    const draft = tagDrafts[tgId] || '';
    if (!draft) return;
    const sepIdx = draft.indexOf('::');
    const category = sepIdx >= 0 ? draft.slice(0, sepIdx) : draft;
    const val = sepIdx >= 0 ? draft.slice(sepIdx + 2) : '';
    updateTemplateGroup(tgId, (tg) => ({ ...tg, tags: [...tg.tags, { id: nextTagId(), category, value: val }] }));
    setTagDrafts((prev) => ({ ...prev, [tgId]: '' }));
  };
  const delTemplateTag = (tgId: number, tagId: number) => {
    updateTemplateGroup(tgId, (tg) => ({ ...tg, tags: tg.tags.filter((t) => t.id !== tagId) }));
  };

  const delChartGroup = (tgId: number, groupId: number) => {
    updateTemplateGroup(tgId, (tg) => ({ ...tg, chartGroups: tg.chartGroups.filter((g) => g.id !== groupId) }));
  };
  const duplicateChartGroup = (tgId: number, groupId: number) => {
    updateTemplateGroup(tgId, (tg) => {
      const idx = tg.chartGroups.findIndex((g) => g.id === groupId);
      if (idx < 0) return tg;
      const copy: ChartGroup = {
        ...tg.chartGroups[idx],
        id: nextGroupId(),
        fieldList: [...tg.chartGroups[idx].fieldList],
        dataReports: tg.chartGroups[idx].dataReports.map((d) => ({ ...d, id: nextLinkId() })),
      };
      const chartGroups = [...tg.chartGroups];
      chartGroups.splice(idx + 1, 0, copy);
      return { ...tg, chartGroups };
    });
  };

  const updateChartGroup = (tgId: number, groupId: number, updater: (g: ChartGroup) => ChartGroup) => {
    updateTemplateGroup(tgId, (tg) => ({
      ...tg,
      chartGroups: tg.chartGroups.map((g) => (g.id === groupId ? updater(g) : g)),
    }));
  };

  const setChartId = (tgId: number, groupId: number, value: string) => {
    updateChartGroup(tgId, groupId, (g) => ({ ...g, chartId: value }));
  };

  const addFieldListItem = (tgId: number, groupId: number) => {
    const val = (fieldDrafts[groupId] || '').trim();
    if (!val) return;
    updateChartGroup(tgId, groupId, (g) => ({ ...g, fieldList: [...g.fieldList, val] }));
    setFieldDrafts((prev) => ({ ...prev, [groupId]: '' }));
  };
  const delFieldListItem = (tgId: number, groupId: number, idx: number) => {
    updateChartGroup(tgId, groupId, (g) => ({ ...g, fieldList: g.fieldList.filter((_, i) => i !== idx) }));
  };

  const addDataReport = (tgId: number, groupId: number) => {
    const link = (linkDrafts[groupId] || '').trim();
    if (!link) return;
    const group = linkGroupDrafts[groupId] || 'Q';
    const parsed = parseQueryLink(link);
    updateChartGroup(tgId, groupId, (g) => ({
      ...g,
      dataReports: [...g.dataReports, { id: nextLinkId(), group, link, ...parsed }],
    }));
    setLinkDrafts((prev) => ({ ...prev, [groupId]: '' }));
  };
  const delDataReport = (tgId: number, groupId: number, idx: number) => {
    updateChartGroup(tgId, groupId, (g) => ({ ...g, dataReports: g.dataReports.filter((_, i) => i !== idx) }));
  };

  const toggleCapability = (tgId: number, groupId: number, cap: ChartCapability) => {
    updateChartGroup(tgId, groupId, (g) => ({
      ...g,
      capabilities: g.capabilities.includes(cap) ? g.capabilities.filter((c) => c !== cap) : [...g.capabilities, cap],
    }));
  };

  const setThreshold = (tgId: number, groupId: number, value: string) => {
    updateChartGroup(tgId, groupId, (g) => ({ ...g, threshold: value }));
  };

  const submit = async () => {
    if (!state.topic) {
      toast('⚠️ 请填写报告名称');
      return;
    }
    if (!state.templateGroups.length) {
      toast('⚠️ 请至少添加一个 Template ID');
      return;
    }
    setSubmitting(true);
    const chartPayload = buildStorylinePayload(state);
    const result = await submitChartConfig(chartPayload);
    setSubmitting(false);
    const status = result.ok ? 'ok' : result.offline ? 'offline' : 'error';
    setSubmitHistory(
      addSubmissionRecord(STORYLINE_SUBMIT_HISTORY_KEY, {
        label: state.topic,
        owner: '',
        meta: state.region,
        status,
        error: result.error,
        payload: chartPayload,
      })
    );
    if (result.ok) {
      toast('✅ 图表配置已提交给后端，Agent 任务启动中…');
    } else if (result.offline) {
      toast('✅ 配置已生成（后端未配置，可复制 Agent Payload 使用）');
    } else {
      toast('⚠️ 提交失败：' + result.error);
    }
  };

  const reset = () => {
    if (!confirm('确认重置所有图表配置？')) return;
    setState(blankStoryline());
  };

  const payload = buildStorylinePayload(state);

  return (
    <div className="tab-panel active">
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <div className="page-head-title">图表配置</div>
          </div>
        </div>
      </div>

      {/* 基础信息 */}
      <div className="section-label">基础信息</div>
      <div className="card">
        <div className="card-head">
          <div className="card-icon-wrap" style={{ background: '#EFF6FF' }}>
            📁
          </div>
          <div className="card-head-text">
            <div className="card-head-title">报告</div>
          </div>
        </div>
        <div className="card-body">
          <div className="field">
            <div className="field-label">
              报告名称 <span className="req">*</span>
            </div>
            <input
              type="text"
              placeholder="例：本周 Revenue下滑归因分析"
              value={state.topic}
              onChange={(e) => update('topic', e.target.value)}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">
              数据范围 Region <span className="req">*</span>
            </div>
            <select value={state.region} onChange={(e) => update('region', e.target.value)}>
              {REGION_OPTIONS.map((r) => (
                <option value={r} key={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
            <div className="field-label">
              背景描述 <span className="req">*</span>
            </div>
            <textarea
              rows={3}
              placeholder="描述当前业务背景、问题现象、分析触发原因……"
              value={state.background}
              onChange={(e) => update('background', e.target.value)}
            />
          </div>
          <div className="footer-bar" style={{ padding: '14px 0 0', marginTop: 14 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onSave('public')}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"></path>
              </svg>
              存为 Public
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onSave('personal')}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="11" width="14" height="9" rx="2"></rect>
                <path d="M8 11V7a4 4 0 018 0v4"></path>
              </svg>
              存为 Personal
            </button>
          </div>
        </div>
      </div>

      {/* 图表配置 */}
      <div className="section-label" style={{ marginTop: 20 }}>
        图表配置
      </div>
      <div className="card">
        <div className="card-head">
          <div className="card-icon-wrap" style={{ background: '#F5F3FF' }}>
            🧩
          </div>
          <div className="card-head-text">
            <div className="card-head-title">数据模板 / Template ID</div>
          </div>
          <div className="card-head-actions">
            <span style={{ fontSize: 12, color: 'var(--c-text-4)' }}>共 {state.templateGroups.length} 个 Template ID</span>
          </div>
        </div>
        <div className="card-body tight">
          <div className="node-list">
            {state.templateGroups.map((tg, i) => (
              <div className="node" key={tg.id}>
                <div className="node-head">
                  <div className="node-idx">{i + 1}</div>
                  <input
                    className="node-name"
                    type="text"
                    placeholder="业务场景描述，如：GBS-1Team revenue和yoy"
                    value={tg.businessScene}
                    onChange={(e) => setBusinessScene(tg.id, e.target.value)}
                  />
                  <button className="node-del" onClick={() => delTemplateGroup(tg.id)}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4h8v3"></path>
                    </svg>
                  </button>
                </div>
                <div className="node-body" style={{ display: 'block', padding: '16px 18px' }}>
                  <div
                    style={{
                      border: '1px solid var(--c-border)',
                      borderRadius: 'var(--r-md)',
                      background: '#bbe3ff',
                      padding: 14,
                      marginBottom: 10,
                    }}
                  >
                    <div className="field" style={{ margin: '0 0 12px' }}>
                      <div className="field-label" style={{ marginBottom: 6 }}>
                        Type <span className="hint">Public / Personal</span>
                      </div>
                      <select value={tg.type} onChange={(e) => setTemplateType(tg.id, e.target.value as StorylineDataType)}>
                        {STORYLINE_TYPE_OPTIONS.map((o) => (
                          <option value={o.value} key={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-label" style={{ marginBottom: 6 }}>
                      下钻Dimension <span className="opt">可选，可添加多个</span>
                    </div>
                    <div className="tags-wrap">
                      {tg.drillDimensions.map((d, di) => (
                        <span className="tag" title={d} key={di}>
                          <span className="tag-text">{d}</span>
                          <button className="tag-x" onClick={() => delDrillDimension(tg.id, di)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="tag-input-row" style={{ marginBottom: 12 }}>
                      <input
                        type="text"
                        placeholder="如：NAAP Lever L1"
                        value={drillDrafts[tg.id] || ''}
                        onChange={(e) => setDrillDrafts((prev) => ({ ...prev, [tg.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addDrillDimension(tg.id);
                            e.preventDefault();
                          }
                        }}
                      />
                      <button className="btn btn-secondary btn-xs" onClick={() => addDrillDimension(tg.id)}>
                        + 添加
                      </button>
                    </div>

                    <div className="field-label" style={{ marginBottom: 6 }}>
                      标签 <span className="hint">一级分类 / 二级分类，属于该 Template ID</span>
                    </div>
                    <div className="tags-wrap">
                      {tg.tags.map((t) => (
                        <span className="tag" title={t.value ? `${t.category}: ${t.value}` : t.category} key={t.id}>
                          <span className="tag-text">{t.value ? `${t.category} · ${t.value}` : t.category}</span>
                          <button className="tag-x" onClick={() => delTemplateTag(tg.id, t.id)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="tag-input-row" style={{ marginBottom: 12 }}>
                      <CategoryPicker
                        style={{ flex: 1 }}
                        value={tagDrafts[tg.id] || ''}
                        onChange={(v) => setTagDrafts((prev) => ({ ...prev, [tg.id]: v }))}
                      />
                      <button className="btn btn-secondary btn-xs" onClick={() => addTemplateTag(tg.id)}>
                        + 添加
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span className="id-bar-icon template">
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                          <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                          <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                          <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                        </svg>
                      </span>
                      <span className="id-bar-label" style={{ flexShrink: 0 }}>
                        Template ID
                      </span>
                      <input
                        type="text"
                        placeholder="motz7cum6ntsj6"
                        value={tg.templateId}
                        onChange={(e) => setTemplateId(tg.id, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      {templateCatalog.length > 0 && (
                        <select
                          value=""
                          style={{ width: 130, flexShrink: 0 }}
                          title="从模板选择"
                          onChange={(e) => {
                            if (e.target.value) setTemplateId(tg.id, e.target.value);
                          }}
                        >
                          <option value="">从模板选择…</option>
                          {templateCatalog.map((t) => (
                            <option value={t.templateId} key={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <button className="icon-btn" onClick={() => duplicateTemplateGroup(tg.id)} title="复制该 Template ID">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14"></path>
                        </svg>
                      </button>
                      <button className="icon-btn danger" onClick={() => delTemplateGroup(tg.id)} title="删除">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>

                    <div className="field-label" style={{ marginBottom: 8 }}>
                      Chart ID <span className="hint">一个 Template ID 下可有多个 Chart ID</span>
                    </div>
                    {tg.chartGroups.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          border: '1px solid var(--c-border)',
                          borderRadius: 'var(--r)',
                          background: '#fffaa2',
                          padding: 12,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span className="id-bar-icon chart">
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path d="M4 20V10M12 20V4M20 20v-7"></path>
                            </svg>
                          </span>
                          <span className="id-bar-label" style={{ flexShrink: 0 }}>
                            Chart ID
                          </span>
                          <input
                            type="text"
                            placeholder="GBSrev"
                            value={g.chartId}
                            onChange={(e) => setChartId(tg.id, g.id, e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button className="icon-btn" onClick={() => duplicateChartGroup(tg.id, g.id)} title="复制该 Chart ID">
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14"></path>
                            </svg>
                          </button>
                          <button className="icon-btn danger" onClick={() => delChartGroup(tg.id, g.id)} title="删除">
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>

                        <div className="field-label" style={{ marginBottom: 6, fontSize: 11.5 }}>
                          指标字段 field_list
                        </div>
                        <div className="tags-wrap">
                          {g.fieldList.map((f, fi) => (
                            <span className="tag" title={f} key={fi}>
                              <span className="tag-text">{f}</span>
                              <button className="tag-x" onClick={() => delFieldListItem(tg.id, g.id, fi)}>
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="tag-input-row">
                          <input
                            type="text"
                            placeholder="如：Stat Date"
                            value={fieldDrafts[g.id] || ''}
                            onChange={(e) => setFieldDrafts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addFieldListItem(tg.id, g.id);
                                e.preventDefault();
                              }
                            }}
                          />
                          <button className="btn btn-secondary btn-xs" onClick={() => addFieldListItem(tg.id, g.id)}>
                            + 添加
                          </button>
                        </div>

                        <div className="field-label" style={{ marginTop: 10, marginBottom: 6, fontSize: 11.5 }}>
                          拼数方式 <span className="hint">选择下一条 Query Link 所属的分组</span>
                        </div>
                        <div className="radio-pills">
                          {GROUP_OPTIONS.map((o) => (
                            <div className="radio-pill" key={o.value}>
                              <input
                                type="radio"
                                id={`group-${g.id}-${o.value}`}
                                name={`group-${g.id}`}
                                checked={(linkGroupDrafts[g.id] || 'Q') === o.value}
                                onChange={() => setLinkGroupDrafts((prev) => ({ ...prev, [g.id]: o.value }))}
                              />
                              <label htmlFor={`group-${g.id}-${o.value}`}>{o.value}</label>
                            </div>
                          ))}
                        </div>

                        <div className="field-label" style={{ marginTop: 10, marginBottom: 6, fontSize: 11.5 }}>
                          Query Link
                        </div>
                        <div className="tree-list">
                          {g.dataReports.length === 0 && <div className="tree-empty">暂无 Query Link</div>}
                          {g.dataReports.map((d, di) => (
                            <div className="tree-item" key={di}>
                              <svg className="tree-connector" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M6 3v10a2 2 0 002 2h8"></path>
                              </svg>
                              <svg className="tree-item-icon" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M10 13a5 5 0 007.07 0l1.42-1.42a5 5 0 00-7.07-7.07L10 6"></path>
                                <path d="M14 11a5 5 0 00-7.07 0l-1.42 1.42a5 5 0 007.07 7.07L14 18"></path>
                              </svg>
                              <span className="tree-item-text" title={d.link}>
                                [{d.group}] {d.link}
                              </span>
                              <button className="tree-item-x" onClick={() => delDataReport(tg.id, g.id, di)}>
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="tag-input-row">
                          <input
                            type="url"
                            placeholder="粘贴 Query Link"
                            value={linkDrafts[g.id] || ''}
                            onChange={(e) => setLinkDrafts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addDataReport(tg.id, g.id);
                                e.preventDefault();
                              }
                            }}
                          />
                          <button className="btn btn-secondary btn-xs" onClick={() => addDataReport(tg.id, g.id)}>
                            + 添加
                          </button>
                        </div>

                        <div className="field-label" style={{ marginTop: 10, marginBottom: 6, fontSize: 11.5 }}>
                          分析能力 <span className="hint">该 Chart ID 需要 Agent 执行的分析</span> <span className="req">*</span>
                        </div>
                        <div className="radio-pills">
                          {CAPABILITY_OPTIONS.map((o) => (
                            <div className="radio-pill" key={o.value}>
                              <input
                                type="checkbox"
                                id={`cap-${g.id}-${o.value}`}
                                checked={g.capabilities.includes(o.value)}
                                onChange={() => toggleCapability(tg.id, g.id, o.value)}
                              />
                              <label htmlFor={`cap-${g.id}-${o.value}`}>{o.label}</label>
                            </div>
                          ))}
                        </div>
                        {g.capabilities.includes('threshold') && (
                          <>
                            <div className="field-label" style={{ marginTop: 10, marginBottom: 6, fontSize: 11.5 }}>
                              阈值定义 <span className="hint">触发阈值状态提醒的条件</span>
                            </div>
                            <input
                              type="text"
                              placeholder="例：YoY < -10% 标红；Rev Attain < 90% 预警"
                              value={g.threshold}
                              onChange={(e) => setThreshold(tg.id, g.id, e.target.value)}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="add-row" onClick={addTemplateGroup}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            添加 Template ID
          </button>
        </div>
      </div>

      {/* Payload */}
      <div className="section-label" style={{ marginTop: 20 }}>
        Agent Payload
      </div>
      <PayloadPanel
        label="Chart Config"
        meta={`${state.templateGroups.length} 个 Template ID`}
        payload={payload}
        onCopy={() => toast('✅ 已复制到剪贴板')}
      />

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
          setSubmitHistory(deleteSubmissionRecord(STORYLINE_SUBMIT_HISTORY_KEY, id));
          toast('✅ 已删除该提交记录');
        }}
        onClear={() => {
          if (!confirm('确认清空全部提交记录？此操作不可撤销。')) return;
          setSubmitHistory(clearSubmissionHistory(STORYLINE_SUBMIT_HISTORY_KEY));
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
        <button className="btn btn-primary" onClick={submit} disabled={submitting}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12l5 5L20 7"></path>
          </svg>
          {submitting ? '提交中…' : '提交图表配置给 Agent'}
        </button>
        <div className="autosave">
          <div className="autosave-dot"></div>自动保存中
        </div>
      </div>
    </div>
  );
}
