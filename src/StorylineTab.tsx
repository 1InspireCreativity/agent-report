import { useState } from 'react';
import type { StorylineState, StorylineDataType, ChartGroup, ChartCapability, TagCategory } from './types';
import {
  buildStorylinePayload,
  emptyNode,
  emptyTemplateGroup,
  emptyChartGroup,
  joinMethodLabel,
  nextTagId,
  tagCategoryLabel,
  CAPABILITY_OPTIONS,
  JOIN_METHOD_OPTIONS,
  REGION_OPTIONS,
  STORYLINE_TYPE_OPTIONS,
  TAG_CATEGORY_OPTIONS,
} from './utils';
import { submitChartConfig } from './api';
import PayloadPanel from './PayloadPanel';

interface Props {
  state: StorylineState;
  setState: React.Dispatch<React.SetStateAction<StorylineState>>;
  toast: (msg: string) => void;
}

export default function StorylineTab({ state, setState, toast }: Props) {
  const [linkDrafts, setLinkDrafts] = useState<Record<number, string>>({});
  const [joinMethodDrafts, setJoinMethodDrafts] = useState<Record<number, string>>({});
  const [tagCategoryDraft, setTagCategoryDraft] = useState<TagCategory>('lever');
  const [tagValueDraft, setTagValueDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addTag = () => {
    const val = tagValueDraft.trim();
    if (!val) return;
    setState((prev) => ({
      ...prev,
      tags: [...prev.tags, { id: nextTagId(), category: tagCategoryDraft, value: val }],
    }));
    setTagValueDraft('');
  };

  const delTag = (tagId: number) => {
    setState((prev) => ({ ...prev, tags: prev.tags.filter((t) => t.id !== tagId) }));
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

  const setTemplateDrillDimension = (nodeId: number, tgId: number, value: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              templateGroups: n.templateGroups.map((tg) =>
                tg.id === tgId ? { ...tg, drillDimension: value } : tg
              ),
            }
          : n
      ),
    }));
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
    const result = await submitChartConfig(buildStorylinePayload(state));
    setSubmitting(false);
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
    setState({
      topic: '',
      analyst: '',
      background: '',
      region: 'NAAP',
      tags: [],
      nodes: [],
    });
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
          <div className="field" style={{ marginTop: 14 }}>
            <div className="field-label">
              标签 <span className="hint">Lever / 产品 / Region，打在报告这一层</span>
            </div>
            <div className="tags-wrap">
              {state.tags.map((t) => (
                <span className="tag" title={`${tagCategoryLabel(t.category)}: ${t.value}`} key={t.id}>
                  <span className="tag-text">
                    {tagCategoryLabel(t.category)} · {t.value}
                  </span>
                  <button className="tag-x" onClick={() => delTag(t.id)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="tag-input-row">
              <select
                style={{ width: 120, flex: 'none' }}
                value={tagCategoryDraft}
                onChange={(e) => setTagCategoryDraft(e.target.value as TagCategory)}
              >
                {TAG_CATEGORY_OPTIONS.map((o) => (
                  <option value={o.value} key={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="标签内容，如：GBS / Gaming / NAAP"
                value={tagValueDraft}
                onChange={(e) => setTagValueDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTag();
                    e.preventDefault();
                  }
                }}
              />
              <button className="btn btn-secondary btn-xs" onClick={addTag}>
                + 添加
              </button>
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
                          下钻Dimension <span className="hint">属于该 Template ID</span>{' '}
                          <span className="opt">可选</span>
                        </div>
                        <textarea
                          rows={2}
                          style={{ fontSize: 12.5, marginBottom: 12 }}
                          placeholder="说明该 Template ID 依据哪些维度下钻，如：NAAP Lever L1、Industry 4.0 Level 1…"
                          value={tg.drillDimension}
                          onChange={(e) => setTemplateDrillDimension(n.id, tg.id, e.target.value)}
                        />
                        <div className="field-label" style={{ marginBottom: 8 }}>
                          Chart ID{' '}
                          <span className="hint">
                            一个Template ID下可有多个Chart ID，拼数方式/分析能力/Type 属于每个 Chart ID
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
