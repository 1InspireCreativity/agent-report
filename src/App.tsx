import { useEffect, useState } from 'react';
import StorylineTab from './StorylineTab';
import FolderSidebar from './FolderSidebar';
import ReportTab from './ReportTab';
import { useToast } from './useToast';
import { defaultReport, defaultStoryline, normalizeReport, normalizeStoryline } from './utils';
import type { ReportState, StorylineState } from './types';

const STORAGE_KEY = 'agentReportAppState';

type TabId = 'storyline' | 'report';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('storyline');
  const [storyline, setStoryline] = useState<StorylineState>(defaultStoryline);
  const [report, setReport] = useState<ReportState>(defaultReport);
  const { msg, visible, toast } = useToast();

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
              subtitle="图表配置"
              storageKey="storylineFolders"
              nameLabel="文件夹名称"
              state={storyline}
              onLoad={setStoryline}
              toast={toast}
              getName={(s) => s.topic}
              getOwner={(s) => s.analyst}
              countItems={(s) => s.nodes.length}
              normalize={normalizeStoryline}
            />
            <div className="page" style={{ margin: 0, flex: 1 }}>
              <StorylineTab state={storyline} setState={setStoryline} toast={toast} />
            </div>
          </>
        )}
        {activeTab === 'report' && (
          <>
            <FolderSidebar
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
            />
            <div className="page" style={{ margin: 0, flex: 1 }}>
              <ReportTab state={report} setState={setReport} toast={toast} />
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
