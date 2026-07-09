export type StorylineDataType = 'public' | 'personal';

export interface ReportTag {
  id: number;
  category: string;
  value: string;
}

export type ChartCapability = 'basic' | 'attribution' | 'threshold';

export interface DataReportLink {
  id: number;
  group: string; // 'Q' | 'M' | 'W' | custom label, matches backend "group"
  link: string;
  reportId: string;
  datasetId: string;
  queryId: string;
}

export interface ChartGroup {
  id: number;
  chartId: string;
  fieldList: string[];
  dataReports: DataReportLink[];
  capabilities: ChartCapability[];
  threshold: string;
}

export interface TemplateGroup {
  id: number;
  templateId: string; // chart_template_id
  businessScene: string;
  drillDimensions: string[];
  creator: string;
  owner: string[];
  type: StorylineDataType;
  tags: ReportTag[];
  chartGroups: ChartGroup[];
}

export type ReportCycle = 'W' | '2W' | 'M';
export type ChartType = 'wuhuaro' | 'fensi' | 'maomaochong' | 'bar';

export interface StorylineState {
  topic: string;
  analyst: string;
  background: string;
  region: string;
  templateGroups: TemplateGroup[];
}

export interface ReportState {
  name: string;
  cycle: ReportCycle;
  chartType: ChartType;
  description: string;
  templateIds: string[];
  owner: string;
  ownerEmail: string;
  ownerDept: string;
  ownerUsers: string[];
  allowUsers: string[];
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
