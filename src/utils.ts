import type { AttributionNode, MetricMapping, ReportState, StorylineDataType, StorylineState } from './types';

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

export function defaultStoryline(): StorylineState {
  return {
    topic: '',
    analyst: '',
    background: '',
    framework: '',
    nodes: [
      {
        id: 1,
        scenario: 'GBS-1Team revenue和yoy',
        queryLinks: ['https://mmm.tiktok-row.net/apps/analytics/biportal/report/edit/1145582?dataset=1159057&queryId=64894787'],
        joinMethod: 'QMW/other type',
        templateId: 'motz7cum6ntsj6',
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
        drillDimension: 'NAAP Lever L1 Industry 4.0 Level 1',
        dataSets: ['[Restricted Access] NAAP_Performance_with_GBS_FullSnapshot_Dataset'],
        owner: '',
        type: 'public',
      },
      {
        id: 2,
        scenario: 'NAAP-1Team revenue和yoy',
        queryLinks: ['https://mmm.tiktok-row.net/apps/analytics/biportal/report/edit/1147165?dataset=1159057&queryId=648951830'],
        joinMethod: '',
        templateId: 'mp3ue3hglacfiq',
        metrics: [
          {
            id: 1,
            metric: 'Daily average of Dollar Revenue Real - Rev A YoY(Daily average of Latest Fx - Dollar Rever',
            chartId: '',
          },
        ],
        drillDimension: 'NAAP Lever L1 Industry 4.0 Level 1',
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
  };
}

export function buildStorylinePayload(sl: StorylineState) {
  return {
    type: 'storyline_config',
    topic: sl.topic || '（未填写）',
    analyst: sl.analyst || null,
    background: sl.background || '（未填写）',
    drill_down_framework: sl.framework || null,
    attribution_nodes: sl.nodes.map((n, i) => ({
      index: i + 1,
      scenario: n.scenario || `节点${i + 1}`,
      query_links: n.queryLinks,
      join_method: n.joinMethod || null,
      template_id: n.templateId || null,
      metric_chart_mappings: n.metrics.map((m) => ({ metric: m.metric || null, chart_id: m.chartId || null })),
      drill_dimension: n.drillDimension || null,
      data_sets: n.dataSets,
      owner: n.owner || null,
      type: n.type,
    })),
  };
}

export function buildReportPayload(rpt: ReportState) {
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
    templateId: '',
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
    templateId: typeof r.templateId === 'string' ? r.templateId : '',
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
    analyst: typeof raw.analyst === 'string' ? raw.analyst : base.analyst,
    background: typeof raw.background === 'string' ? raw.background : base.background,
    framework: typeof raw.framework === 'string' ? raw.framework : base.framework,
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
  };
}
