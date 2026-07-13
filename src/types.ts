export type StorylineDataType = 'public' | 'personal';

export type ChartCapability = 'basic' | 'attribution' | 'report';

export interface ChartGroup {
  id: number;
  chartId: string;
  fieldList: string[];
  queryLinks: string[];
  aggregationMethods: string[]; // Q/M/W/无需拼数处理/其他, chart-level
  aggregationOtherText: string;
  capabilities: ChartCapability[];
  // 是否拼数/是否分析/是否字段 checkbox state — persisted so a checked-and-saved
  // section stays visible on return, instead of resetting to hidden every load.
  showAggregation: boolean;
  showAnalysis: boolean;
  showFieldList: boolean;
}

export interface TemplateGroup {
  id: number;
  templateId: string; // chart_template_id
  businessScene: string;
  drillDimensions: string[];
  type: StorylineDataType;
  tags: string[];
  available: boolean; // 可用/不可用 — user can park a template that is not ready yet
  chartGroups: ChartGroup[];
}


export type ReportCycle = '' | 'W' | '2W' | 'M';
export type ChartType = '' | 'wuhuaro' | 'fensi' | 'maomaochong' | 'bar';

export interface StorylineState {
  topic: string;
  date: string; // YYYYMMDD, set to today on creation and refreshed on each Save
  background: string;
  regions: string[];
  timeStart: string; // 时间周期 start date, YYYY-MM-DD
  timeEnd: string; // 时间周期 end date, YYYY-MM-DD
  filters: string[]; // folder-level filter fields (Group / Team Name), applied to every query
  templateGroups: TemplateGroup[];
}

export interface ReportState {
  name: string;
  cycle: ReportCycle;
  chartType: ChartType;
  description: string;
  templateIds: string[];
}

export interface SavedFolder<T> {
  id: string;
  parentId: string | null;
  name: string;
  owner: string;
  visibility: StorylineDataType;
  color: string;
  updated_at: string;
  state: T;
}

export interface SavedTemplate {
  id: string;
  name: string;
  templateId: string;
  folderId: string | null;
  updated_at: string;
}

export interface SubmissionRecord {
  id: string;
  submitted_at: string;
  label: string;
  owner: string;
  meta: string;
  status: 'ok' | 'offline' | 'error';
  error?: string;
  payload: unknown;
}
