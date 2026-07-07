import { useEffect, useState } from 'react';
import type { StorylineDataType, StorylineFolder, StorylineState } from './types';
import { countStorylineItems, folderIconColor } from './utils';

interface Props {
  state: StorylineState;
  onLoad: (state: StorylineState) => void;
  toast: (msg: string) => void;
}

const FOLDERS_KEY = 'storylineFolders';

function loadFolders(): StorylineFolder[] {
  try {
    return JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveFolders(arr: StorylineFolder[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(arr));
}

export default function StorylineSidebar({ state, onLoad, toast }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [folders, setFolders] = useState<StorylineFolder[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    setFolders(loadFolders());
  }, []);

  const visible = folders.filter((f) => {
    if (tab === 'mine' && f.visibility !== 'personal') return false;
    if (search.trim() && !f.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const save = (visibility: StorylineDataType) => {
    const name = state.topic.trim();
    if (!name) {
      toast('⚠️ 请先填写文件夹名称');
      return;
    }
    const arr = loadFolders();
    const existingIdx = activeId
      ? arr.findIndex((f) => f.id === activeId)
      : arr.findIndex((f) => f.name === name);
    const item: StorylineFolder = {
      id: existingIdx >= 0 ? arr[existingIdx].id : String(Date.now()),
      name,
      owner: state.analyst,
      visibility,
      color: existingIdx >= 0 ? arr[existingIdx].color : folderIconColor(arr.length),
      updated_at: new Date().toLocaleString(),
      state,
    };
    if (existingIdx >= 0) arr[existingIdx] = item;
    else arr.unshift(item);
    saveFolders(arr);
    setFolders(arr);
    setActiveId(item.id);
    toast(`✅ 已保存为${visibility === 'public' ? ' Public' : ' Personal'} 文件夹：` + name);
  };

  const openFolder = (f: StorylineFolder) => {
    onLoad(f.state);
    setActiveId(f.id);
    toast('✅ 已载入文件夹：' + f.name);
  };

  const duplicateFolder = (f: StorylineFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    const arr = loadFolders();
    const copy: StorylineFolder = {
      ...f,
      id: String(Date.now()),
      name: f.name + ' (Copy)',
      updated_at: new Date().toLocaleString(),
    };
    arr.unshift(copy);
    saveFolders(arr);
    setFolders(arr);
    toast('✅ 已复制文件夹：' + copy.name);
  };

  if (collapsed) {
    return (
      <div className="sl-sidebar collapsed">
        <button className="sl-sidebar-toggle" onClick={() => setCollapsed(false)} title="展开侧边栏">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 6l6 6-6 6"></path>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="sl-sidebar">
      <div className="sl-sidebar-inner">
        <div className="sl-sidebar-headrow">
          <div>
            <div className="sl-sidebar-title">Agent生成报告</div>
            <div className="sl-sidebar-subtitle">图表配置</div>
          </div>
          <button className="sl-sidebar-toggle" onClick={() => setCollapsed(true)} title="收起侧边栏">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 6l-6 6 6 6"></path>
            </svg>
          </button>
        </div>

        <div className="sl-search">
          <input
            type="text"
            placeholder="搜索文件夹…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sl-tabs">
          <div className={`sl-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
            All
          </div>
          <div className={`sl-tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
            My Templates
          </div>
        </div>

        <div className="sl-folders-head">
          <span>FOLDERS</span>
        </div>

        <div className="sl-folder-list">
          {visible.length === 0 && <div className="sl-folder-empty">暂无文件夹</div>}
          {visible.map((f) => (
            <div
              key={f.id}
              className={`sl-folder-row ${f.id === activeId ? 'active' : ''}`}
              onClick={() => openFolder(f)}
            >
              <svg
                className="sl-folder-chevron"
                width="12"
                height="12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M9 6l6 6-6 6"></path>
              </svg>
              <span className="sl-folder-icon" style={{ background: f.color }}>
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"></path>
                </svg>
              </span>
              <span className="sl-folder-name" title={f.name}>
                {f.name}
              </span>
              <span className="sl-folder-meta">
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="11" width="14" height="9" rx="2"></rect>
                  <path d="M8 11V7a4 4 0 018 0v4"></path>
                </svg>
                {countStorylineItems(f.state)}
              </span>
              <button className="sl-folder-add" onClick={(e) => duplicateFolder(f, e)} title="复制文件夹">
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="sl-sidebar-footer">
        <button className="btn btn-secondary btn-sm" onClick={() => save('public')} title="存为 Public 文件夹">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"></path>
          </svg>
          存为 Public
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => save('personal')} title="存为 Personal 文件夹">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="11" width="14" height="9" rx="2"></rect>
            <path d="M8 11V7a4 4 0 018 0v4"></path>
          </svg>
          存为 Personal
        </button>
      </div>
    </div>
  );
}
