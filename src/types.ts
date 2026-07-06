export type StorylineDataType = 'public' | 'personal';

export interface MetricMapping {
  id: number;
  metric: string;
  chartId: string;
}

export interface AttributionNode {
  id: number;
  scenario: string;
  queryLinks: string[];
  joinMethod: string;
  templateId: string;
  metrics: MetricMapping[];
  drillDimension: string;
  creator: string;
  owner: string;
  type: StorylineDataType;
}

export type ReportCycle = 'W' | '2W' | 'M';
export type ChartType = 'wuhuaro' | 'fensi' | 'maomaochong' | 'bar';

export interface StorylineState {
  topic: string;
  analyst: string;
  background: string;
  framework: string;
  nodes: AttributionNode[];
}

export interface ReportState {
  name: string;
  cycle: ReportCycle;
  chartType: ChartType;
  description: string;
  chartIds: string[];
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
