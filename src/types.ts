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
  dataSets: string[];
  owner: string;
  type: StorylineDataType;
}

export interface ReportChartItem {
  id: number;
  title: string;
  link: string;
  tpl: string;
  chart: string;
  note: string;
  collapsed: boolean;
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

export interface ExecutionConfig {
  tblDate: string;
  tblRange: string;
  tblSort: string;
  sortDir: 'DESC' | 'ASC';
  cols: [string, string, string, string];
  joinCross: boolean;
  joinNull: string;
  joinShare: string;
  yoyOn: boolean;
  yoyFormula: string;
  yoySort: string;
  wbName: string;
  wbTab: string;
  wbMode: string;
}

export interface ReportState {
  name: string;
  cycle: ReportCycle;
  chartType: ChartType;
  description: string;
  chartId: string;
  owner: string;
  ownerEmail: string;
  ownerDept: string;
  templateName: string;
  items: ReportChartItem[];
  exec: ExecutionConfig;
}

export interface ReportTemplate {
  id: string;
  name: string;
  updated_at: string;
  state: ReportState;
}
