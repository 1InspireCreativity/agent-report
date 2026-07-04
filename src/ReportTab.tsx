import { useEffect, useState } from 'react';
import type { ReportState, ReportTemplate } from './types';
import { buildReportPayload, emptyRptItem, CYCLE_OPTIONS, CHART_TYPE_OPTIONS, OWNER_DEPT_OPTIONS } from './utils';
import PayloadPanel from './PayloadPanel';
import LinkDrawer from './LinkDrawer';
import Sg from './Sg';

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const update = <K extends keyof ReportState>(key: K, value: ReportState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const updateExec = <K extends keyof ReportState['exec']>(key: K, value: ReportState['exec'][K]) => {
    setState((prev) => ({ ...prev, exec: { ...prev.exec, [key]: value } }));
  };

  const setItemField = (
    id: number,
    field: 'title' | 'link' | 'tpl' | 'chart' | 'note',
    value: string
  ) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    }));
  };

  const addItem = () => {
    setState((prev) => ({ ...prev, items: [...prev.items, emptyRptItem()] }));
  };

  const delItem = (id: number) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
  };

  const toggleCollapse = (id: number) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, collapsed: !it.collapsed } : it)),
    }));
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
      dept: '',
      cycle: 'W',
      chartType: 'wuhuaro',
      description: '',
      dataQueryId: '',
      owner: '',
      ownerEmail: '',
      ownerDept: '',
      items: [],
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
    const ok = (!state.name && !state.items.length) || confirm('新增配置会清空当前页面，确认继续？');
    if (!ok) return;
    setState((prev) => ({
      ...prev,
      templateName: '',
      name: '',
      dept: '',
      cycle: 'W',
      description: '',
      dataQueryId: '',
      owner: '',
      ownerEmail: '',
      ownerDept: '',
      items: [emptyRptItem()],
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
    setState(item.state);
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

  const applyDrawerChanges = (changes: Record<number, string>) => {
    const count = Object.keys(changes).length;
    setState((prev) => ({
      ...prev,
      items: prev.items.map((it) => (changes[it.id] !== undefined ? { ...it, link: changes[it.id] } : it)),
    }));
    toast(count ? `✅ 已更新 ${count} 条取数链接` : '链接未作修改');
  };

  const payload = buildReportPayload(state);

  return (
    <div className="tab-panel active">
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <div className="page-head-title">周报取数配置</div>
            <div className="page-head-desc">
              配置图表取数链接与图表 ID 映射，以及数据清洗、YOY 归因、图表渲染、回写等执行参数。
            </div>
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
          <div className="meta-chip">
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <path d="M3 9h18M9 21V9"></path>
            </svg>
            {state.items.length} 张图
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
            <div className="card-head-desc">周报名称、部门与汇报周期</div>
          </div>
        </div>
        <div className="card-body">
          <div className="grid-2" style={{ margin: 0, marginBottom: 16 }}>
            <div className="field" style={{ margin: 0 }}>
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
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">所属部门</div>
              <input
                type="text"
                placeholder="例：商业规划组"
                value={state.dept}
                onChange={(e) => update('dept', e.target.value)}
              />
            </div>
          </div>
          {/* 修复点：汇报周期 与 图表类型 拆分为两个独立的单选下拉框 */}
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
          <div className="field" style={{ margin: '16px 0 0' }}>
            <div className="field-label">
              周报描述 <span className="opt">可选</span>
            </div>
            <textarea
              placeholder="简要描述该周报的分析目标与覆盖范围…"
              value={state.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>
          <div className="grid-2" style={{ margin: '16px 0 0' }}>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">
                Data Query ID <span className="hint">对应自动化周报 chart id</span>
              </div>
              <input
                type="text"
                placeholder="cht_auto_weekly_001"
                value={state.dataQueryId}
                onChange={(e) => update('dataQueryId', e.target.value)}
              />
            </div>
          </div>
          <div className="grid-2" style={{ margin: '16px 0 0' }}>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">Owner</div>
              <input
                type="text"
                placeholder="负责人姓名"
                value={state.owner}
                onChange={(e) => update('owner', e.target.value)}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">Owner Email</div>
              <input
                type="text"
                placeholder="owner@example.com"
                value={state.ownerEmail}
                onChange={(e) => update('ownerEmail', e.target.value)}
              />
            </div>
          </div>
          <div className="grid-2" style={{ margin: '16px 0 0' }}>
            <div className="field" style={{ margin: 0 }}>
              <div className="field-label">Owner Department</div>
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
            🧾
          </div>
          <div className="card-head-text">
            <div className="card-head-title">报表模版配置管理</div>
            <div className="card-head-desc">选择 xx 周报模版，保存当前配置，新增其他报表配置，或更改历史配置</div>
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

      {/* 图表取数 */}
      <div className="section-label" style={{ marginTop: 20 }}>
        图表取数
      </div>
      <div className="card">
        <div className="card-head">
          <div className="card-icon-wrap" style={{ background: '#F0FDF4' }}>
            🗂️
          </div>
          <div className="card-head-text">
            <div className="card-head-title">图表配置列表</div>
            <div className="card-head-desc">取数链接 + Template ID + Chart ID 三元组</div>
          </div>
          <div className="card-head-actions">
            <span style={{ fontSize: 12, color: 'var(--c-text-4)' }}>共 {state.items.length} 张图</span>
            <button className="btn btn-warning btn-sm" onClick={() => setDrawerOpen(true)}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              快速修改链接
            </button>
          </div>
        </div>
        <div className="card-body tight">
          <div className="rpt-list">
            {state.items.map((it, i) => (
              <div className="rpt-item" key={it.id}>
                <div className="rpt-head">
                  <div className="rpt-num">{i + 1}</div>
                  <input
                    className="rpt-title"
                    type="text"
                    placeholder="图表名称（如：DAU 趋势图）"
                    value={it.title}
                    onChange={(e) => setItemField(it.id, 'title', e.target.value)}
                  />
                  <div className="rpt-actions">
                    <button className="icon-btn" onClick={() => toggleCollapse(it.id)} title={it.collapsed ? '展开' : '收起'}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d={it.collapsed ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'}></path>
                      </svg>
                    </button>
                    <button className="icon-btn danger" onClick={() => delItem(it.id)} title="删除">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                {!it.collapsed && (
                  <div className="rpt-body">
                    <div className="field">
                      <div className="field-label">
                        取数链接 <span className="req">*</span>
                      </div>
                      <input
                        type="url"
                        placeholder="https://…"
                        value={it.link}
                        onChange={(e) => setItemField(it.id, 'link', e.target.value)}
                      />
                      {it.link && (
                        <a className="link-chip" href={it.link} target="_blank" rel="noopener noreferrer">
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                          </svg>
                          打开链接
                        </a>
                      )}
                    </div>
                    <div className="id-bar">
                      <span className="id-bar-label">Template ID</span>
                      <input
                        type="text"
                        placeholder="tpl_12345"
                        value={it.tpl}
                        onChange={(e) => setItemField(it.id, 'tpl', e.target.value)}
                      />
                      <span className="div">·</span>
                      <span className="id-bar-label">Chart ID</span>
                      <input
                        type="text"
                        placeholder="cht_67890"
                        value={it.chart}
                        onChange={(e) => setItemField(it.id, 'chart', e.target.value)}
                      />
                    </div>
                    <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
                      <div className="field-label">
                        备注 <span className="opt">可选</span>
                      </div>
                      <input
                        type="text"
                        placeholder="该图用途说明…"
                        value={it.note}
                        onChange={(e) => setItemField(it.id, 'note', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button className="add-row" onClick={addItem} style={{ marginTop: 10 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            添加图表配置
          </button>
        </div>
      </div>

      {/* 执行参数 */}
      <div className="section-label" style={{ marginTop: 20 }}>
        执行参数
      </div>

      <Sg icon="🧹" iconBg="#F0FDF4" title="表格清洗规则" status="已配置">
        <div className="grid-2">
          <div className="field">
            <div className="field-label">时间字段格式</div>
            <select value={state.exec.tblDate} onChange={(e) => updateExec('tblDate', e.target.value)}>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="YYYYMMDD">YYYYMMDD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
          </div>
          <div className="field">
            <div className="field-label">数据选取范围</div>
            <select value={state.exec.tblRange} onChange={(e) => updateExec('tblRange', e.target.value)}>
              <option value="current_year">Current Year</option>
              <option value="last_30d">近 30 天</option>
              <option value="last_90d">近 90 天</option>
              <option value="ytd">YTD</option>
            </select>
          </div>
          <div className="field">
            <div className="field-label">排序字段</div>
            <input type="text" value={state.exec.tblSort} onChange={(e) => updateExec('tblSort', e.target.value)} />
          </div>
          <div className="field">
            <div className="field-label">排序方向</div>
            <div className="radio-pills">
              <div className="radio-pill">
                <input
                  type="radio"
                  name="sort-dir"
                  id="sd-desc"
                  checked={state.exec.sortDir === 'DESC'}
                  onChange={() => updateExec('sortDir', 'DESC')}
                />
                <label htmlFor="sd-desc">↓ DESC</label>
              </div>
              <div className="radio-pill">
                <input
                  type="radio"
                  name="sort-dir"
                  id="sd-asc"
                  checked={state.exec.sortDir === 'ASC'}
                  onChange={() => updateExec('sortDir', 'ASC')}
                />
                <label htmlFor="sd-asc">↑ ASC</label>
              </div>
            </div>
          </div>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <div className="field-label">
            核心字段定义 <span className="hint">4 列，按顺序填写</span>
          </div>
          <div className="grid-4" style={{ marginTop: 6 }}>
            {state.exec.cols.map((c, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={`字段 ${idx + 1}（${['Date', 'Metric', 'Value', 'Dim'][idx]}）`}
                value={c}
                onChange={(e) => {
                  const cols = [...state.exec.cols] as [string, string, string, string];
                  cols[idx] = e.target.value;
                  updateExec('cols', cols);
                }}
              />
            ))}
          </div>
        </div>
      </Sg>

      <Sg icon="🔗" iconBg="#EFF6FF" title="多表拼接规则" status="已配置">
        <div className="toggle-field" style={{ marginBottom: 14 }}>
          <div className="toggle-field-text">
            <div className="toggle-field-title">跨部分数据合并</div>
            <div className="toggle-field-sub">启用后允许跨不同数据源合并同一维度数据</div>
          </div>
          <label className="sw">
            <input
              type="checkbox"
              checked={state.exec.joinCross}
              onChange={(e) => updateExec('joinCross', e.target.checked)}
            />
            <span className="sw-track"></span>
          </label>
        </div>
        <div className="grid-2" style={{ margin: 0 }}>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">缺失值处理</div>
            <select value={state.exec.joinNull} onChange={(e) => updateExec('joinNull', e.target.value)}>
              <option value="fill_zero">补充为 0</option>
              <option value="fill_null">保留 NULL</option>
              <option value="drop_row">删除该行</option>
              <option value="fill_prev">前值填充</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">份额公式</div>
            <input type="text" value={state.exec.joinShare} onChange={(e) => updateExec('joinShare', e.target.value)} />
          </div>
        </div>
      </Sg>

      <Sg icon="📈" iconBg="#ECFDF5" title="YOY 归因计算" status="已启用">
        <div className="toggle-field" style={{ marginBottom: 14 }}>
          <div className="toggle-field-text">
            <div className="toggle-field-title">开启 YOY 归因</div>
            <div className="toggle-field-sub">自动计算各维度贡献量与贡献度，并按正负影响排序输出</div>
          </div>
          <label className="sw">
            <input type="checkbox" checked={state.exec.yoyOn} onChange={(e) => updateExec('yoyOn', e.target.checked)} />
            <span className="sw-track"></span>
          </label>
        </div>
        <div className="grid-2" style={{ margin: 0 }}>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">计算公式</div>
            <input type="text" value={state.exec.yoyFormula} onChange={(e) => updateExec('yoyFormula', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">归因排序规则</div>
            <select value={state.exec.yoySort} onChange={(e) => updateExec('yoySort', e.target.value)}>
              <option value="abs_desc">绝对值降序（主因优先）</option>
              <option value="pos_first">正影响优先</option>
              <option value="neg_first">负影响优先</option>
            </select>
          </div>
        </div>
      </Sg>

      <Sg icon="💾" iconBg="#FFFBEB" title="数据回写配置" status="已配置">
        <div className="grid-3" style={{ margin: 0 }}>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">目标表单</div>
            <input type="text" value={state.exec.wbName} onChange={(e) => updateExec('wbName', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">Sheet 标签</div>
            <input type="text" value={state.exec.wbTab} onChange={(e) => updateExec('wbTab', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">写入模式</div>
            <select value={state.exec.wbMode} onChange={(e) => updateExec('wbMode', e.target.value)}>
              <option value="overwrite">完全覆盖（Overwrite）</option>
              <option value="append">追加（Append）</option>
              <option value="upsert">更新插入（Upsert）</option>
            </select>
          </div>
        </div>
      </Sg>

      {/* Payload */}
      <div className="section-label" style={{ marginTop: 20 }}>
        Agent Payload
      </div>
      <PayloadPanel
        label="Weekly Report Config"
        meta={`${state.items.length} 张图`}
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

      <LinkDrawer
        open={drawerOpen}
        items={state.items}
        onClose={() => setDrawerOpen(false)}
        onSave={applyDrawerChanges}
      />
    </div>
  );
}
