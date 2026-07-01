import type {
  AttributionNode,
  ExecutionConfig,
  ReportChartItem,
  ReportState,
  StorylineState,
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

export function defaultExecutionConfig(): ExecutionConfig {
  return {
    tblDate: 'YYYY-MM-DD',
    tblRange: 'current_year',
    tblSort: 'Date',
    sortDir: 'DESC',
    cols: ['', '', '', ''],
    joinCross: false,
    joinNull: 'fill_zero',
    joinShare: 'Value / Total * 100',
    yoyOn: true,
    yoyFormula: '(Current - Previous) / Previous * 100',
    yoySort: 'abs_desc',
    wbName: '飞书表格 Sheet',
    wbTab: 'Sheet1',
    wbMode: 'overwrite',
  };
}

export function defaultStoryline(): StorylineState {
  return {
    topic: '',
    period: '',
    analyst: '',
    background: '',
    framework: '',
    nodes: [
      {
        id: 1,
        name: '流量层分析',
        desc: '分析各渠道流量趋势，定位流量下滑来源渠道',
        links: ['https://data.example.com/traffic/channel_trend'],
      },
      {
        id: 2,
        name: '转化率分析',
        desc: '对比各类目转化漏斗，识别转化异常节点',
        links: ['https://data.example.com/conversion/funnel'],
      },
    ],
  };
}

export function defaultReport(): ReportState {
  return {
    name: '',
    dept: '',
    cycle: 'W',
    chartType: 'wuhuaro',
    templateName: '',
    items: [
      {
        id: 1,
        title: 'DAU 周趋势',
        link: 'https://data.example.com/dau/weekly',
        tpl: 'tpl_001',
        chart: 'cht_dau_trend',
        note: '7 日 DAU 折线图',
        collapsed: false,
      },
      {
        id: 2,
        title: 'GMV 分渠道',
        link: 'https://data.example.com/gmv/channel',
        tpl: 'tpl_001',
        chart: 'cht_gmv_channel',
        note: '按直播/搜索/推荐拆分',
        collapsed: false,
      },
    ],
    exec: defaultExecutionConfig(),
  };
}

export function buildStorylinePayload(sl: StorylineState) {
  return {
    type: 'storyline_config',
    topic: sl.topic || '（未填写）',
    period: sl.period || null,
    analyst: sl.analyst || null,
    background: sl.background || '（未填写）',
    drill_down_framework: sl.framework || null,
    attribution_nodes: sl.nodes.map((n, i) => ({
      index: i + 1,
      name: n.name || `节点${i + 1}`,
      description: n.desc || null,
      data_links: n.links,
    })),
  };
}

export function buildReportPayload(rpt: ReportState) {
  const e = rpt.exec;
  return {
    type: 'weekly_report_config',
    report_name: rpt.name || '（未填写）',
    department: rpt.dept || null,
    cycle: rpt.cycle,
    chart_type: rpt.chartType,
    charts: rpt.items.map((it, i) => ({
      index: i + 1,
      title: it.title || `图表${i + 1}`,
      data_link: it.link || null,
      template_id: it.tpl || null,
      chart_id: it.chart || null,
      note: it.note || null,
    })),
    execution: {
      table_rules: {
        core_fields: e.cols.filter(Boolean),
        date_format: e.tblDate,
        data_range: e.tblRange,
        sort: { field: e.tblSort || 'Date', direction: e.sortDir },
      },
      join_rules: {
        cross_section_merge: e.joinCross,
        null_handling: e.joinNull,
        share_formula: e.joinShare,
      },
      yoy_attribution: {
        enabled: e.yoyOn,
        formula: e.yoyFormula,
        sort_rule: e.yoySort,
      },
      writeback: {
        target_sheet: e.wbName,
        tab: e.wbTab,
        mode: e.wbMode,
      },
    },
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

let rptIdCounter = 100;
export function nextRptId() {
  rptIdCounter += 1;
  return rptIdCounter;
}

export function emptyNode(): AttributionNode {
  return { id: nextNodeId(), name: '', desc: '', links: [] };
}

export function emptyRptItem(): ReportChartItem {
  return { id: nextRptId(), title: '', link: '', tpl: '', chart: '', note: '', collapsed: false };
}
