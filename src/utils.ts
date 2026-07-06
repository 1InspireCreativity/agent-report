import type {
  AttributionNode,
  ExecutionConfig,
  MetricMapping,
  ReportChartItem,
  ReportState,
  StorylineDataType,
  StorylineState,
} from './types';

export const CYCLE_OPTIONS: { value: ReportState['cycle']; label: string }[] = [
  { value: 'W', label: '每周（W）' },
  { value: '2W', label: '双周（2W）' },
  { value: 'M', label: '每月（M）' },
];

export const CHART_TYPE_OPTIONS: { value: ReportState['chartType']; label: string }[] = [
  { value: 'wuhuaro', label: '五花肉图' },
  { value: 'fensi', label: '粉丝图' },
  { value: 'maomaochong', label: '毛毛虫图' },
  { value: 'bar', label: '柱状图' },
];

export const OWNER_DEPT_OPTIONS: { value: string; label: string }[] = [
  { value: 'growth_analytics', label: '商业规划组' },
  { value: 'data_intelligence', label: '数据智能组' },
  { value: 'product_ops', label: '产品运营组' },
  { value: 'market_growth', label: '市场增长组' },
  { value: 'other', label: '其他' },
];

export const STORYLINE_TYPE_OPTIONS: { value: StorylineDataType; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'personal', label: 'Personal' },
];

export function defaultExecutionConfig(): ExecutionConfig {
  return {
    tblDate: 'YYYY-MM-DD',
    tblRange: 'current_year',
    tblSort: 'Date',
    sortDir: 'DESC',
    cols: ['', '', '', ''],
    joinCross: false,
    joinNull: 'fill_zero',
    joinShare: 'Value / Total * 100',
    yoyOn: true,
    yoyFormula: '(Current - Previous) / Previous * 100',
    yoySort: 'abs_desc',
    wbName: '飞书表格 Sheet',
    wbTab: 'Sheet1',
    wbMode: 'overwrite',
  };
}

export function defaultStoryline(): StorylineState {
  return {
    topic: '',
    period: '',
    analyst: '',
    background: '',
    framework: '',
    fieldId: '',
    chartId: '',
    nodes: [
      {
        id: 1,
        scenario: 'GBS-1 Team revenue 和 YoY',
        queryLinks: ['https://mmm.tiktok-row.net/apps/analytics/biportal/report/edit/1145582?dataset=1159057&queryId=64894787'],
        joinMethod: 'QMW/other type',
        metrics: [
          {
            id: 1,
            metric: '["Stat Date", "Dollar Revenue Real - Rev Attain (HQ)", "Daily Latest DC GBS - 1(合并)"]',
            chartId: 'GBSrev',
          },
          {
            id: 2,
            metric: '["Stat Date", "YoY", "Daily Latest DC GBS - 1(合并)"]',
            chartId: 'GBSYOY',
          },
        ],
        drillDimension: '按 NAAP Lever L1、Industry 4.0 Level 1 两个维度下钻',
        dataSets: ['[Restricted Access] NAAP_Performance_with_GBS_FullSnapshot_Dataset'],
        owner: '',
        type: 'public',
      },
      {
        id: 2,
        scenario: 'NAAP-1 Team revenue 和 YoY',
        queryLinks: ['https://mmm.tiktok-row.net/apps/analytics/biportal/report/edit/1147165?dataset=1159057&queryId=648951830'],
        joinMethod: '',
        metrics: [
          {
            id: 1,
            metric: 'Daily average of Dollar Revenue Real - Rev A YoY(Daily average of Latest Fx - Dollar Rever',
            chartId: 'mp3ue3hglacfiq',
          },
        ],
        drillDimension: '按 NAAP Lever L1、Industry 4.0 Level 1 两个维度下钻',
        dataSets: ['[Restricted Access] NAAP_Performance_with_GBS_FullSnapshot_Dataset'],
        owner: '',
        type: 'personal',
      },
    ],
  };
}

export function defaultReport(): ReportState {
  return {
    name: '',
    cycle: 'W',
    chartType: 'wuhuaro',
    description: '',
    chartId: '',
    owner: '',
    ownerEmail: '',
    ownerDept: '',
    templateName: '',
    items: [
      {
        id: 1,
        title: 'DAU 周趋势',
        link: 'https://data.example.com/dau/weekly',
        tpl: 'tpl_001',
        chart: 'cht_dau_trend',
        note: '7 日 DAU 折线图',
        collapsed: false,
      },
      {
        id: 2,
        title: 'GMV 分渠道',
        link: 'https://data.example.com/gmv/channel',
        tpl: 'tpl_001',
        chart: 'cht_gmv_channel',
        note: '按直播/搜索/推荐拆分',
        collapsed: false,
      },
    ],
    exec: defaultExecutionConfig(),
  };
}

export function buildStorylinePayload(sl: StorylineState) {
  return {
    type: 'storyline_config',
    topic: sl.topic || '（未填写）',
    period: sl.period || null,
    analyst: sl.analyst || null,
    background: sl.background || '（未填写）',
    drill_down_framework: sl.framework || null,
    field_id: sl.fieldId || null,
    chart_id: sl.chartId || null,
    attribution_nodes: sl.nodes.map((n, i) => ({
      index: i + 1,
      scenario: n.scenario || `节点${i + 1}`,
      query_links: n.queryLinks,
      join_method: n.joinMethod || null,
      metric_chart_mappings: n.metrics.map((m) => ({ metric: m.metric || null, chart_id: m.chartId || null })),
      drill_dimension: n.drillDimension || null,
      data_sets: n.dataSets,
      owner: n.owner || null,
      type: n.type,
    })),
  };
}

export function buildReportPayload(rpt: ReportState) {
  const e = rpt.exec;
  return {
    type: 'weekly_report_config',
    report_name: rpt.name || '（未填写）',
    cycle: rpt.cycle,
    chart_type: rpt.chartType,
    description: rpt.description || null,
    chart_id: rpt.chartId || null,
    owner: rpt.owner || null,
    owner_email: rpt.ownerEmail || null,
    owner_dept: rpt.ownerDept || null,
    charts: rpt.items.map((it, i) => ({
      index: i + 1,
      title: it.title || `图表${i + 1}`,
      data_link: it.link || null,
      template_id: it.tpl || null,
      chart_id: it.chart || null,
      note: it.note || null,
    })),
    execution: {
      table_rules: {
        core_fields: e.cols.filter(Boolean),
        date_format: e.tblDate,
        data_range: e.tblRange,
        sort: { field: e.tblSort || 'Date', direction: e.sortDir },
      },
      join_rules: {
        cross_section_merge: e.joinCross,
        null_handling: e.joinNull,
        share_formula: e.joinShare,
      },
      yoy_attribution: {
        enabled: e.yoyOn,
        formula: e.yoyFormula,
        sort_rule: e.yoySort,
      },
      writeback: {
        target_sheet: e.wbName,
        tab: e.wbTab,
        mode: e.wbMode,
      },
    },
  };
}

// Simple JSON syntax highlighter -> returns array of {text, cls}
export function highlightJson(json: string): { text: string; cls: string }[] {
  const regex =
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
  const parts: { text: string; cls: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(json)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: json.slice(lastIndex, match.index), cls: '' });
    }
    const m = match[0];
    let cls = 'n';
    if (/^"/.test(m)) cls = /:$/.test(m) ? 'k' : 's';
    else if (/true|false|null/.test(m)) cls = 'b';
    else cls = 'v';
    parts.push({ text: m, cls });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < json.length) parts.push({ text: json.slice(lastIndex), cls: '' });
  return parts;
}

let nodeIdCounter = 100;
export function nextNodeId() {
  nodeIdCounter += 1;
  return nodeIdCounter;
}

let rptIdCounter = 100;
export function nextRptId() {
  rptIdCounter += 1;
  return rptIdCounter;
}

let metricIdCounter = 100;
export function nextMetricId() {
  metricIdCounter += 1;
  return metricIdCounter;
}

export function emptyNode(): AttributionNode {
  return {
    id: nextNodeId(),
    scenario: '',
    queryLinks: [],
    joinMethod: '',
    metrics: [],
    drillDimension: '',
    dataSets: [],
    owner: '',
    type: 'public',
  };
}

export function emptyMetricMapping(): MetricMapping {
  return { id: nextMetricId(), metric: '', chartId: '' };
}

export function emptyRptItem(): ReportChartItem {
  return { id: nextRptId(), title: '', link: '', tpl: '', chart: '', note: '', collapsed: false };
}

function normalizeMetric(raw: Partial<MetricMapping> | undefined): MetricMapping {
  return {
    id: typeof raw?.id === 'number' ? raw.id : nextMetricId(),
    metric: typeof raw?.metric === 'string' ? raw.metric : '',
    chartId: typeof raw?.chartId === 'string' ? raw.chartId : '',
  };
}

// Migrates persisted nodes from the pre-redesign shape ({ name, desc, links })
// or any partially-shaped draft into the current AttributionNode shape.
function normalizeNode(raw: Record<string, unknown> | undefined): AttributionNode {
  const r = raw || {};
  const legacyLinks = Array.isArray(r.links) ? (r.links as string[]) : undefined;
  return {
    id: typeof r.id === 'number' ? r.id : nextNodeId(),
    scenario: typeof r.scenario === 'string' ? r.scenario : typeof r.name === 'string' ? r.name : '',
    queryLinks: Array.isArray(r.queryLinks) ? (r.queryLinks as string[]) : legacyLinks || [],
    joinMethod: typeof r.joinMethod === 'string' ? r.joinMethod : '',
    metrics: Array.isArray(r.metrics) ? (r.metrics as MetricMapping[]).map(normalizeMetric) : [],
    drillDimension:
      typeof r.drillDimension === 'string' ? r.drillDimension : typeof r.desc === 'string' ? r.desc : '',
    dataSets: Array.isArray(r.dataSets) ? (r.dataSets as string[]) : [],
    owner: typeof r.owner === 'string' ? r.owner : '',
    type: r.type === 'personal' ? 'personal' : 'public',
  };
}

export function normalizeStoryline(raw: Partial<StorylineState> | null | undefined): StorylineState {
  const base = defaultStoryline();
  if (!raw) return base;
  return {
    topic: typeof raw.topic === 'string' ? raw.topic : base.topic,
    period: typeof raw.period === 'string' ? raw.period : base.period,
    analyst: typeof raw.analyst === 'string' ? raw.analyst : base.analyst,
    background: typeof raw.background === 'string' ? raw.background : base.background,
    framework: typeof raw.framework === 'string' ? raw.framework : base.framework,
    fieldId: typeof raw.fieldId === 'string' ? raw.fieldId : base.fieldId,
    chartId: typeof raw.chartId === 'string' ? raw.chartId : base.chartId,
    nodes: Array.isArray(raw.nodes)
      ? raw.nodes.map((n) => normalizeNode(n as unknown as Record<string, unknown>))
      : base.nodes,
  };
}

export function normalizeReport(raw: (Partial<ReportState> & { dataQueryId?: string }) | null | undefined): ReportState {
  const base = defaultReport();
  if (!raw) return base;
  return {
    name: typeof raw.name === 'string' ? raw.name : base.name,
    cycle: raw.cycle === '2W' || raw.cycle === 'M' || raw.cycle === 'W' ? raw.cycle : base.cycle,
    chartType:
      raw.chartType === 'fensi' || raw.chartType === 'maomaochong' || raw.chartType === 'bar' || raw.chartType === 'wuhuaro'
        ? raw.chartType
        : base.chartType,
    description: typeof raw.description === 'string' ? raw.description : base.description,
    chartId: typeof raw.chartId === 'string' ? raw.chartId : typeof raw.dataQueryId === 'string' ? raw.dataQueryId : base.chartId,
    owner: typeof raw.owner === 'string' ? raw.owner : base.owner,
    ownerEmail: typeof raw.ownerEmail === 'string' ? raw.ownerEmail : base.ownerEmail,
    ownerDept: typeof raw.ownerDept === 'string' ? raw.ownerDept : base.ownerDept,
    templateName: typeof raw.templateName === 'string' ? raw.templateName : base.templateName,
    items: Array.isArray(raw.items) && raw.items.length ? (raw.items as ReportState['items']) : base.items,
    exec: raw.exec ? { ...base.exec, ...raw.exec } : base.exec,
  };
}
