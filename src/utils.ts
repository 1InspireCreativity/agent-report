import type {
  AttributionNode,
  ChartCapability,
  ChartGroup,
  ReportState,
  ReportTag,
  StorylineDataType,
  StorylineState,
  TagCategory,
  TemplateGroup,
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

export const STORYLINE_TYPE_OPTIONS: { value: StorylineDataType; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'personal', label: 'Personal' },
];

export const JOIN_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: 'quarter', label: 'Quarter' },
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'other', label: '其他' },
  { value: 'none', label: '无需拼数处理' },
];

export function joinMethodLabel(value: string): string {
  return JOIN_METHOD_OPTIONS.find((o) => o.value === value)?.label || value;
}

export const REGION_OPTIONS = ['CNOB', 'SEA', 'APAC', 'NAAP'];

export const TAG_CATEGORY_OPTIONS: { value: TagCategory; label: string }[] = [
  { value: 'lever', label: 'Lever' },
  { value: 'product', label: '产品' },
  { value: 'region', label: 'Region' },
];

export function tagCategoryLabel(value: TagCategory): string {
  return TAG_CATEGORY_OPTIONS.find((o) => o.value === value)?.label || value;
}

export const CAPABILITY_OPTIONS: { value: ChartCapability; label: string }[] = [
  { value: 'basic', label: '基础画图' },
  { value: 'attribution', label: '归因 / 下钻' },
  { value: 'threshold', label: '阈值状态' },
];

// 分类 taxonomy — placeholder options until the real business taxonomy is confirmed.
export const CATEGORY_L1_OPTIONS = ['闭环电商', '非闭环电商', '游戏', '其他'];
export const CATEGORY_L2_OPTIONS = ['直播', '短视频', '商城', '搜索', '其他'];

export const FOLDER_ICON_COLORS = ['#111827', '#059669', '#9CA3AF', '#D97706', '#2563EB', '#DC2626', '#7C3AED'];

export function folderIconColor(index: number): string {
  return FOLDER_ICON_COLORS[index % FOLDER_ICON_COLORS.length];
}

export function defaultStoryline(): StorylineState {
  return {
    topic: '',
    analyst: '',
    background: '',
    region: 'NAAP',
    nodes: [
      {
        id: 1,
        scenario: 'GBS-1Team revenue和yoy',
        categoryL1: '闭环电商',
        categoryL2: '',
        templateGroups: [
          {
            id: 1,
            templateId: 'motz7cum6ntsj6',
            tags: [
              { id: 1, category: 'lever', value: 'GBS' },
              { id: 2, category: 'region', value: 'NAAP' },
            ],
            chartGroups: [
              {
                id: 1,
                chartId: 'GBSrev',
                queryLinks: ['https://mmm.tiktok-row.net/apps/analytics/biportal/report/edit/1145582?dataset=1159057&queryId=64894787'],
                joinMethods: ['other'],
                drillDimension: 'NAAP Lever L1 Industry 4.0 Level 1',
                capabilities: ['basic', 'attribution'],
                threshold: '',
                type: 'public',
              },
              {
                id: 2,
                chartId: 'GBSYOY',
                queryLinks: [],
                joinMethods: [],
                drillDimension: '',
                capabilities: ['basic'],
                threshold: '',
                type: 'public',
              },
            ],
          },
        ],
      },
      {
        id: 2,
        scenario: 'NAAP-1Team revenue和yoy',
        categoryL1: '',
        categoryL2: '',
        templateGroups: [
          {
            id: 2,
            templateId: 'mp3ue3hglacfiq',
            tags: [],
            chartGroups: [
              {
                id: 3,
                chartId: '',
                queryLinks: ['https://mmm.tiktok-row.net/apps/analytics/biportal/report/edit/1147165?dataset=1159057&queryId=648951830'],
                joinMethods: [],
                drillDimension: 'NAAP Lever L1 Industry 4.0 Level 1',
                capabilities: ['basic'],
                threshold: '',
                type: 'personal',
              },
            ],
          },
        ],
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
    templateIds: [],
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
    region: sl.region || null,
    attribution_nodes: sl.nodes.map((n, i) => ({
      index: i + 1,
      scenario: n.scenario || `节点${i + 1}`,
      category_l1: n.categoryL1 || null,
      category_l2: n.categoryL2 || null,
      template_groups: n.templateGroups.map((tg) => ({
        template_id: tg.templateId || null,
        tags: tg.tags.map((t) => ({ category: t.category, value: t.value })),
        chart_groups: tg.chartGroups.map((g) => ({
          chart_id: g.chartId || null,
          query_links: g.queryLinks,
          join_methods: g.joinMethods,
          drill_dimension: g.drillDimension || null,
          capabilities: g.capabilities,
          threshold: g.capabilities.includes('threshold') ? g.threshold || null : null,
          type: g.type,
        })),
      })),
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
    template_ids: rpt.templateIds,
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

let templateGroupIdCounter = 100;
export function nextTemplateGroupId() {
  templateGroupIdCounter += 1;
  return templateGroupIdCounter;
}

let groupIdCounter = 100;
export function nextGroupId() {
  groupIdCounter += 1;
  return groupIdCounter;
}

export function emptyChartGroup(): ChartGroup {
  return {
    id: nextGroupId(),
    chartId: '',
    queryLinks: [],
    joinMethods: [],
    drillDimension: '',
    capabilities: ['basic'],
    threshold: '',
    type: 'public',
  };
}

let tagIdCounter = 100;
export function nextTagId() {
  tagIdCounter += 1;
  return tagIdCounter;
}

export function emptyTemplateGroup(): TemplateGroup {
  return { id: nextTemplateGroupId(), templateId: '', tags: [], chartGroups: [] };
}

export function emptyNode(): AttributionNode {
  return {
    id: nextNodeId(),
    scenario: '',
    categoryL1: '',
    categoryL2: '',
    templateGroups: [],
  };
}

interface LegacyChartDefaults {
  joinMethods: string[];
  drillDimension: string;
  type: StorylineDataType;
}

const VALID_CAPABILITIES: ChartCapability[] = ['basic', 'attribution', 'threshold'];

function normalizeChartGroup(raw: Record<string, unknown> | undefined, legacy: LegacyChartDefaults): ChartGroup {
  const r = raw || {};
  return {
    id: typeof r.id === 'number' ? r.id : nextGroupId(),
    chartId: typeof r.chartId === 'string' ? r.chartId : '',
    queryLinks: Array.isArray(r.queryLinks) ? (r.queryLinks as string[]) : [],
    joinMethods: Array.isArray(r.joinMethods) ? (r.joinMethods as string[]) : legacy.joinMethods,
    drillDimension: typeof r.drillDimension === 'string' ? r.drillDimension : legacy.drillDimension,
    capabilities: Array.isArray(r.capabilities)
      ? (r.capabilities as ChartCapability[]).filter((c) => VALID_CAPABILITIES.includes(c))
      : ['basic'],
    threshold: typeof r.threshold === 'string' ? r.threshold : '',
    type: r.type === 'personal' || r.type === 'public' ? r.type : legacy.type,
  };
}

function normalizeTag(raw: Partial<ReportTag> | undefined): ReportTag | null {
  if (!raw || typeof raw.value !== 'string' || !raw.value) return null;
  const category: TagCategory =
    raw.category === 'lever' || raw.category === 'product' || raw.category === 'region' ? raw.category : 'lever';
  return { id: typeof raw.id === 'number' ? raw.id : nextTagId(), category, value: raw.value };
}

function normalizeTags(raw: unknown): ReportTag[] {
  return Array.isArray(raw)
    ? (raw as Partial<ReportTag>[]).map(normalizeTag).filter((t): t is ReportTag => t !== null)
    : [];
}

function normalizeTemplateGroup(raw: Record<string, unknown> | undefined, legacy: LegacyChartDefaults): TemplateGroup {
  const r = raw || {};
  const chartGroupsRaw = Array.isArray(r.chartGroups) ? (r.chartGroups as Record<string, unknown>[]) : [];
  // drillDimension briefly lived at the template level; push it back down as the
  // per-chart default when reading data saved in that shape.
  const chartLegacy: LegacyChartDefaults =
    typeof r.drillDimension === 'string' && r.drillDimension ? { ...legacy, drillDimension: r.drillDimension } : legacy;
  return {
    id: typeof r.id === 'number' ? r.id : nextTemplateGroupId(),
    templateId: typeof r.templateId === 'string' ? r.templateId : '',
    tags: normalizeTags(r.tags),
    chartGroups: chartGroupsRaw.map((g) => normalizeChartGroup(g, chartLegacy)),
  };
}

// Migrates persisted nodes from earlier shapes (pre-redesign { name, desc, links },
// the flat { chartIds, queryLinks, joinMethod } shape, or the 2-level
// { templateId, chartGroups } shape) into the current 3-level
// { templateGroups: [{ templateId, chartGroups }] } shape. 拼数方式/下钻Dimension/Type
// used to live on the node or template - those become the per-chart-group default
// when migrating older data.
function normalizeNode(raw: Record<string, unknown> | undefined): AttributionNode {
  const r = raw || {};
  const legacyLinks = Array.isArray(r.links) ? (r.links as string[]) : undefined;
  const legacy: LegacyChartDefaults = {
    joinMethods: Array.isArray(r.joinMethods)
      ? (r.joinMethods as string[])
      : typeof r.joinMethod === 'string' && r.joinMethod
        ? [r.joinMethod]
        : [],
    drillDimension:
      typeof r.drillDimension === 'string' ? r.drillDimension : typeof r.desc === 'string' ? r.desc : '',
    type: r.type === 'personal' ? 'personal' : 'public',
  };

  let templateGroups: TemplateGroup[];
  if (Array.isArray(r.templateGroups)) {
    templateGroups = (r.templateGroups as Record<string, unknown>[]).map((tg) => normalizeTemplateGroup(tg, legacy));
  } else {
    let chartGroups: ChartGroup[];
    if (Array.isArray(r.chartGroups)) {
      chartGroups = (r.chartGroups as Record<string, unknown>[]).map((g) => normalizeChartGroup(g, legacy));
    } else {
      const legacyChartIds = Array.isArray(r.chartIds) ? (r.chartIds as string[]) : [];
      const legacyQueryLinks = Array.isArray(r.queryLinks) ? (r.queryLinks as string[]) : legacyLinks || [];
      if (legacyChartIds.length) {
        chartGroups = legacyChartIds.map((c, i) =>
          normalizeChartGroup({ chartId: c, queryLinks: i === 0 ? legacyQueryLinks : [] }, legacy)
        );
      } else if (legacyQueryLinks.length) {
        chartGroups = [normalizeChartGroup({ chartId: '', queryLinks: legacyQueryLinks }, legacy)];
      } else {
        chartGroups = [];
      }
    }
    templateGroups =
      typeof r.templateId === 'string' && (r.templateId || chartGroups.length)
        ? [{ id: nextTemplateGroupId(), templateId: r.templateId, tags: [], chartGroups }]
        : [];
  }

  return {
    id: typeof r.id === 'number' ? r.id : nextNodeId(),
    scenario: typeof r.scenario === 'string' ? r.scenario : typeof r.name === 'string' ? r.name : '',
    categoryL1: typeof r.categoryL1 === 'string' ? r.categoryL1 : '',
    categoryL2: typeof r.categoryL2 === 'string' ? r.categoryL2 : '',
    templateGroups,
  };
}

export function normalizeStoryline(
  raw: (Partial<StorylineState> & { tags?: unknown }) | null | undefined
): StorylineState {
  const base = defaultStoryline();
  if (!raw) return base;
  const nodes = Array.isArray(raw.nodes)
    ? raw.nodes.map((n) => normalizeNode(n as unknown as Record<string, unknown>))
    : base.nodes;
  // tags briefly lived at the report level; move any saved ones into the first template group.
  const legacyTags = normalizeTags(raw.tags);
  if (legacyTags.length && nodes[0]?.templateGroups[0]) {
    const tg = nodes[0].templateGroups[0];
    tg.tags = [...tg.tags, ...legacyTags.filter((t) => !tg.tags.some((e) => e.category === t.category && e.value === t.value))];
  }
  return {
    topic: typeof raw.topic === 'string' ? raw.topic : base.topic,
    analyst: typeof raw.analyst === 'string' ? raw.analyst : base.analyst,
    background: typeof raw.background === 'string' ? raw.background : base.background,
    region: typeof raw.region === 'string' && raw.region ? raw.region : 'NAAP',
    nodes,
  };
}

export function normalizeReport(
  raw: (Partial<ReportState> & { dataQueryId?: string; chartId?: string; chartIds?: string[] }) | null | undefined
): ReportState {
  const base = defaultReport();
  if (!raw) return base;
  const legacyChartId = typeof raw.chartId === 'string' ? raw.chartId : typeof raw.dataQueryId === 'string' ? raw.dataQueryId : '';
  const legacyChartIds = Array.isArray(raw.chartIds) ? raw.chartIds : legacyChartId ? [legacyChartId] : [];
  return {
    name: typeof raw.name === 'string' ? raw.name : base.name,
    cycle: raw.cycle === '2W' || raw.cycle === 'M' || raw.cycle === 'W' ? raw.cycle : base.cycle,
    chartType:
      raw.chartType === 'fensi' || raw.chartType === 'maomaochong' || raw.chartType === 'bar' || raw.chartType === 'wuhuaro'
        ? raw.chartType
        : base.chartType,
    description: typeof raw.description === 'string' ? raw.description : base.description,
    templateIds: Array.isArray(raw.templateIds) ? raw.templateIds : legacyChartIds.length ? legacyChartIds : base.templateIds,
    owner: typeof raw.owner === 'string' ? raw.owner : base.owner,
    ownerEmail: typeof raw.ownerEmail === 'string' ? raw.ownerEmail : base.ownerEmail,
    ownerDept: typeof raw.ownerDept === 'string' ? raw.ownerDept : base.ownerDept,
    templateName: typeof raw.templateName === 'string' ? raw.templateName : base.templateName,
  };
}
