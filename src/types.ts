export type StorylineDataType = 'public' | 'personal';

export type TagCategory = 'lever' | 'product' | 'region';

export interface ReportTag {
  id: number;
  category: TagCategory;
  value: string;
}

export type ChartCapability = 'basic' | 'attribution' | 'threshold';

export interface ChartGroup {
  id: number;
  chartId: string;
  queryLinks: string[];
  joinMethods: string[];
  drillDimension: string;
  capabilities: ChartCapability[];
  threshold: string;
  type: StorylineDataType;
}

export interface TemplateGroup {
  id: number;
  templateId: string;
  tags: ReportTag[];
  chartGroups: ChartGroup[];
}

export interface AttributionNode {
  id: number;
  scenario: string;
  categoryL1: string;
  categoryL2: string;
  templateGroups: TemplateGroup[];
}

export type ReportCycle = 'W' | '2W' | 'M';
export type ChartType = 'wuhuaro' | 'fensi' | 'maomaochong' | 'bar';

export interface StorylineState {
  topic: string;
  analyst: string;
  background: string;
  region: string;
  nodes: AttributionNode[];
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
  templateName: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  updated_at: string;
  state: ReportState;
}

export interface SavedFolder<T> {
  id: string;
  name: string;
  owner: string;
  visibility: StorylineDataType;
  color: string;
  updated_at: string;
  state: T;
}
