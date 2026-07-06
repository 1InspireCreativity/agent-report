export type StorylineDataType = 'public' | 'personal';

export interface ChartGroup {
  id: number;
  chartId: string;
  queryLinks: string[];
}

export interface AttributionNode {
  id: number;
  scenario: string;
  chartGroups: ChartGroup[];
  joinMethods: string[];
  templateId: string;
  drillDimension: string;
  type: StorylineDataType;
}

export type ReportCycle = 'W' | '2W' | 'M';
export type ChartType = 'wuhuaro' | 'fensi' | 'maomaochong' | 'bar';

export interface StorylineState {
  topic: string;
  analyst: string;
  background: string;
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
