import { useState } from 'react';
import type { StorylineState, StorylineDataType } from './types';
import { buildStorylinePayload, emptyNode, emptyMetricMapping, STORYLINE_TYPE_OPTIONS } from './utils';
import PayloadPanel from './PayloadPanel';

interface Props {
  state: StorylineState;
  setState: React.Dispatch<React.SetStateAction<StorylineState>>;
  toast: (msg: string) => void;
}

type NodeTextField = 'scenario' | 'joinMethod' | 'templateId' | 'drillDimension' | 'owner';

export default function StorylineTab({ state, setState, toast }: Props) {
  const [linkDrafts, setLinkDrafts] = useState<Record<number, string>>({});
  const [dataSetDrafts, setDataSetDrafts] = useState<Record<number, string>>({});

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

  const addQueryLink = (id: number) => {
    const val = (linkDrafts[id] || '').trim();
    if (!val) return;
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, queryLinks: [...n.queryLinks, val] } : n)),
    }));
    setLinkDrafts((prev) => ({ ...prev, [id]: '' }));
  };

  const delQueryLink = (id: number, idx: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id ? { ...n, queryLinks: n.queryLinks.filter((_, i) => i !== idx) } : n
      ),
    }));
  };

  const addDataSet = (id: number) => {
    const val = (dataSetDrafts[id] || '').trim();
    if (!val) return;
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, dataSets: [...n.dataSets, val] } : n)),
    }));
    setDataSetDrafts((prev) => ({ ...prev, [id]: '' }));
  };

  const delDataSet = (id: number, idx: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id ? { ...n, dataSets: n.dataSets.filter((_, i) => i !== idx) } : n
      ),
    }));
  };

  const addMetric = (id: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, metrics: [...n.metrics, emptyMetricMapping()] } : n)),
    }));
  };

  const delMetric = (id: number, metricId: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id ? { ...n, metrics: n.metrics.filter((m) => m.id !== metricId) } : n
      ),
    }));
  };

  const setMetricField = (id: number, metricId: number, field: 'metric' | 'chartId', value: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id
          ? { ...n, metrics: n.metrics.map((m) => (m.id === metricId ? { ...m, [field]: value } : m)) }
          : n
      ),
    }));
  };

  const submit = () => {
    if (!state.topic) {
      toast('⚠️ 请填写分析主题');
      return;
    }
    if (!state.nodes.length) {
      toast('⚠️ 请至少添加一个归因节点');
      return;
    }
    toast('✅ 故事线已提交，Agent 下钻归因任务启动中…');
  };

  const reset = () => {
    if (!confirm('确认重置所有故事线配置？')) return;
    setState({
      topic: '',
      period: '',
      analyst: '',
      background: '',
      framework: '',
      fieldId: '',
      chartId: '',
      nodes: [],
    });
  };

  const payload = buildStorylinePayload(state);

  return (
    <div className="tab-panel active">
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <div className="page-head-title">故事线配置</div>
            <div className="page-head-desc">
              定义分析任务的主题、背景与归因节点，Agent 将按此上下文逐层下钻。
            </div>
          </div>
          <button className="btn btn-primary" onClick={submit}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12l5 5L20 7"></path>
            </svg>
            提交给 Agent
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
          <div className="meta-chip">
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v4M12 19v4"></path>
            </svg>
            {state.nodes.length} 个归因节点
          </div>
        </div>
      </div>

      {/* 基础信息 */}
      <div className="section-label">基础信息</div>
      <div className="card">
        <div className="card-head">
          <div className="card-icon-wrap" style={{ background: '#EFF6FF' }}>
            🎯
          </div>
          <div className="card-head-text">
            <div className="card-head-title">分析任务定义</div>
            <div className="card-head-desc">明确分析主题、时间范围与责任人</div>
          </div>
        </div>
        <div className="card-body">
          <div className="field">
            <div className="field-label">
              分析主题 <span className="req">*</span>
            </div>
            <input
              type="text"
              placeholder="例：Q2 GMV 下滑归因分析"
              value={state.topic}
              onChange={(e) => update('topic', e.target.value)}
            />
          </div>
          <div className="grid-2">
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">
                时间范围 <span className="opt">可选</span>
              </div>
              <input
                type="text"
                placeholder="2024-04-01 ~ 2024-06-30"
                value={state.period}
                onChange={(e) => update('period', e.target.value)}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">负责分析师</div>
              <input
                type="text"
                placeholder="姓名 / 花名"
                value={state.analyst}
                onChange={(e) => update('analyst', e.target.value)}
              />
            </div>
          </div>
          <div className="grid-2" style={{ marginTop: 14 }}>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">Field ID</div>
              <input
                type="text"
                placeholder="fld_12345"
                value={state.fieldId}
                onChange={(e) => update('fieldId', e.target.value)}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">Chart ID</div>
              <input
                type="text"
                placeholder="cht_67890"
                value={state.chartId}
                onChange={(e) => update('chartId', e.target.value)}
              />
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

      {/* 下钻思路 */}
      <div className="section-label" style={{ marginTop: 20 }}>
        分析框架
      </div>
      <div className="card">
        <div className="card-head">
          <div className="card-icon-wrap" style={{ background: '#F0FDF4' }}>
            🔍
          </div>
          <div className="card-head-text">
            <div className="card-head-title">下钻归因思路</div>
            <div className="card-head-desc">Agent 将按此框架逐层展开分解</div>
          </div>
        </div>
        <div className="card-body">
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">整体分析框架</div>
            <textarea
              rows={4}
              placeholder="例：先从供给侧（SKU 数量、价格带）和需求侧（流量、转化率、客单价）两个维度切入，再分渠道（直播、搜索、推荐）下钻，最后锁定核心归因…"
              value={state.framework}
              onChange={(e) => update('framework', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 归因节点 */}
      <div className="section-label" style={{ marginTop: 20 }}>
        归因节点
      </div>
      <div className="card">
        <div className="card-head">
          <div className="card-icon-wrap" style={{ background: '#F5F3FF' }}>
            🧩
          </div>
          <div className="card-head-text">
            <div className="card-head-title">图表配置</div>
            <div className="card-head-desc">每个节点对应一个业务场景，绑定取数链接、指标口径与数据集</div>
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
                    placeholder="业务场景描述（如：GBS-1 Team revenue 和 YoY）"
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
                      Query Link <span className="hint">支持添加多个链接</span>
                    </div>
                    <div className="tags-wrap">
                      {n.queryLinks.map((l, li) => (
                        <span className="tag" title={l} key={li}>
                          <span className="tag-text">{l.length > 46 ? l.slice(0, 44) + '…' : l}</span>
                          <button className="tag-x" onClick={() => delQueryLink(n.id, li)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="tag-input-row">
                      <input
                        type="url"
                        placeholder="粘贴 Query Links，如：Quarter Link, Month Link, Week Link"
                        value={linkDrafts[n.id] || ''}
                        onChange={(e) => setLinkDrafts((prev) => ({ ...prev, [n.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addQueryLink(n.id);
                            e.preventDefault();
                          }
                        }}
                      />
                      <button className="btn btn-secondary btn-xs" onClick={() => addQueryLink(n.id)}>
                        + 添加
                      </button>
                    </div>
                  </div>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <div className="field-label">拼数方式</div>
                    <input
                      type="text"
                      placeholder="如：QMW / 其他拼接方式"
                      value={n.joinMethod}
                      onChange={(e) => setNodeField(n.id, 'joinMethod', e.target.value)}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <div className="field-label">Template ID</div>
                    <input
                      type="text"
                      placeholder="tpl_12345"
                      value={n.templateId}
                      onChange={(e) => setNodeField(n.id, 'templateId', e.target.value)}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <div className="field-label">
                      Metric and Chart ID <span className="hint">按行填写 Metric 定义与对应 Chart ID 的映射关系</span>
                    </div>
                    {n.metrics.map((m, mi) => (
                      <div className="id-bar" key={m.id} style={{ marginTop: mi === 0 ? 0 : 8 }}>
                        <span className="id-bar-label">Metric</span>
                        <input
                          type="text"
                          placeholder='如：["Stat Date", "Dollar Revenue Real"]'
                          value={m.metric}
                          onChange={(e) => setMetricField(n.id, m.id, 'metric', e.target.value)}
                        />
                        <span className="div">→</span>
                        <span className="id-bar-label">Chart ID</span>
                        <input
                          type="text"
                          placeholder="GBSrev"
                          value={m.chartId}
                          onChange={(e) => setMetricField(n.id, m.id, 'chartId', e.target.value)}
                        />
                        <button className="icon-btn danger" onClick={() => delMetric(n.id, m.id)} title="删除">
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button className="btn btn-secondary btn-xs" style={{ marginTop: 8 }} onClick={() => addMetric(n.id)}>
                      + 添加映射关系
                    </button>
                  </div>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <div className="field-label">下钻Dimension</div>
                    <textarea
                      rows={2}
                      style={{ fontSize: 12.5 }}
                      placeholder="说明该节点依据哪些维度下钻，如：NAAP Lever L1、Industry 4.0 Level 1…"
                      value={n.drillDimension}
                      onChange={(e) => setNodeField(n.id, 'drillDimension', e.target.value)}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <div className="field-label">
                      Dataset <span className="hint">支持添加多个数据集</span>
                    </div>
                    <div className="tags-wrap">
                      {n.dataSets.map((d, di) => (
                        <span className="tag" title={d} key={di}>
                          <span className="tag-text">{d.length > 46 ? d.slice(0, 44) + '…' : d}</span>
                          <button className="tag-x" onClick={() => delDataSet(n.id, di)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="tag-input-row">
                      <input
                        type="text"
                        placeholder="粘贴Dataset名称，如：[Restricted Access] NAAP_Performance_with_GBS_FullSnapshot_Dataset"
                        value={dataSetDrafts[n.id] || ''}
                        onChange={(e) => setDataSetDrafts((prev) => ({ ...prev, [n.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addDataSet(n.id);
                            e.preventDefault();
                          }
                        }}
                      />
                      <button className="btn btn-secondary btn-xs" onClick={() => addDataSet(n.id)}>
                        + 添加
                      </button>
                    </div>
                  </div>
                  <div className="grid-2" style={{ margin: 0 }}>
                    <div className="field" style={{ margin: 0 }}>
                      <div className="field-label">Owner</div>
                      <input
                        type="text"
                        placeholder="负责人姓名"
                        value={n.owner}
                        onChange={(e) => setNodeField(n.id, 'owner', e.target.value)}
                      />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <div className="field-label">Type</div>
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
              </div>
            ))}
          </div>
          <button className="add-row" onClick={addNode}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            添加归因节点
          </button>
        </div>
      </div>

      {/* Payload */}
      <div className="section-label" style={{ marginTop: 20 }}>
        Agent Payload
      </div>
      <PayloadPanel
        label="Storyline Config"
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
          提交故事线给 Agent
        </button>
        <div className="autosave">
          <div className="autosave-dot"></div>自动保存中
        </div>
      </div>
    </div>
  );
}
