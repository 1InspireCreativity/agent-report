import type {
  ChartCapability,
  ChartGroup,
  DataReportLink,
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

// Matches backend "group" values on data_reports entries (Q/M/W are the recognized
// composable groups; 其他 marks a link that stands alone / needs no composing).
export const GROUP_OPTIONS: { value: string; label: string }[] = [
  { value: 'Q', label: 'Quarter (Q)' },
  { value: 'M', label: 'Month (M)' },
  { value: 'W', label: 'Week (W)' },
  { value: '其他', label: '其他' },
  { value: '无需拼数处理', label: '无需拼数处理' },
];

/** Parses report_id / dataset_id / query_id out of a pasted BI Portal report link. */
export function parseQueryLink(link: string): { reportId: string; datasetId: string; queryId: string } {
  const reportId = /\/report\/edit\/(\d+)/.exec(link)?.[1] || '';
  const datasetId = /[?&]dataset=(\d+)/.exec(link)?.[1] || '';
  const queryId = /[?&]queryId=(\d+)/.exec(link)?.[1] || '';
  return { reportId, datasetId, queryId };
}

/** compose_type = concatenation of distinct Q/M/W groups present, in that order, followed by any custom groups. */
export function deriveComposeType(dataReports: DataReportLink[]): string {
  const present = new Set(dataReports.map((d) => d.group).filter(Boolean));
  const ordered = ['Q', 'M', 'W'].filter((g) => present.has(g));
  const rest = [...present].filter((g) => !['Q', 'M', 'W'].includes(g));
  return [...ordered, ...rest].join('');
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
    topic: 'GBS-1Team revenue和yoy',
    background: '',
    region: 'NAAP',
    templateGroups: [
      {
        id: 1,
        templateId: 'motz7cum6ntsj6',
        businessScene: 'GBS-1Team revenue和yoy',
        drillDimensions: ['NAAP Lever L1', 'Industry 4.0 Level 1'],
        type: 'public',
        tags: [
          { id: 1, category: '重要分析字段 / Important Analysis Fields', value: '战略杠杆 / Strategic Lever' },
          { id: 2, category: '行业 / Industry', value: '行业4.0 / Industry 4.0' },
        ],
        chartGroups: [
          {
            id: 1,
            chartId: 'GBSrev',
            fieldList: ['Stat Date', 'Dollar Revenue Real - Rev Attain (HQ)'],
            dataReports: [
              {
                id: 1,
                group: 'Q',
                link: 'https://mmm.tiktok-row.net/apps/analytics/biportal/report/edit/1145582?dataset=1159057&queryId=648947878',
                reportId: '1145582',
                datasetId: '1159057',
                queryId: '648947878',
              },
            ],
            capabilities: ['basic', 'attribution'],
            threshold: '',
          },
          {
            id: 2,
            chartId: 'GBSYOY',
            fieldList: [],
            dataReports: [],
            capabilities: ['basic'],
            threshold: '',
          },
        ],
      },
      {
        id: 2,
        templateId: 'mp3ue3hglacfiq',
        businessScene: 'NAAP-1Team revenue和yoy',
        drillDimensions: ['NAAP Lever L1', 'Industry 4.0 Level 1'],
        type: 'personal',
        tags: [],
        chartGroups: [
          {
            id: 3,
            chartId: '',
            fieldList: [],
            dataReports: [
              {
                id: 2,
                group: 'Q',
                link: 'https://mmm.tiktok-row.net/apps/analytics/biportal/report/edit/1147165?dataset=1159057&queryId=648951830',
                reportId: '1147165',
                datasetId: '1159057',
                queryId: '648951830',
              },
            ],
            capabilities: ['basic'],
            threshold: '',
          },
        ],
      },
    ],
  };
}

export function blankStoryline(): StorylineState {
  return {
    topic: '',
    background: '',
    region: 'NAAP',
    templateGroups: [],
  };
}

export function defaultReport(): ReportState {
  return {
    name: '',
    cycle: 'W',
    chartType: 'wuhuaro',
    description: '',
    templateIds: [],
  };
}

/** Packs per-chart 分析能力/阈值定义 into the opaque metric_chart_config the backend stores as-is. */
function buildMetricChartConfig(tg: TemplateGroup): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  tg.chartGroups.forEach((g, i) => {
    if (g.capabilities.length || g.threshold) {
      out[g.chartId || `chart_${i + 1}`] = { capabilities: g.capabilities, threshold: g.threshold || null };
    }
  });
  return out;
}

/**
 * Maps one Template ID card to the exact POST /api/auto_report/data_templates request body.
 * creator/owner are placeholders until SSO supplies real user identity.
 */
export function buildDataTemplatePayload(tg: TemplateGroup) {
  return {
    business_scene: tg.businessScene || '',
    chart_template_id: tg.templateId || '',
    metric_chart_config: buildMetricChartConfig(tg),
    drill_dimensions: tg.drillDimensions,
    data_report_config: tg.chartGroups.map((g) => ({
      chart_id: g.chartId || '',
      compose_type: deriveComposeType(g.dataReports),
      field_list: g.fieldList,
      data_reports: g.dataReports.map((d) => ({
        group: d.group,
        report_id: Number(d.reportId) || 0,
        dataset_id: Number(d.datasetId) || 0,
        query_id: Number(d.queryId) || 0,
        link: d.link,
      })),
    })),
    creator: '',
    owner: [] as string[],
    type: tg.type === 'public' ? 'Public' : 'Personal',
  };
}

export function buildStorylinePayload(sl: StorylineState) {
  return {
    data_templates: sl.templateGroups.map(buildDataTemplatePayload),
  };
}

/**
 * Maps report state to the exact POST/PUT /api/auto_report/report_data_templates request body.
 * owner/allow_users are placeholders until SSO supplies real usernames.
 */
export function buildReportPayload(rpt: ReportState) {
  return {
    report_name: rpt.name || '',
    chart_template_ids: rpt.templateIds,
    owner: [] as string[],
    allow_users: [] as string[],
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

let linkIdCounter = 100;
export function nextLinkId() {
  linkIdCounter += 1;
  return linkIdCounter;
}

let tagIdCounter = 100;
export function nextTagId() {
  tagIdCounter += 1;
  return tagIdCounter;
}

export function emptyChartGroup(): ChartGroup {
  return {
    id: nextGroupId(),
    chartId: '',
    fieldList: [],
    dataReports: [],
    capabilities: ['basic'],
    threshold: '',
  };
}

export function emptyTemplateGroup(): TemplateGroup {
  return {
    id: nextTemplateGroupId(),
    templateId: '',
    businessScene: '',
    drillDimensions: [],
    type: 'public',
    tags: [],
    chartGroups: [],
  };
}

const VALID_CAPABILITIES: ChartCapability[] = ['basic', 'attribution', 'threshold'];

function normalizeDataReportLink(raw: Record<string, unknown> | undefined): DataReportLink {
  const r = raw || {};
  const link = typeof r.link === 'string' ? r.link : '';
  const parsed = parseQueryLink(link);
  return {
    id: typeof r.id === 'number' ? r.id : nextLinkId(),
    group: typeof r.group === 'string' ? r.group : '',
    link,
    reportId: typeof r.reportId === 'string' ? r.reportId : parsed.reportId,
    datasetId: typeof r.datasetId === 'string' ? r.datasetId : parsed.datasetId,
    queryId: typeof r.queryId === 'string' ? r.queryId : parsed.queryId,
  };
}

function normalizeChartGroup(raw: Record<string, unknown> | undefined): ChartGroup {
  const r = raw || {};
  // Back-compat: old shape stored a flat `queryLinks: string[]` with no group tagging.
  const legacyLinks = Array.isArray(r.queryLinks)
    ? (r.queryLinks as string[]).map((l) => normalizeDataReportLink({ link: l }))
    : [];
  return {
    id: typeof r.id === 'number' ? r.id : nextGroupId(),
    chartId: typeof r.chartId === 'string' ? r.chartId : '',
    fieldList: Array.isArray(r.fieldList) ? (r.fieldList as string[]) : [],
    dataReports: Array.isArray(r.dataReports)
      ? (r.dataReports as Record<string, unknown>[]).map(normalizeDataReportLink)
      : legacyLinks,
    capabilities: Array.isArray(r.capabilities)
      ? (r.capabilities as ChartCapability[]).filter((c) => VALID_CAPABILITIES.includes(c))
      : ['basic'],
    threshold: typeof r.threshold === 'string' ? r.threshold : '',
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

function normalizeTemplateGroup(raw: Record<string, unknown> | undefined, legacyScenario: string): TemplateGroup {
  const r = raw || {};
  const chartGroupsRaw = Array.isArray(r.chartGroups) ? (r.chartGroups as Record<string, unknown>[]) : [];
  // drillDimensions used to live per-chart as a single string; collect any into one array.
  const legacyDrillDims = chartGroupsRaw
    .map((g) => (typeof g.drillDimension === 'string' ? g.drillDimension : ''))
    .filter(Boolean);
  return {
    id: typeof r.id === 'number' ? r.id : nextTemplateGroupId(),
    templateId: typeof r.templateId === 'string' ? r.templateId : '',
    businessScene: typeof r.businessScene === 'string' && r.businessScene ? r.businessScene : legacyScenario,
    drillDimensions: Array.isArray(r.drillDimensions)
      ? (r.drillDimensions as string[])
      : typeof r.drillDimension === 'string' && r.drillDimension
        ? [r.drillDimension]
        : legacyDrillDims,
    type: r.type === 'personal' || r.type === 'public' ? r.type : 'public',
    tags: normalizeTags(r.tags),
    chartGroups: chartGroupsRaw.map(normalizeChartGroup),
  };
}

// Migrates persisted storylines from earlier shapes: the pre-redesign
// { nodes: [{ scenario, templateGroups }] } 3-level shape, or the current flat
// { templateGroups } shape. Node-level `scenario` becomes each template's
// businessScene when migrating older data.
export function normalizeStoryline(
  raw: (Partial<StorylineState> & { tags?: unknown; nodes?: unknown }) | null | undefined
): StorylineState {
  const base = defaultStoryline();
  if (!raw) return base;

  let templateGroups: TemplateGroup[];
  if (Array.isArray(raw.templateGroups)) {
    templateGroups = (raw.templateGroups as unknown as Record<string, unknown>[]).map((tg) =>
      normalizeTemplateGroup(tg, '')
    );
  } else if (Array.isArray(raw.nodes)) {
    templateGroups = (raw.nodes as Record<string, unknown>[]).flatMap((n) => {
      const scenario = typeof n.scenario === 'string' ? n.scenario : typeof n.name === 'string' ? n.name : '';
      const groups = Array.isArray(n.templateGroups) ? (n.templateGroups as Record<string, unknown>[]) : [];
      return groups.map((tg) => normalizeTemplateGroup(tg, scenario));
    });
  } else {
    templateGroups = base.templateGroups;
  }

  return {
    topic: typeof raw.topic === 'string' ? raw.topic : base.topic,
    background: typeof raw.background === 'string' ? raw.background : base.background,
    region: typeof raw.region === 'string' && raw.region ? raw.region : 'NAAP',
    templateGroups,
  };
}

export function normalizeReport(
  raw:
    | (Partial<ReportState> & { dataQueryId?: string; chartId?: string; chartIds?: string[] })
    | null
    | undefined
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
  };
}
