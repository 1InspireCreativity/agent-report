import { useState } from 'react';
import type { StorylineState, StorylineDataType, ChartGroup, ChartCapability, TemplateGroup } from './types';
import {
  blankStoryline,
  buildStorylinePayload,
  emptyNode,
  emptyTemplateGroup,
  emptyChartGroup,
  joinMethodLabel,
  nextTagId,
  nextTemplateGroupId,
  nextGroupId,
  CAPABILITY_OPTIONS,
  CATEGORY_L1_OPTIONS,
  CATEGORY_OPTIONS,
  JOIN_METHOD_OPTIONS,
  REGION_OPTIONS,
  STORYLINE_TYPE_OPTIONS,
} from './utils';
import { submitChartConfig } from './api';
import PayloadPanel from './PayloadPanel';
import SubmitHistoryPanel from './SubmitHistoryPanel';
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
}

export default function StorylineTab({ state, setState, toast }: Props) {
  const [linkDrafts, setLinkDrafts] = useState<Record<number, string>>({});
  const [joinMethodDrafts, setJoinMethodDrafts] = useState<Record<number, string>>({});
  const [tagDrafts, setTagDrafts] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitHistory, setSubmitHistory] = useState(() => loadSubmissionHistory(STORYLINE_SUBMIT_HISTORY_KEY));

  const addTemplateTag = (nodeId: number, tgId: number) => {
    const draft = tagDrafts[tgId] || '';
    if (!draft) return;
    const sepIdx = draft.indexOf('::');
    const category = sepIdx >= 0 ? draft.slice(0, sepIdx) : draft;
    const val = sepIdx >= 0 ? draft.slice(sepIdx + 2) : '';
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              templateGroups: n.templateGroups.map((tg) =>
                tg.id === tgId ? { ...tg, tags: [...tg.tags, { id: nextTagId(), category, value: val }] } : tg
              ),
            }
          : n
      ),
    }));
    setTagDrafts((prev) => ({ ...prev, [tgId]: '' }));
  };

  const delTemplateTag = (nodeId: number, tgId: number, tagId: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              templateGroups: n.templateGroups.map((tg) =>
                tg.id === tgId ? { ...tg, tags: tg.tags.filter((t) => t.id !== tagId) } : tg
              ),
            }
          : n
      ),
    }));
  };

  const update = <K extends keyof StorylineState>(key: K, value: StorylineState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const setScenario = (nodeId: number, value: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, scenario: value } : n)),
    }));
  };

  const addNode = () => {
    setState((prev) => ({ ...prev, nodes: [...prev.nodes, emptyNode()] }));
  };

  const delNode = (nodeId: number) => {
    setState((prev) => ({ ...prev, nodes: prev.nodes.filter((n) => n.id !== nodeId) }));
  };

  const addTemplateGroup = (nodeId: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId ? { ...n, templateGroups: [...n.templateGroups, emptyTemplateGroup()] } : n
      ),
    }));
  };

  const delTemplateGroup = (nodeId: number, tgId: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId ? { ...n, templateGroups: n.templateGroups.filter((tg) => tg.id !== tgId) } : n
      ),
    }));
  };

  const duplicateTemplateGroup = (nodeId: number, tgId: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const idx = n.templateGroups.findIndex((tg) => tg.id === tgId);
        if (idx < 0) return n;
        const src = n.templateGroups[idx];
        const copy: TemplateGroup = {
          ...src,
          id: nextTemplateGroupId(),
          tags: src.tags.map((t) => ({ ...t, id: nextTagId() })),
          chartGroups: src.chartGroups.map((g) => ({ ...g, id: nextGroupId() })),
        };
        const templateGroups = [...n.templateGroups];
        templateGroups.splice(idx + 1, 0, copy);
        return { ...n, templateGroups };
      }),
    }));
  };

  const setTemplateId = (nodeId: number, tgId: number, value: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              templateGroups: n.templateGroups.map((tg) => (tg.id === tgId ? { ...tg, templateId: value } : tg)),
            }
          : n
      ),
    }));
  };

  const addChartGroup = (nodeId: number, tgId: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              templateGroups: n.templateGroups.map((tg) =>
                tg.id === tgId ? { ...tg, chartGroups: [...tg.chartGroups, emptyChartGroup()] } : tg
              ),
            }
          : n
      ),
    }));
  };

  const delChartGroup = (nodeId: number, tgId: number, groupId: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              templateGroups: n.templateGroups.map((tg) =>
                tg.id === tgId ? { ...tg, chartGroups: tg.chartGroups.filter((g) => g.id !== groupId) } : tg
              ),
            }
          : n
      ),
    }));
  };

  const duplicateChartGroup = (nodeId: number, tgId: number, groupId: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        return {
          ...n,
          templateGroups: n.templateGroups.map((tg) => {
            if (tg.id !== tgId) return tg;
            const idx = tg.chartGroups.findIndex((g) => g.id === groupId);
            if (idx < 0) return tg;
            const copy: ChartGroup = { ...tg.chartGroups[idx], id: nextGroupId() };
            const chartGroups = [...tg.chartGroups];
            chartGroups.splice(idx + 1, 0, copy);
            return { ...tg, chartGroups };
          }),
        };
      }),
    }));
  };

  const updateChartGroup = (
    nodeId: number,
    tgId: number,
    groupId: number,
    updater: (g: ChartGroup) => ChartGroup
  ) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              templateGroups: n.templateGroups.map((tg) =>
                tg.id === tgId
                  ? { ...tg, chartGroups: tg.chartGroups.map((g) => (g.id === groupId ? updater(g) : g)) }
                  : tg
              ),
            }
          : n
      ),
    }));
  };

  const setChartId = (nodeId: number, tgId: number, groupId: number, value: string) => {
    updateChartGroup(nodeId, tgId, groupId, (g) => ({ ...g, chartId: value }));
  };

  const addGroupQueryLink = (nodeId: number, tgId: number, groupId: number) => {
    const val = (linkDrafts[groupId] || '').trim();
    if (!val) return;
    updateChartGroup(nodeId, tgId, groupId, (g) => ({ ...g, queryLinks: [...g.queryLinks, val] }));
    setLinkDrafts((prev) => ({ ...prev, [groupId]: '' }));
  };

  const delGroupQueryLink = (nodeId: number, tgId: number, groupId: number, idx: number) => {
    updateChartGroup(nodeId, tgId, groupId, (g) => ({ ...g, queryLinks: g.queryLinks.filter((_, i) => i !== idx) }));
  };

  const addJoinMethod = (nodeId: number, tgId: number, groupId: number) => {
    const val = joinMethodDrafts[groupId];
    if (!val) return;
    updateChartGroup(nodeId, tgId, groupId, (g) =>
      g.joinMethods.includes(val) ? g : { ...g, joinMethods: [...g.joinMethods, val] }
    );
    setJoinMethodDrafts((prev) => ({ ...prev, [groupId]: '' }));
  };

  const delJoinMethod = (nodeId: number, tgId: number, groupId: number, idx: number) => {
    updateChartGroup(nodeId, tgId, groupId, (g) => ({ ...g, joinMethods: g.joinMethods.filter((_, i) => i !== idx) }));
  };

  const setDrillDimension = (nodeId: number, tgId: number, groupId: number, value: string) => {
    updateChartGroup(nodeId, tgId, groupId, (g) => ({ ...g, drillDimension: value }));
  };

  const toggleCapability = (nodeId: number, tgId: number, groupId: number, cap: ChartCapability) => {
    updateChartGroup(nodeId, tgId, groupId, (g) => ({
      ...g,
      capabilities: g.capabilities.includes(cap)
        ? g.capabilities.filter((c) => c !== cap)
        : [...g.capabilities, cap],
    }));
  };

  const setThreshold = (nodeId: number, tgId: number, groupId: number, value: string) => {
    updateChartGroup(nodeId, tgId, groupId, (g) => ({ ...g, threshold: value }));
  };

  const setChartType = (nodeId: number, tgId: number, groupId: number, value: StorylineDataType) => {
    updateChartGroup(nodeId, tgId, groupId, (g) => ({ ...g, type: value }));
  };

  const submit = async () => {
    if (!state.topic) {
      toast('⚠️ 请填写文件夹名称');
      return;
    }
    if (!state.nodes.length) {
      toast('⚠️ 请至少添加一个归因节点');
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
        owner: state.analyst,
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
            <div className="card-head-title">文件夹</div>
          </div>
        </div>
        <div className="card-body">
          <div className="field">
            <div className="field-label">
              文件夹名称 <span className="req">*</span>
            </div>
            <input
              type="text"
              placeholder="例：本周 Revenue下滑归因分析"
              value={state.topic}
              onChange={(e) => update('topic', e.target.value)}
            />
          </div>
          <div className="grid-2">
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">
                Owner <span className="req">*</span>
              </div>
              <input
                type="text"
                placeholder="姓名"
                value={state.analyst}
                onChange={(e) => update('analyst', e.target.value)}
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
            <div className="card-head-title">图表配置</div>
          </div>
          <div className="card-head-actions">
            <span style={{ fontSize: 12, color: 'var(--c-text-4)' }}>共 {state.nodes.length} 个节点</span>
          </div>
        </div>
        <div className="card-body tight">
          <div className="node-list">
            {state.nodes.map((n, i) => (
              <div className="node" key={n.id}>
                <div className="node-head">
                  <div className="node-idx">{i + 1}</div>
                  <input
                    className="node-name"
                    type="text"
                    placeholder="如：Template ID + NAAP Gaming | Daily Revenue & YOY"
                    value={n.scenario}
                    onChange={(e) => setScenario(n.id, e.target.value)}
                  />
                  <button className="node-del" onClick={() => delNode(n.id)}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4h8v3"></path>
                    </svg>
                  </button>
                </div>
                <div className="node-body" style={{ display: 'block', padding: '16px 18px' }}>
                  <div className="field" style={{ margin: 0 }}>
                    <div className="field-label">
                      Template ID <span className="hint">一个图表配置下可有多个 Template ID</span>{' '}
                      <span className="req">*</span>
                    </div>
                    {n.templateGroups.map((tg) => (
                      <div
                        key={tg.id}
                        style={{
                          border: '1px solid var(--c-border)',
                          borderRadius: 'var(--r-md)',
                          background: 'var(--c-surface-2)',
                          padding: 14,
                          marginBottom: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span className="id-bar-label" style={{ flexShrink: 0 }}>
                            Template ID
                          </span>
                          <input
                            type="text"
                            placeholder="motz7cum6ntsj6"
                            value={tg.templateId}
                            onChange={(e) => setTemplateId(n.id, tg.id, e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button
                            className="icon-btn"
                            onClick={() => duplicateTemplateGroup(n.id, tg.id)}
                            title="复制该 Template ID"
                          >
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14"></path>
                            </svg>
                          </button>
                          <button
                            className="icon-btn danger"
                            onClick={() => delTemplateGroup(n.id, tg.id)}
                            title="删除"
                          >
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                        <div className="field-label" style={{ marginBottom: 6 }}>
                          标签 <span className="hint">一级分类 / 二级分类，属于该 Template ID</span>
                        </div>
                        <div className="tags-wrap">
                          {tg.tags.map((t) => (
                            <span className="tag" title={t.value ? `${t.category}: ${t.value}` : t.category} key={t.id}>
                              <span className="tag-text">{t.value ? `${t.category} · ${t.value}` : t.category}</span>
                              <button className="tag-x" onClick={() => delTemplateTag(n.id, tg.id, t.id)}>
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="tag-input-row" style={{ marginBottom: 12 }}>
                          <select
                            style={{ flex: 1 }}
                            value={tagDrafts[tg.id] || ''}
                            onChange={(e) => setTagDrafts((prev) => ({ ...prev, [tg.id]: e.target.value }))}
                          >
                            <option value="">分类…</option>
                            {CATEGORY_L1_OPTIONS.flatMap((l1) => [
                              <option value={l1} key={l1} style={{ fontWeight: 700 }}>
                                {l1}
                              </option>,
                              ...(CATEGORY_OPTIONS[l1] || []).map((l2) => (
                                <option value={`${l1}::${l2}`} key={`${l1}::${l2}`}>
                                  {'    ' + l2}
                                </option>
                              )),
                            ])}
                          </select>
                          <button className="btn btn-secondary btn-xs" onClick={() => addTemplateTag(n.id, tg.id)}>
                            + 添加
                          </button>
                        </div>
                        <div className="field-label" style={{ marginBottom: 8 }}>
                          Chart ID{' '}
                          <span className="hint">
                            一个Template ID下可有多个Chart ID，拼数方式/下钻Dimension/分析能力/Type 属于每个 Chart ID
                          </span>
                        </div>
                        {tg.chartGroups.map((g) => (
                          <div
                            key={g.id}
                            style={{
                              border: '1px solid var(--c-border)',
                              borderRadius: 'var(--r)',
                              background: 'var(--c-surface)',
                              padding: 12,
                              marginBottom: 8,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span className="id-bar-label" style={{ flexShrink: 0 }}>
                                Chart ID
                              </span>
                              <input
                                type="text"
                                placeholder="GBSrev"
                                value={g.chartId}
                                onChange={(e) => setChartId(n.id, tg.id, g.id, e.target.value)}
                                style={{ flex: 1 }}
                              />
                              <button
                                className="icon-btn"
                                onClick={() => duplicateChartGroup(n.id, tg.id, g.id)}
                                title="复制该 Chart ID"
                              >
                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 5v14M5 12h14"></path>
                                </svg>
                              </button>
                              <button
                                className="icon-btn danger"
                                onClick={() => delChartGroup(n.id, tg.id, g.id)}
                                title="删除"
                              >
                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                            </div>

                            <div className="field-label" style={{ marginBottom: 6, fontSize: 11.5 }}>
                              Query Link
                            </div>
                            <div className="tags-wrap">
                              {g.queryLinks.map((l, li) => (
                                <span className="tag" title={l} key={li}>
                                  <span className="tag-text">{l.length > 40 ? l.slice(0, 38) + '…' : l}</span>
                                  <button className="tag-x" onClick={() => delGroupQueryLink(n.id, tg.id, g.id, li)}>
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="tag-input-row">
                              <input
                                type="url"
                                placeholder="粘贴Query Links, 例：By Quarter , Month , Week"
                                value={linkDrafts[g.id] || ''}
                                onChange={(e) => setLinkDrafts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    addGroupQueryLink(n.id, tg.id, g.id);
                                    e.preventDefault();
                                  }
                                }}
                              />
                              <button
                                className="btn btn-secondary btn-xs"
                                onClick={() => addGroupQueryLink(n.id, tg.id, g.id)}
                              >
                                + 添加
                              </button>
                            </div>

                            <div className="field-label" style={{ marginTop: 10, marginBottom: 6, fontSize: 11.5 }}>
                              拼数方式
                            </div>
                            <div className="tags-wrap">
                              {g.joinMethods.map((jm, ji) => (
                                <span className="tag" title={jm} key={ji}>
                                  <span className="tag-text">{joinMethodLabel(jm)}</span>
                                  <button className="tag-x" onClick={() => delJoinMethod(n.id, tg.id, g.id, ji)}>
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="tag-input-row">
                              <select
                                value={joinMethodDrafts[g.id] || ''}
                                onChange={(e) => setJoinMethodDrafts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                              >
                                <option value="">请选择…</option>
                                {JOIN_METHOD_OPTIONS.map((o) => (
                                  <option value={o.value} key={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="btn btn-secondary btn-xs"
                                onClick={() => addJoinMethod(n.id, tg.id, g.id)}
                              >
                                + 添加
                              </button>
                            </div>

                            <div className="field-label" style={{ marginTop: 10, marginBottom: 6, fontSize: 11.5 }}>
                              分析能力 <span className="hint">该 Chart ID 需要 Agent 执行的分析</span>{' '}
                              <span className="req">*</span>
                            </div>
                            <div className="radio-pills">
                              {CAPABILITY_OPTIONS.map((o) => (
                                <div className="radio-pill" key={o.value}>
                                  <input
                                    type="checkbox"
                                    id={`cap-${g.id}-${o.value}`}
                                    checked={g.capabilities.includes(o.value)}
                                    onChange={() => toggleCapability(n.id, tg.id, g.id, o.value)}
                                  />
                                  <label htmlFor={`cap-${g.id}-${o.value}`}>{o.label}</label>
                                </div>
                              ))}
                            </div>
                            {g.capabilities.includes('threshold') && (
                              <>
                                <div
                                  className="field-label"
                                  style={{ marginTop: 10, marginBottom: 6, fontSize: 11.5 }}
                                >
                                  阈值定义 <span className="hint">触发阈值状态提醒的条件</span>
                                </div>
                                <input
                                  type="text"
                                  placeholder="例：YoY < -10% 标红；Rev Attain < 90% 预警"
                                  value={g.threshold}
                                  onChange={(e) => setThreshold(n.id, tg.id, g.id, e.target.value)}
                                />
                              </>
                            )}

                            <div className="field-label" style={{ marginTop: 10, marginBottom: 6, fontSize: 11.5 }}>
                              下钻Dimension <span className="opt">可选</span>
                            </div>
                            <textarea
                              rows={2}
                              style={{ fontSize: 12.5 }}
                              placeholder="说明该 Chart ID 依据哪些维度下钻，如：NAAP Lever L1、Industry 4.0 Level 1…"
                              value={g.drillDimension}
                              onChange={(e) => setDrillDimension(n.id, tg.id, g.id, e.target.value)}
                            />

                            <div
                              className="field-label"
                              style={{ marginTop: 10, marginBottom: 6, fontSize: 11.5 }}
                            >
                              Type <span className="hint">支持 Public / Personal</span>
                            </div>
                            <select
                              value={g.type}
                              onChange={(e) => setChartType(n.id, tg.id, g.id, e.target.value as StorylineDataType)}
                            >
                              {STORYLINE_TYPE_OPTIONS.map((o) => (
                                <option value={o.value} key={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                        <button className="btn btn-secondary btn-xs" onClick={() => addChartGroup(n.id, tg.id)}>
                          + 添加 Chart ID
                        </button>
                      </div>
                    ))}
                    <button className="btn btn-secondary btn-xs" onClick={() => addTemplateGroup(n.id)}>
                      + 添加 Template ID
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="add-row" onClick={addNode}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            添加
          </button>
        </div>
      </div>

      {/* Payload */}
      <div className="section-label" style={{ marginTop: 20 }}>
        Agent Payload
      </div>
      <PayloadPanel
        label="Chart Config"
        meta={`${state.nodes.length} 节点`}
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
