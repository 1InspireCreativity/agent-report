import { useState } from 'react';
import type { StorylineState, StorylineDataType } from './types';
import {
  buildStorylinePayload,
  emptyNode,
  emptyChartGroup,
  joinMethodLabel,
  JOIN_METHOD_OPTIONS,
  STORYLINE_TYPE_OPTIONS,
} from './utils';
import PayloadPanel from './PayloadPanel';

interface Props {
  state: StorylineState;
  setState: React.Dispatch<React.SetStateAction<StorylineState>>;
  toast: (msg: string) => void;
}

type NodeTextField = 'scenario' | 'templateId' | 'drillDimension';

export default function StorylineTab({ state, setState, toast }: Props) {
  const [linkDrafts, setLinkDrafts] = useState<Record<number, string>>({});
  const [joinMethodDrafts, setJoinMethodDrafts] = useState<Record<number, string>>({});

  const update = <K extends keyof StorylineState>(key: K, value: StorylineState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const setNodeField = (id: number, field: NodeTextField, value: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, [field]: value } : n)),
    }));
  };

  const setNodeType = (id: number, value: StorylineDataType) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, type: value } : n)),
    }));
  };

  const addNode = () => {
    setState((prev) => ({ ...prev, nodes: [...prev.nodes, emptyNode()] }));
  };

  const delNode = (id: number) => {
    setState((prev) => ({ ...prev, nodes: prev.nodes.filter((n) => n.id !== id) }));
  };

  const addChartGroup = (nodeId: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId ? { ...n, chartGroups: [...n.chartGroups, emptyChartGroup()] } : n
      ),
    }));
  };

  const delChartGroup = (nodeId: number, groupId: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId ? { ...n, chartGroups: n.chartGroups.filter((g) => g.id !== groupId) } : n
      ),
    }));
  };

  const setChartGroupId = (nodeId: number, groupId: number, value: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, chartGroups: n.chartGroups.map((g) => (g.id === groupId ? { ...g, chartId: value } : g)) }
          : n
      ),
    }));
  };

  const addGroupQueryLink = (nodeId: number, groupId: number) => {
    const draftKey = groupId;
    const val = (linkDrafts[draftKey] || '').trim();
    if (!val) return;
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              chartGroups: n.chartGroups.map((g) =>
                g.id === groupId ? { ...g, queryLinks: [...g.queryLinks, val] } : g
              ),
            }
          : n
      ),
    }));
    setLinkDrafts((prev) => ({ ...prev, [draftKey]: '' }));
  };

  const delGroupQueryLink = (nodeId: number, groupId: number, idx: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              chartGroups: n.chartGroups.map((g) =>
                g.id === groupId ? { ...g, queryLinks: g.queryLinks.filter((_, i) => i !== idx) } : g
              ),
            }
          : n
      ),
    }));
  };

  const addJoinMethod = (id: number) => {
    const val = joinMethodDrafts[id];
    if (!val) return;
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id && !n.joinMethods.includes(val) ? { ...n, joinMethods: [...n.joinMethods, val] } : n
      ),
    }));
    setJoinMethodDrafts((prev) => ({ ...prev, [id]: '' }));
  };

  const delJoinMethod = (id: number, idx: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id ? { ...n, joinMethods: n.joinMethods.filter((_, i) => i !== idx) } : n
      ),
    }));
  };

  const submit = () => {
    if (!state.topic) {
      toast('⚠️ 请填写文件夹名称');
      return;
    }
    if (!state.nodes.length) {
      toast('⚠️ 请至少添加一个归因节点');
      return;
    }
    toast('✅ 图表配置已提交，Agent 下钻归因任务启动中…');
  };

  const reset = () => {
    if (!confirm('确认重置所有图表配置？')) return;
    setState({
      topic: '',
      analyst: '',
      background: '',
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
          <div className="field">
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
                    onChange={(e) => setNodeField(n.id, 'scenario', e.target.value)}
                  />
                  <button className="node-del" onClick={() => delNode(n.id)}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4h8v3"></path>
                    </svg>
                  </button>
                </div>
                <div className="node-body" style={{ display: 'block', padding: '16px 18px' }}>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <div className="field-label">
                      Template ID <span className="hint">一个Template ID下可有多个Chart IDs</span> <span className="req">*</span>
                    </div>
                    <input
                      type="text"
                      placeholder="motz7cum6ntsj6"
                      value={n.templateId}
                      onChange={(e) => setNodeField(n.id, 'templateId', e.target.value)}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <div className="field-label">
                      Chart ID <span className="hint">一个Chart ID下可有多个Query Links</span>{' '}
                      <span className="req">*</span>
                    </div>
                    {n.chartGroups.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          border: '1px solid var(--c-border)',
                          borderRadius: 'var(--r)',
                          background: 'var(--c-surface-2)',
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
                            onChange={(e) => setChartGroupId(n.id, g.id, e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button className="icon-btn danger" onClick={() => delChartGroup(n.id, g.id)} title="删除">
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                        <div className="tags-wrap">
                          {g.queryLinks.map((l, li) => (
                            <span className="tag" title={l} key={li}>
                              <span className="tag-text">{l.length > 40 ? l.slice(0, 38) + '…' : l}</span>
                              <button className="tag-x" onClick={() => delGroupQueryLink(n.id, g.id, li)}>
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
                                addGroupQueryLink(n.id, g.id);
                                e.preventDefault();
                              }
                            }}
                          />
                          <button className="btn btn-secondary btn-xs" onClick={() => addGroupQueryLink(n.id, g.id)}>
                            + 添加
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-secondary btn-xs" onClick={() => addChartGroup(n.id)}>
                      + 添加 Chart ID
                    </button>
                  </div>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <div className="field-label">
                      拼数方式 <span className="hint">可选择多个拼数方式</span> <span className="req">*</span>
                    </div>
                    <div className="tags-wrap">
                      {n.joinMethods.map((jm, ji) => (
                        <span className="tag" title={jm} key={ji}>
                          <span className="tag-text">{joinMethodLabel(jm)}</span>
                          <button className="tag-x" onClick={() => delJoinMethod(n.id, ji)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="tag-input-row">
                      <select
                        value={joinMethodDrafts[n.id] || ''}
                        onChange={(e) => setJoinMethodDrafts((prev) => ({ ...prev, [n.id]: e.target.value }))}
                      >
                        <option value="">请选择…</option>
                        {JOIN_METHOD_OPTIONS.map((o) => (
                          <option value={o.value} key={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <button className="btn btn-secondary btn-xs" onClick={() => addJoinMethod(n.id)}>
                        + 添加
                      </button>
                    </div>
                  </div>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <div className="field-label">
                      下钻Dimension <span className="opt">可选</span>
                    </div>
                    <textarea
                      rows={2}
                      style={{ fontSize: 12.5 }}
                      placeholder="说明该节点依据哪些维度下钻，如：NAAP Lever L1、Industry 4.0 Level 1…"
                      value={n.drillDimension}
                      onChange={(e) => setNodeField(n.id, 'drillDimension', e.target.value)}
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <div className="field-label">
                      Type <span className="hint">支持 Public / Personal</span> <span className="req">*</span>
                    </div>
                    <select value={n.type} onChange={(e) => setNodeType(n.id, e.target.value as StorylineDataType)}>
                      {STORYLINE_TYPE_OPTIONS.map((o) => (
                        <option value={o.value} key={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
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
        <button className="btn btn-primary" onClick={submit}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12l5 5L20 7"></path>
          </svg>
          提交图表配置给 Agent
        </button>
        <div className="autosave">
          <div className="autosave-dot"></div>自动保存中
        </div>
      </div>
    </div>
  );
}
