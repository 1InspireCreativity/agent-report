import { useEffect, useState } from 'react';
import { Folder as FolderIcon, Copy as CopyIcon } from 'lucide-react';
import type { SavedFolder, SavedTemplate, StorylineDataType } from './types';
import {
  deleteTemplate,
  folderIconColor,
  folderPath,
  loadFolders,
  loadTemplateCatalog,
  saveFolders,
  upsertFolder,
  upsertTemplate,
} from './utils';

interface SeedFolder<T> {
  name: string;
  owner?: string;
  visibility?: StorylineDataType;
  state: T;
  children?: SeedFolder<T>[];
}

interface Props<T> {
  subtitle: string;
  storageKey: string;
  nameLabel: string;
  state: T;
  onLoad: (state: T) => void;
  blankState: (name?: string) => T;
  seed?: SeedFolder<T>[];
  toast: (msg: string) => void;
  getName: (state: T) => string;
  getOwner: (state: T) => string;
  renameState: (state: T, name: string) => T;
  countItems: (state: T) => number;
  normalize: (raw: T) => T;
  activeId: string;
  onActiveIdChange: (id: string) => void;
  refreshToken?: unknown;
  listTemplates?: (state: T) => { id: string; label: string }[];
  onTemplateClick?: (folder: SavedFolder<T>, templateId: string) => void;
  showTemplateCatalog?: boolean;
}

function flattenSeed<T>(
  nodes: SeedFolder<T>[],
  parentId: string | null,
  counter: { n: number }
): SavedFolder<T>[] {
  const out: SavedFolder<T>[] = [];
  for (const node of nodes) {
    const id = `seed-${counter.n++}`;
    out.push({
      id,
      parentId,
      name: node.name,
      owner: node.owner || '',
      visibility: node.visibility || 'public',
      color: folderIconColor(counter.n),
      updated_at: new Date().toLocaleString(),
      state: node.state,
    });
    if (node.children?.length) {
      out.push(...flattenSeed(node.children, id, counter));
    }
  }
  return out;
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
  renameState,
  countItems,
  normalize,
  activeId,
  onActiveIdChange: setActiveId,
  refreshToken,
  listTemplates,
  onTemplateClick,
  showTemplateCatalog = false,
}: Props<T>) {
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(() => {
    const saved = Number(localStorage.getItem(storageKey + ':width'));
    return saved >= 200 && saved <= 480 ? saved : 272;
  });
  const [folders, setFolders] = useState<SavedFolder<T>[]>([]);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState('');
  const [editDraft, setEditDraft] = useState<{ name: string; owner: string; visibility: StorylineDataType }>({
    name: '',
    owner: '',
    visibility: 'public',
  });
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState('');
  const [templateDraft, setTemplateDraft] = useState<{ name: string; templateId: string; folderId: string | null }>({
    name: '',
    templateId: '',
    folderId: null,
  });

  useEffect(() => {
    setTemplates(loadTemplateCatalog());
  }, []);

  useEffect(() => {
    let arr = loadFolders<T>(storageKey);
    const seededKey = `${storageKey}__seeded`;
    if (arr.length === 0 && seed?.length && !localStorage.getItem(seededKey)) {
      arr = flattenSeed(seed, null, { n: 0 });
      saveFolders(storageKey, arr);
      localStorage.setItem(seededKey, '1');
    }
    setFolders(arr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Re-sync from storage whenever the active folder changes, or an external save
  // happens (e.g. the Save button in the main form re-saving the same active
  // folder, which does not change activeId but does change its stored name/state).
  useEffect(() => {
    setFolders(loadFolders<T>(storageKey));
  }, [storageKey, activeId, refreshToken]);

  const matchesFilter = (f: SavedFolder<T>) => {
    if (search.trim() && !f.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = (visibility: StorylineDataType) => {
    const name = getName(state).trim();
    if (!name) {
      toast(`⚠️ 请先填写${nameLabel}`);
      return;
    }
    try {
      const item = upsertFolder({
        storageKey,
        activeId,
        parentId: null,
        name,
        owner: getOwner(state),
        visibility,
        state,
      });
      setFolders(loadFolders<T>(storageKey));
      setActiveId(item.id);
      toast(`✅ 已保存为${visibility === 'public' ? ' Public' : ' Personal'} 文件夹：` + name);
    } catch (e) {
      toast('⚠️ 保存失败：' + (e instanceof Error ? e.message : String(e)));
    }
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
      parentId: null,
      name,
      owner: getOwner(state),
      visibility: 'public',
      color: folderIconColor(arr.length),
      updated_at: new Date().toLocaleString(),
      state: blankState(name),
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
    const baseName = f.name.replace(/ - 副本_V\d+$/, '');
    const versionRe = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} - 副本_V(\\d+)$`);
    const usedVersions = arr
      .map((x) => x.name.match(versionRe))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => parseInt(m[1], 10));
    const nextVersion = usedVersions.length ? Math.max(...usedVersions) + 1 : 1;
    const newName = `${baseName} - 副本_V${nextVersion}`;
    const copy: SavedFolder<T> = {
      ...f,
      id: String(Date.now()),
      name: newName,
      state: renameState(f.state, newName),
      updated_at: new Date().toLocaleString(),
    };
    const originalIdx = arr.findIndex((x) => x.id === f.id);
    let insertAfter = originalIdx;
    arr.forEach((x, i) => {
      if (i > insertAfter && (x.name === baseName || versionRe.test(x.name))) insertAfter = i;
    });
    const next = [...arr];
    next.splice(insertAfter + 1, 0, copy);
    saveFolders(storageKey, next);
    setFolders(next);
    toast('✅ 已复制文件夹：' + copy.name);
  };

  const deleteFolder = (f: SavedFolder<T>, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确认删除文件夹「${f.name}」？此操作不可撤销。`)) return;
    const arr = loadFolders<T>(storageKey);
    const next = arr.filter((x) => x.id !== f.id);
    saveFolders(storageKey, next);
    setFolders(next);
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

  const startNewTemplate = () => {
    const item = upsertTemplate({ name: `新模板 ${templates.length + 1}`, templateId: '', folderId: null });
    setTemplates(loadTemplateCatalog());
    setEditingTemplateId(item.id);
    setTemplateDraft({ name: item.name, templateId: '', folderId: null });
  };

  const startEditTemplate = (t: SavedTemplate) => {
    setEditingTemplateId(t.id);
    setTemplateDraft({ name: t.name, templateId: t.templateId, folderId: t.folderId });
  };

  const cancelEditTemplate = () => {
    setEditingTemplateId('');
  };

  const saveEditTemplate = (t: SavedTemplate) => {
    const templateId = templateDraft.templateId.trim();
    if (!templateId) {
      toast('⚠️ 请先填写 Template ID');
      return;
    }
    try {
      upsertTemplate({
        id: t.id,
        name: templateDraft.name.trim() || templateId,
        templateId,
        folderId: templateDraft.folderId,
      });
      setTemplates(loadTemplateCatalog());
      setEditingTemplateId('');
      toast('✅ 已保存模板：' + (templateDraft.name.trim() || templateId));
    } catch (e) {
      toast('⚠️ 保存失败：' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const deleteTemplateRow = (t: SavedTemplate) => {
    if (!confirm(`确认删除模板「${t.name}」？此操作不可撤销。`)) return;
    setTemplates(deleteTemplate(t.id));
    toast('✅ 已删除模板：' + t.name);
  };

  const renderFolderNode = (f: SavedFolder<T>): React.ReactNode => {
    // The active folder always shows its templates, without needing a manual
    // toggle click first. Folders are a flat list — no nesting.
    const isExpanded = expandedIds.has(f.id) || f.id === activeId;
    const indent = 8;

    if (editingId === f.id) {
      return (
        <div
          className="sl-folder-row sl-folder-row-edit"
          key={f.id}
          style={{ paddingLeft: indent }}
          onClick={(e) => e.stopPropagation()}
        >
          <FolderIcon size={14} color="#4F46E5" style={{ flexShrink: 0 }} />
          <div className="sl-folder-edit-fields">
            <input
              type="text"
              placeholder={nameLabel}
              value={editDraft.name}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
              onClick={(e) => e.stopPropagation()}
            />
            <select
              value={editDraft.visibility}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, visibility: e.target.value as StorylineDataType }))}
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
      );
    }

    return (
      <div key={f.id}>
        <div
          className={`sl-folder-row ${f.id === activeId ? 'active' : ''}`}
          style={{ paddingLeft: indent }}
          onClick={() => openFolder(f)}
        >
          <button
            className="sl-folder-chevron-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(f.id);
            }}
            title={isExpanded ? '收起模板列表' : '展开模板列表'}
          >
            <svg
              className="sl-folder-chevron"
              width="12"
              height="12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}
            >
              <path d="M9 6l6 6-6 6"></path>
            </svg>
          </button>
          <FolderIcon
            size={14}
            color={f.id === activeId ? '#4F46E5' : '#94A3B8'}
            style={{ flexShrink: 0 }}
          />
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
            {countItems(normalize(f.state))}
          </span>
          <button className="sl-folder-add" onClick={(e) => startEdit(f, e)} title="编辑文件夹信息">
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5"></path>
              <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button className="sl-folder-add" onClick={(e) => duplicateFolder(f, e)} title="复制文件夹">
            <CopyIcon size={11} />
          </button>
          <button className="sl-folder-add danger" onClick={(e) => deleteFolder(f, e)} title="删除文件夹">
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        {isExpanded && (
          <div className="sl-folder-children">
            {listTemplates &&
              listTemplates(normalize(f.state)).map((item) => (
                <div
                  className="sl-template-preview-row"
                  key={item.id}
                  style={{ paddingLeft: indent + 16, cursor: onTemplateClick ? 'pointer' : undefined }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTemplateClick?.(f, item.id);
                  }}
                >
                  <span className="sl-template-preview-icon">
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                      <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                      <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                      <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                    </svg>
                  </span>
                  <span className="sl-template-preview-label" title={item.label}>
                    {item.label}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    const onMouseMove = (ev: MouseEvent) => {
      const next = Math.min(480, Math.max(200, startWidth + ev.clientX - startX));
      setWidth(next);
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setWidth((w) => {
        localStorage.setItem(storageKey + ':width', String(w));
        return w;
      });
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
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

  // Flat folder list — legacy nested folders (from the removed subfolder feature)
  // surface at the top level instead of disappearing.
  const topLevel = folders.filter(matchesFilter);

  return (
    <div
      className="sl-sidebar"
      style={{ ['--sl-sidebar-w' as string]: `${width}px`, position: 'relative' } as React.CSSProperties}
    >
      <div className="sl-sidebar-resize-handle" onMouseDown={startResize} title="拖动调整宽度" />
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

        <div className="sl-folders-head">
          <span>FOLDERS</span>
          <button className="sl-sidebar-toggle" onClick={startNew} title="新建文件夹">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </button>
        </div>

        <div className="sl-folder-list">
          {topLevel.length === 0 && <div className="sl-folder-empty">暂无文件夹</div>}
          {topLevel.map((f) => renderFolderNode(f))}
        </div>

        {showTemplateCatalog && (
          <>
        <div className="sl-folders-head" style={{ marginTop: 16 }}>
          <span>TEMPLATES</span>
          <button className="sl-sidebar-toggle" onClick={startNewTemplate} title="新建模板">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </button>
        </div>

        <div className="sl-folder-list">
          {templates.length === 0 && <div className="sl-folder-empty">暂无模板</div>}
          {templates.map((t) =>
            editingTemplateId === t.id ? (
              <div className="sl-folder-row sl-folder-row-edit" key={t.id}>
                <div className="sl-folder-edit-fields">
                  <input
                    type="text"
                    placeholder="模板名称"
                    value={templateDraft.name}
                    onChange={(e) => setTemplateDraft((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Template ID，如 motz7cum6ntsj6"
                    value={templateDraft.templateId}
                    onChange={(e) => setTemplateDraft((prev) => ({ ...prev, templateId: e.target.value }))}
                  />
                  <select
                    value={templateDraft.folderId || ''}
                    onChange={(e) => setTemplateDraft((prev) => ({ ...prev, folderId: e.target.value || null }))}
                  >
                    <option value="">不属于任何文件夹</option>
                    {folders.map((f) => (
                      <option value={f.id} key={f.id}>
                        {folderPath(folders, f.id)}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="sl-folder-add" onClick={() => saveEditTemplate(t)} title="保存">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </button>
                <button className="sl-folder-add" onClick={cancelEditTemplate} title="取消">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="sl-folder-row" key={t.id} onClick={() => startEditTemplate(t)}>
                <span className="sl-folder-name" title={t.templateId}>
                  {t.name}
                </span>
                <span className="sl-folder-meta">{t.folderId ? folderPath(folders, t.folderId) : '未归类'}</span>
                <button
                  className="sl-folder-add danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTemplateRow(t);
                  }}
                  title="删除模板"
                >
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            )
          )}
        </div>
          </>
        )}
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
