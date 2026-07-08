import { useEffect, useState } from 'react';
import StorylineTab from './StorylineTab';
import FolderSidebar from './FolderSidebar';
import ReportTab from './ReportTab';
import { useToast } from './useToast';
import {
  blankStoryline,
  defaultReport,
  defaultStoryline,
  normalizeReport,
  normalizeStoryline,
  upsertFolder,
} from './utils';
import type { ReportState, StorylineDataType, StorylineState } from './types';

const STORAGE_KEY = 'agentReportAppState';

type TabId = 'storyline' | 'report';

const REPORT_FOLDER_SEED = (['W', '2W', 'M'] as const).map((cycle) => ({
  name: cycle,
  state: { ...defaultReport(), name: cycle, cycle },
}));

function naapRevenueVariant(name: string, chartId: string) {
  return {
    ...blankStoryline(),
    topic: name,
    background: `NAAP 大盘 Revenue（${name}）归因分析。`,
    region: 'NAAP',
    nodes: [
      {
        id: 1,
        scenario: `${name} Revenue`,
        templateGroups: [
          {
            id: 1,
            templateId: 'naap_revenue_template',
            tags: [
              {
                id: 1,
                category: '经营结果与效果指标 / Business Outcome & Performance Metrics',
                value: '收入与交易结果 / Revenue & Transaction Outcome',
              },
            ],
            chartGroups: [
              {
                id: 1,
                chartId,
                queryLinks: [],
                joinMethods: [],
                drillDimension: '',
                capabilities: ['basic' as const],
                threshold: '',
                type: 'public' as const,
              },
            ],
          },
        ],
      },
    ],
  };
}

const STORYLINE_FOLDER_SEED = [
  {
    name: 'NAAP Revenue',
    state: {
      ...blankStoryline(),
      topic: 'NAAP Revenue',
      background: 'NAAP 大盘 Revenue 周环比下滑，需要归因分析驱动因素。',
      region: 'NAAP',
      nodes: [
        {
          id: 1,
          scenario: 'NAAP Revenue WoW',
          templateGroups: [
            {
              id: 1,
              templateId: 'naap_revenue_template',
              tags: [
                {
                  id: 1,
                  category: '经营结果与效果指标 / Business Outcome & Performance Metrics',
                  value: '收入与交易结果 / Revenue & Transaction Outcome',
                },
              ],
              chartGroups: [
                {
                  id: 1,
                  chartId: 'NAAPRevWoW',
                  queryLinks: [],
                  joinMethods: [],
                  drillDimension: '',
                  capabilities: ['basic' as const],
                  threshold: '',
                  type: 'public' as const,
                },
              ],
            },
          ],
        },
      ],
    },
    children: [
      {
        name: '202606',
        state: naapRevenueVariant('202606', 'NAAPRev202606'),
        children: [
          { name: '2026WK1_20251229-20260104', state: naapRevenueVariant('2026WK1_20251229-20260104', 'NAAPRevWK1') },
          { name: '2026WK2_20260105-20260111', state: naapRevenueVariant('2026WK2_20260105-20260111', 'NAAPRevWK2') },
        ],
      },
      { name: '202607', state: naapRevenueVariant('202607', 'NAAPRev202607') },
    ],
  },
  {
    name: 'NA YOY',
    state: {
      ...blankStoryline(),
      topic: 'NA YOY',
      background: 'NA 大盘 Revenue 同比出现异常波动，需要归因分析。',
      region: 'NA',
      nodes: [
        {
          id: 1,
          scenario: 'NA Revenue YOY',
          templateGroups: [
            {
              id: 1,
              templateId: 'na_yoy_template',
              tags: [
                {
                  id: 1,
                  category: '经营结果与效果指标 / Business Outcome & Performance Metrics',
                  value: '收入与交易结果 / Revenue & Transaction Outcome',
                },
              ],
              chartGroups: [
                {
                  id: 1,
                  chartId: 'NARevYOY',
                  queryLinks: [],
                  joinMethods: [],
                  drillDimension: '',
                  capabilities: ['basic' as const],
                  threshold: '',
                  type: 'public' as const,
                },
              ],
            },
          ],
        },
      ],
    },
  },
];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('storyline');
  const [storyline, setStoryline] = useState<StorylineState>(defaultStoryline);
  const [report, setReport] = useState<ReportState>(defaultReport);
  const [storylineActiveId, setStorylineActiveId] = useState('');
  const [reportActiveId, setReportActiveId] = useState('');
  const { msg, visible, toast } = useToast();

  const saveStorylineFolder = (visibility: StorylineDataType) => {
    const name = storyline.topic.trim();
    if (!name) {
      toast('⚠️ 请先填写文件夹名称');
      return;
    }
    try {
      const item = upsertFolder({
        storageKey: 'storylineFolders',
        activeId: storylineActiveId,
        parentId: null,
        name,
        owner: storyline.analyst,
        visibility,
        state: storyline,
      });
      setStorylineActiveId(item.id);
      toast(`✅ 已保存为${visibility === 'public' ? ' Public' : ' Personal'} 文件夹：` + name);
    } catch (e) {
      toast('⚠️ 保存失败：' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const saveReportFolder = (visibility: StorylineDataType) => {
    const name = report.name.trim();
    if (!name) {
      toast('⚠️ 请先填写报告名称');
      return;
    }
    try {
      const item = upsertFolder({
        storageKey: 'reportFolders',
        activeId: reportActiveId,
        parentId: null,
        name,
        owner: report.owner,
        visibility,
        state: report,
      });
      setReportActiveId(item.id);
      toast(`✅ 已保存为${visibility === 'public' ? ' Public' : ' Personal'} 文件夹：` + name);
    } catch (e) {
      toast('⚠️ 保存失败：' + (e instanceof Error ? e.message : String(e)));
    }
  };

  // Load persisted state once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.storyline) setStoryline(normalizeStoryline(parsed.storyline));
        if (parsed.report) setReport(normalizeReport(parsed.report));
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // Autosave on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ storyline, report }));
    } catch {
      // ignore quota errors
    }
  }, [storyline, report]);

  const handleExport = () => {
    const payload = activeTab === 'report' ? report : storyline;
    const json = JSON.stringify(payload, null, 2);
    const a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
    a.download = (activeTab === 'report' ? 'report' : 'storyline') + '-config-' + Date.now() + '.json';
    a.click();
    toast('✅ 配置已导出为 JSON 文件');
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"></path>
            </svg>
          </div>
          <span className="topbar-name">Agent生成报告</span>
          <span className="topbar-version">Beta</span>
        </div>
        <nav className="topbar-nav">
          <button
            className={`topbar-tab ${activeTab === 'storyline' ? 'active' : ''}`}
            onClick={() => setActiveTab('storyline')}
          >
            <span className="t-icon">📊</span>图表配置
            <span className="t-badge">{storyline.nodes.length}</span>
          </button>
          <button
            className={`topbar-tab ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            <span className="t-icon">📅</span>报告取数配置
          </button>
        </nav>
        <div className="topbar-right">
          <button className="topbar-btn" onClick={handleExport}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            导出配置
          </button>
          <div className="topbar-avatar" title="ESTHER">
            E
          </div>
        </div>
      </header>

      <main className="sl-layout">
        {activeTab === 'storyline' && (
          <>
            <FolderSidebar
              key="storyline"
              subtitle="图表配置"
              storageKey="storylineFolders"
              nameLabel="报告名称"
              state={storyline}
              onLoad={setStoryline}
              toast={toast}
              getName={(s) => s.topic}
              getOwner={(s) => s.analyst}
              countItems={(s) => s.nodes.length}
              normalize={normalizeStoryline}
              blankState={blankStoryline}
              seed={STORYLINE_FOLDER_SEED}
              activeId={storylineActiveId}
              onActiveIdChange={setStorylineActiveId}
            />
            <div className="page" style={{ margin: 0, flex: 1 }}>
              <StorylineTab state={storyline} setState={setStoryline} toast={toast} onSave={saveStorylineFolder} />
            </div>
          </>
        )}
        {activeTab === 'report' && (
          <>
            <FolderSidebar
              key="report"
              subtitle="报告取数配置"
              storageKey="reportFolders"
              nameLabel="报告名称"
              state={report}
              onLoad={setReport}
              toast={toast}
              getName={(s) => s.name}
              getOwner={(s) => s.owner}
              countItems={(s) => s.templateIds.length}
              normalize={normalizeReport}
              blankState={defaultReport}
              seed={REPORT_FOLDER_SEED}
              activeId={reportActiveId}
              onActiveIdChange={setReportActiveId}
            />
            <div className="page" style={{ margin: 0, flex: 1 }}>
              <ReportTab state={report} setState={setReport} toast={toast} onSave={saveReportFolder} />
            </div>
          </>
        )}
      </main>

      <div
        id="toast"
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
        }}
      >
        {msg}
      </div>
    </>
  );
}

export default App;
