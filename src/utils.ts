import type {
  AttributionNode,
  ChartCapability,
  ChartGroup,
  ReportState,
  ReportTag,
  SavedFolder,
  SavedTemplate,
  StorylineDataType,
  StorylineState,
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

export const REGION_OPTIONS = [
  'NAAP',
  'NA',
  'SMB',
  'Others',
  'CNOB',
  'SEA',
  'METAP & LATAM',
  'KR',
  'JP',
  'EUI',
  'AUNZ',
  'ENT',
];

export const CAPABILITY_OPTIONS: { value: ChartCapability; label: string }[] = [
  { value: 'basic', label: '基础画图' },
  { value: 'attribution', label: '归因 / 下钻' },
  { value: 'threshold', label: '阈值状态' },
];

// 分类 taxonomy — 一级分类 -> 二级分类 options.
export const CATEGORY_OPTIONS: Record<string, string[]> = {
  '闭环电商 / TTS': ['标签 / Label', '扩展属性 / Extended Attribute'],
  '程序软体 / Apps': ['标签 / Label', '扩展属性 / Extended Attribute'],
  '达人 / TTO': ['标签 / Label', '扩展属性 / Extended Attribute'],
  '短剧 / Mini Series': ['标签 / Label', '扩展属性 / Extended Attribute'],
  '广告对象与创意 / Ad Object & Creative': [
    '创意属性 / Creative Attribute',
    '广告对象属性 / Ad Object Attribute',
    '聚合指标 / Aggregated Measure',
  ],
  '行业 / Industry': ['行业4.0 / Industry 4.0', '其它行业 / Other Industry'],
  '经营结果与效果指标 / Business Outcome & Performance Metrics': [
    '成本与消耗 / Cost & Spend',
    '收入与交易结果 / Revenue & Transaction Outcome',
  ],
  '开环电商 / Open Loop C': ['标签 / Label', '扩展属性 / Extended Attribute'],
  '平台电商 / Marketplace': ['标签 / Label', '扩展属性 / Extended Attribute'],
  '品牌 / Branding': ['标签 / Label', '扩展属性 / Extended Attribute'],
  '审核 / Moderation': ['核查 / Audit'],
  '时间与周期 / Time & Calendar': ['时间 / Time', '业务事件时间 / Business Event Time'],
  '投放与产品 / Advertising & Product': ['产品 / Product', '投放 / Advertising'],
  '推广 / Promote': ['标签 / Label', '扩展属性 / Extended Attribute'],
  '线索 / Leads': ['标签 / Label', '扩展属性 / Extended Attribute'],
  '业务主体与组织 / Business Entity & Organization': ['标签 / Label', '客户信息 / Customer Info', '团队 / Team'],
  '游戏 / Gaming': ['标签 / Label', '扩展属性 / Extended Attribute'],
  '重要分析字段 / Important Analysis Fields': [
    '首销 / First Revenue',
    '新开 / New Existing',
    '战略杠杆 / Strategic Lever',
    '重要客户 / Important Customer',
  ],
};

export const CATEGORY_L1_OPTIONS = Object.keys(CATEGORY_OPTIONS);

export const FOLDER_ICON_COLORS = ['#111827', '#059669', '#9CA3AF', '#D97706', '#2563EB', '#DC2626', '#7C3AED'];

export function folderIconColor(index: number): string {
  return FOLDER_ICON_COLORS[index % FOLDER_ICON_COLORS.length];
}

export function loadFolders<T>(storageKey: string): SavedFolder<T>[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || '[]') as SavedFolder<T>[];
    // Back-compat: folders saved before nested folders existed have no parentId.
    return raw.map((f) => ({ ...f, parentId: f.parentId ?? null }));
  } catch {
    return [];
  }
}

export function saveFolders<T>(storageKey: string, arr: SavedFolder<T>[]) {
  localStorage.setItem(storageKey, JSON.stringify(arr));
}

/** Create-or-update a saved folder for the given state, matching by activeId first, else by name+parent. */
export function upsertFolder<T>(params: {
  storageKey: string;
  activeId: string;
  parentId: string | null;
  name: string;
  owner: string;
  visibility: StorylineDataType;
  state: T;
}): SavedFolder<T> {
  const arr = loadFolders<T>(params.storageKey);
  const existingIdx = params.activeId
    ? arr.findIndex((f) => f.id === params.activeId)
    : arr.findIndex((f) => f.name === params.name && f.parentId === params.parentId);
  const item: SavedFolder<T> = {
    id: existingIdx >= 0 ? arr[existingIdx].id : String(Date.now()),
    parentId: existingIdx >= 0 ? arr[existingIdx].parentId : params.parentId,
    name: params.name,
    owner: params.owner,
    visibility: params.visibility,
    color: existingIdx >= 0 ? arr[existingIdx].color : folderIconColor(arr.length),
    updated_at: new Date().toLocaleString(),
    state: params.state,
  };
  if (existingIdx >= 0) arr[existingIdx] = item;
  else arr.unshift(item);
  saveFolders(params.storageKey, arr);
  return item;
}

/** All descendant ids of a folder (children, grandchildren, ...), for cascade delete. */
export function descendantIds<T>(arr: SavedFolder<T>[], rootId: string): string[] {
  const out: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const f of arr) {
      if (f.parentId === id) {
        out.push(f.id);
        stack.push(f.id);
      }
    }
  }
  return out;
}

/** Build a readable "A / B / C" path label for a folder, walking up its parent chain. */
export function folderPath<T>(arr: SavedFolder<T>[], folderId: string | null): string {
  const parts: string[] = [];
  let cur = folderId;
  while (cur) {
    const f = arr.find((x) => x.id === cur);
    if (!f) break;
    parts.unshift(f.name);
    cur = f.parentId;
  }
  return parts.join(' / ');
}

const TEMPLATE_CATALOG_KEY = 'templateCatalog';

/** Global, cross-tab catalog of reusable Template IDs — shared by 图表配置 and 报告取数配置. */
export function loadTemplateCatalog(): SavedTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATE_CATALOG_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveTemplateCatalog(arr: SavedTemplate[]) {
  localStorage.setItem(TEMPLATE_CATALOG_KEY, JSON.stringify(arr));
}

export function upsertTemplate(params: {
  id?: string;
  name: string;
  templateId: string;
  folderId: string | null;
}): SavedTemplate {
  const arr = loadTemplateCatalog();
  const idx = params.id ? arr.findIndex((t) => t.id === params.id) : -1;
  const item: SavedTemplate = {
    id: idx >= 0 ? arr[idx].id : String(Date.now()),
    name: params.name,
    templateId: params.templateId,
    folderId: params.folderId,
    updated_at: new Date().toLocaleString(),
  };
  if (idx >= 0) arr[idx] = item;
  else arr.unshift(item);
  saveTemplateCatalog(arr);
  return item;
}

export function deleteTemplate(id: string): SavedTemplate[] {
  const arr = loadTemplateCatalog().filter((t) => t.id !== id);
  saveTemplateCatalog(arr);
  return arr;
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
        templateGroups: [
          {
            id: 1,
            templateId: 'motz7cum6ntsj6',
            tags: [
              { id: 1, category: '重要分析字段 / Important Analysis Fields', value: '战略杠杆 / Strategic Lever' },
              { id: 2, category: '行业 / Industry', value: '行业4.0 / Industry 4.0' },
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

export function blankStoryline(): StorylineState {
  return {
    topic: '',
    analyst: '',
    background: '',
    region: 'NAAP',
    nodes: [],
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
  return {
    id: typeof raw.id === 'number' ? raw.id : nextTagId(),
    category: typeof raw.category === 'string' ? raw.category : '',
    value: raw.value,
  };
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
  };
}
