import { useEffect, useState } from 'react';
import type { SavedFolder, StorylineDataType } from './types';
import { folderIconColor, loadFolders, saveFolders, upsertFolder } from './utils';

interface SeedFolder<T> {
  name: string;
  owner?: string;
  visibility?: StorylineDataType;
  state: T;
}

interface Props<T> {
  subtitle: string;
  storageKey: string;
  nameLabel: string;
  state: T;
  onLoad: (state: T) => void;
  blankState: () => T;
  seed?: SeedFolder<T>[];
  toast: (msg: string) => void;
  getName: (state: T) => string;
  getOwner: (state: T) => string;
  countItems: (state: T) => number;
  normalize: (raw: T) => T;
  activeId: string;
  onActiveIdChange: (id: string) => void;
}

export default function FolderSidebar<T>({
  subtitle,
  storageKey,
  nameLabel,
  state,
  onLoad,
  blankState,
  seed,
  toast,
  getName,
  getOwner,
  countItems,
  normalize,
  activeId,
  onActiveIdChange: setActiveId,
}: Props<T>) {
  const [collapsed, setCollapsed] = useState(false);
  const [folders, setFolders] = useState<SavedFolder<T>[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [editingId, setEditingId] = useState('');
  const [editDraft, setEditDraft] = useState<{ name: string; owner: string; visibility: StorylineDataType }>({
    name: '',
    owner: '',
    visibility: 'public',
  });

  useEffect(() => {
    let arr = loadFolders<T>(storageKey);
    const seededKey = `${storageKey}__seeded`;
    if (arr.length === 0 && seed?.length && !localStorage.getItem(seededKey)) {
      arr = seed.map((s, i) => ({
        id: `seed-${i}`,
        name: s.name,
        owner: s.owner || '',
        visibility: s.visibility || 'public',
        color: folderIconColor(i),
        updated_at: new Date().toLocaleString(),
        state: s.state,
      }));
      saveFolders(storageKey, arr);
      localStorage.setItem(seededKey, '1');
    }
    setFolders(arr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Re-sync from storage whenever the active folder changes (covers saves triggered
  // from outside this component, e.g. the inline save buttons in the main form).
  useEffect(() => {
    setFolders(loadFolders<T>(storageKey));
  }, [storageKey, activeId]);

  const visible = folders.filter((f) => {
    if (tab === 'mine' && f.visibility !== 'personal') return false;
    if (search.trim() && !f.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const save = (visibility: StorylineDataType) => {
    const name = getName(state).trim();
    if (!name) {
      toast(`⚠️ 请先填写${nameLabel}`);
      return;
    }
    const item = upsertFolder({ storageKey, activeId, name, owner: getOwner(state), visibility, state });
    setFolders(loadFolders<T>(storageKey));
    setActiveId(item.id);
    toast(`✅ 已保存为${visibility === 'public' ? ' Public' : ' Personal'} 文件夹：` + name);
  };

  const openFolder = (f: SavedFolder<T>) => {
    onLoad(normalize(f.state));
    setActiveId(f.id);
    toast('✅ 已载入文件夹：' + f.name);
  };

  const startNew = () => {
    const arr = loadFolders<T>(storageKey);
    const name = `新文件夹 ${arr.length + 1}`;
    const item: SavedFolder<T> = {
      id: String(Date.now()),
      name,
      owner: getOwner(state),
      visibility: 'public',
      color: folderIconColor(arr.length),
      updated_at: new Date().toLocaleString(),
      state: blankState(),
    };
    arr.unshift(item);
    saveFolders(storageKey, arr);
    setFolders(arr);
    onLoad(item.state);
    setActiveId(item.id);
    toast('✅ 已新建文件夹：' + name);
  };

  const duplicateFolder = (f: SavedFolder<T>, e: React.MouseEvent) => {
    e.stopPropagation();
    const arr = loadFolders<T>(storageKey);
    const copy: SavedFolder<T> = {
      ...f,
      id: String(Date.now()),
      name: f.name + ' (Copy)',
      updated_at: new Date().toLocaleString(),
    };
    arr.unshift(copy);
    saveFolders(storageKey, arr);
    setFolders(arr);
    toast('✅ 已复制文件夹：' + copy.name);
  };

  const deleteFolder = (f: SavedFolder<T>, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确认删除文件夹「${f.name}」？此操作不可撤销。`)) return;
    const arr = loadFolders<T>(storageKey).filter((x) => x.id !== f.id);
    saveFolders(storageKey, arr);
    setFolders(arr);
    if (activeId === f.id) setActiveId('');
    toast('✅ 已删除文件夹：' + f.name);
  };

  const startEdit = (f: SavedFolder<T>, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(f.id);
    setEditDraft({ name: f.name, owner: f.owner, visibility: f.visibility });
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId('');
  };

  const saveEdit = (f: SavedFolder<T>, e: React.MouseEvent) => {
    e.stopPropagation();
    const name = editDraft.name.trim();
    if (!name) {
      toast(`⚠️ 请先填写${nameLabel}`);
      return;
    }
    const arr = loadFolders<T>(storageKey);
    const idx = arr.findIndex((x) => x.id === f.id);
    if (idx >= 0) {
      arr[idx] = {
        ...arr[idx],
        name,
        owner: editDraft.owner.trim(),
        visibility: editDraft.visibility,
        updated_at: new Date().toLocaleString(),
      };
      saveFolders(storageKey, arr);
      setFolders(arr);
    }
    setEditingId('');
    toast('✅ 已更新文件夹信息：' + name);
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
            <div className="sl-sidebar-subtitle">{subtitle}</div>
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
          <button className="sl-sidebar-toggle" onClick={startNew} title="新建文件夹">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </button>
        </div>

        <div className="sl-folder-list">
          {visible.length === 0 && <div className="sl-folder-empty">暂无文件夹</div>}
          {visible.map((f) =>
            editingId === f.id ? (
              <div className="sl-folder-row sl-folder-row-edit" key={f.id} onClick={(e) => e.stopPropagation()}>
                <span className="sl-folder-icon" style={{ background: f.color }}>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"></path>
                  </svg>
                </span>
                <div className="sl-folder-edit-fields">
                  <input
                    type="text"
                    placeholder={nameLabel}
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <input
                    type="text"
                    placeholder="Owner"
                    value={editDraft.owner}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, owner: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <select
                    value={editDraft.visibility}
                    onChange={(e) =>
                      setEditDraft((prev) => ({ ...prev, visibility: e.target.value as StorylineDataType }))
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="public">Public</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
                <button className="sl-folder-add" onClick={(e) => saveEdit(f, e)} title="保存">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </button>
                <button className="sl-folder-add" onClick={cancelEdit} title="取消">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            ) : (
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
                  {f.visibility === 'personal' && (
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="11" width="14" height="9" rx="2"></rect>
                      <path d="M8 11V7a4 4 0 018 0v4"></path>
                    </svg>
                  )}
                  {countItems(f.state)}
                </span>
                <button className="sl-folder-add" onClick={(e) => startEdit(f, e)} title="编辑文件夹信息">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5"></path>
                    <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button className="sl-folder-add" onClick={(e) => duplicateFolder(f, e)} title="复制文件夹">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14"></path>
                  </svg>
                </button>
                <button className="sl-folder-add danger" onClick={(e) => deleteFolder(f, e)} title="删除文件夹">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            )
          )}
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
