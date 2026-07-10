import { useEffect, useState } from 'react';
import { Folder } from 'lucide-react';
import StorylineTab from './StorylineTab';
import FolderSidebar from './FolderSidebar';
import ReportTab from './ReportTab';
import { useToast } from './useToast';
import {
  blankStoryline,
  defaultReport,
  defaultStoryline,
  loadFolders,
  normalizeReport,
  normalizeStoryline,
  saveFolders,
  todayYYYYMMDD,
  upsertFolder,
} from './utils';
import type { ReportState, StorylineState } from './types';

const STORAGE_KEY = 'agentReportAppState';

type TabId = 'storyline' | 'report';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

/** Undo/redo history wrapper — drop-in for useState's [value, setValue] pair. */
function useHistory<T>(initial: T | (() => T)) {
  const [state, setState] = useState<HistoryState<T>>(() => ({
    past: [],
    present: typeof initial === 'function' ? (initial as () => T)() : initial,
    future: [],
  }));

  const setPresent: React.Dispatch<React.SetStateAction<T>> = (value) => {
    setState((curr) => {
      const nextPresent = typeof value === 'function' ? (value as (prev: T) => T)(curr.present) : value;
      return { past: [...curr.past, curr.present], present: nextPresent, future: [] };
    });
  };

  const undo = () => {
    setState((curr) => {
      if (!curr.past.length) return curr;
      const previous = curr.past[curr.past.length - 1];
      return { past: curr.past.slice(0, -1), present: previous, future: [curr.present, ...curr.future] };
    });
  };

  const redo = () => {
    setState((curr) => {
      if (!curr.future.length) return curr;
      const next = curr.future[0];
      return { past: [...curr.past, curr.present], present: next, future: curr.future.slice(1) };
    });
  };

  return {
    value: state.present,
    setValue: setPresent,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}

const REPORT_FOLDER_SEED = (['W', '2W', 'M'] as const).map((cycle) => ({
  name: cycle,
  state: { ...defaultReport(), name: cycle, cycle },
}));

function naapRevenueVariant(name: string, chartId: string) {
  return {
    ...blankStoryline(),
    topic: name,
    background: `NAAP 大盘 Revenue（${name}）归因分析。`,
    regions: ['NAAP'],
    templateGroups: [
      {
        id: 1,
        templateId: 'naap_revenue_template',
        businessScene: `${name} Revenue`,
        drillDimensions: [],
        type: 'public' as const,
        tags: ['Performance'],
        chartGroups: [
          {
            id: 1,
            chartId,
            fieldList: [],
            queryLinks: [],
            aggregationMethods: [],
            aggregationOtherText: '',
            capabilities: ['basic' as const],
            threshold: '',
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
      regions: ['NAAP'],
      templateGroups: [
        {
          id: 1,
          templateId: 'naap_revenue_template',
          businessScene: 'NAAP Revenue WoW',
          drillDimensions: [],
          type: 'public' as const,
          tags: ['Performance'],
          chartGroups: [
            {
              id: 1,
              chartId: 'NAAPRevWoW',
              fieldList: [],
              queryLinks: [],
              aggregationMethods: [],
              aggregationOtherText: '',
              capabilities: ['basic' as const],
              threshold: '',
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
      regions: ['NA'],
      templateGroups: [
        {
          id: 1,
          templateId: 'na_yoy_template',
          businessScene: 'NA Revenue YOY',
          drillDimensions: [],
          type: 'public' as const,
          tags: ['Performance'],
          chartGroups: [
            {
              id: 1,
              chartId: 'NARevYOY',
              fieldList: [],
              queryLinks: [],
              aggregationMethods: [],
              aggregationOtherText: '',
              capabilities: ['basic' as const],
              threshold: '',
            },
          ],
        },
      ],
    },
  },
];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('storyline');
  const {
    value: storyline,
    setValue: setStoryline,
    undo: undoStoryline,
    redo: redoStoryline,
    canUndo: canUndoStoryline,
    canRedo: canRedoStoryline,
  } = useHistory<StorylineState>(defaultStoryline);
  const {
    value: report,
    setValue: setReport,
    undo: undoReport,
    redo: redoReport,
    canUndo: canUndoReport,
    canRedo: canRedoReport,
  } = useHistory<ReportState>(defaultReport);
  const [storylineActiveId, setStorylineActiveId] = useState('');
  const [reportActiveId, setReportActiveId] = useState('');
  const [storylineRefresh, setStorylineRefresh] = useState(0);
  const [reportRefresh, setReportRefresh] = useState(0);
  const { msg, visible, toast } = useToast();

  const saveStorylineFolder = () => {
    const name = storyline.topic.trim();
    if (!name) {
      toast('⚠️ 请先填写文件夹名称');
      return;
    }
    try {
      const nextState = { ...storyline, date: todayYYYYMMDD() };
      const existing = loadFolders<StorylineState>('storylineFolders').find((f) => f.id === storylineActiveId);
      const item = upsertFolder({
        storageKey: 'storylineFolders',
        activeId: storylineActiveId,
        parentId: null,
        name,
        owner: '',
        visibility: existing?.visibility || 'public',
        state: nextState,
      });
      setStoryline(nextState);
      setStorylineActiveId(item.id);
      setStorylineRefresh((v) => v + 1);
      toast('✅ 已保存：' + name);
    } catch (e) {
      toast('⚠️ 保存失败：' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const saveReportFolder = () => {
    const name = report.name.trim();
    if (!name) {
      toast('⚠️ 请先填写报告名称');
      return;
    }
    try {
      const existing = loadFolders<ReportState>('reportFolders').find((f) => f.id === reportActiveId);
      const item = upsertFolder({
        storageKey: 'reportFolders',
        activeId: reportActiveId,
        parentId: null,
        name,
        owner: '',
        visibility: existing?.visibility || 'public',
        state: report,
      });
      setReportActiveId(item.id);
      setReportRefresh((v) => v + 1);
      toast('✅ 已保存：' + name);
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

  // Live-sync the active storyline folder: every edit (including renaming via
  // 报告名称) persists to the folder immediately, without pressing Save.
  useEffect(() => {
    if (!storylineActiveId) return;
    try {
      const arr = loadFolders<StorylineState>('storylineFolders');
      const idx = arr.findIndex((f) => f.id === storylineActiveId);
      if (idx < 0) return;
      arr[idx] = {
        ...arr[idx],
        name: storyline.topic.trim() || arr[idx].name,
        state: storyline,
        updated_at: new Date().toLocaleString(),
      };
      saveFolders('storylineFolders', arr);
      setStorylineRefresh((v) => v + 1);
    } catch {
      // ignore quota errors
    }
  }, [storyline, storylineActiveId]);

  // Live-sync the active report folder the same way, without pressing Save.
  useEffect(() => {
    if (!reportActiveId) return;
    try {
      const arr = loadFolders<ReportState>('reportFolders');
      const idx = arr.findIndex((f) => f.id === reportActiveId);
      if (idx < 0) return;
      arr[idx] = {
        ...arr[idx],
        name: report.name.trim() || arr[idx].name,
        state: report,
        updated_at: new Date().toLocaleString(),
      };
      saveFolders('reportFolders', arr);
      setReportRefresh((v) => v + 1);
    } catch {
      // ignore quota errors
    }
  }, [report, reportActiveId]);

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
            <span className="t-badge">{storyline.templateGroups.length}</span>
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
              getOwner={() => ''}
              countItems={(s) => s.templateGroups.length}
              normalize={normalizeStoryline}
              blankState={blankStoryline}
              seed={STORYLINE_FOLDER_SEED}
              activeId={storylineActiveId}
              onActiveIdChange={setStorylineActiveId}
              refreshToken={storylineRefresh}
              listTemplates={(s) => s.templateGroups.map((tg) => tg.businessScene || tg.templateId || '(未命名 Template)')}
            />
            <div style={{ flex: 1, minWidth: 0, alignSelf: 'stretch' }}>
              {storylineActiveId ? (
                <StorylineTab
                  state={storyline}
                  setState={setStoryline}
                  toast={toast}
                  onSave={saveStorylineFolder}
                  onUndo={undoStoryline}
                  onRedo={redoStoryline}
                  canUndo={canUndoStoryline}
                  canRedo={canRedoStoryline}
                />
              ) : (
                <div className="flex-1 h-full flex items-center justify-center text-slate-400 bg-slate-50">
                  <div className="text-center">
                    <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>请从左侧选择一个文件夹，或新建一个。</p>
                  </div>
                </div>
              )}
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
              getOwner={() => ''}
              countItems={(s) => s.templateIds.length}
              normalize={normalizeReport}
              blankState={defaultReport}
              seed={REPORT_FOLDER_SEED}
              activeId={reportActiveId}
              onActiveIdChange={setReportActiveId}
              refreshToken={reportRefresh}
            />
            <div style={{ flex: 1, minWidth: 0, alignSelf: 'stretch' }}>
              <ReportTab
                state={report}
                setState={setReport}
                toast={toast}
                onSave={saveReportFolder}
                onUndo={undoReport}
                onRedo={redoReport}
                canUndo={canUndoReport}
                canRedo={canRedoReport}
              />
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
