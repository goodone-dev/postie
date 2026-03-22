import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, Plus, Search, FolderOpen, Folder,
  Clock, Star, MoreHorizontal, Download, FolderPlus, Copy,
  Trash2, Pencil, Globe, File, ArrowRight
} from 'lucide-react';
import { METHOD_COLORS } from '../../mock';
import {
  ListCollections, CreateCollection, RenameCollection, UpdateCollectionFavorite,
  DeleteCollection, DuplicateCollection, MoveCollection,
  CreateEnvironment, UpdateEnvironment, DeleteEnvironment, DuplicateEnvironment,
  CreateFolder, RenameFolder, DeleteFolder, DuplicateFolder
} from '../../wailsjs/go/main/App';

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const cloneItem = (item) => ({
  ...item, id: uid(), name: `${item.name} (copy)`,
  ...(item.items ? { items: item.items.map(cloneItem) } : {}),
  ...(item.examples ? { examples: item.examples.map(ex => ({ ...ex, id: uid() })) } : {})
});

/* ─── CONFIRM MODAL ──────────────────────────────────────────── */
const ConfirmModal = ({ title, message, onConfirm, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{ width: 340, background: '#1e1e1e', border: '1px solid #3d3d3d', borderRadius: 8, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.7)' }}>
      <div style={{ color: '#e0e0e0', fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{title}</div>
      <div style={{ color: '#888', fontSize: 12, lineHeight: 1.6, marginBottom: 18 }}>{message}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose}
          style={{ background: 'none', border: '1px solid #3d3d3d', borderRadius: 4, padding: '6px 16px', color: '#ccc', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#666'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#3d3d3d'; }}
        >Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }}
          style={{ background: '#f93e3e', border: 'none', borderRadius: 4, padding: '6px 16px', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, transition: 'background .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#d93030'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f93e3e'; }}
        >Delete</button>
      </div>
    </div>
  </div>
);

/* ─── MOVE TO WORKSPACE MODAL ────────────────────────────────── */
const MoveModal = ({ collection, workspaces, currentWorkspaceId, onMove, onClose }) => {
  const [selectedId, setSelectedId] = useState('');
  const others = workspaces.filter(w => w.id !== currentWorkspaceId);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 360, background: '#1e1e1e', border: '1px solid #3d3d3d', borderRadius: 8, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.7)' }}>
        <div style={{ color: '#e0e0e0', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Move to Another Workspace</div>
        <div style={{ color: '#888', fontSize: 12, marginBottom: 16 }}>Move <b style={{ color: '#e8a87c' }}>«{collection.name}»</b> to:</div>
        {others.length === 0 ? (
          <div style={{ color: '#666', fontSize: 12, padding: '12px 0' }}>No other workspaces available.</div>
        ) : (
          <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #2d2d2d', borderRadius: 6, marginBottom: 16 }}>
            {others.map(ws => (
              <div key={ws.id}
                onClick={() => setSelectedId(ws.id)}
                style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: selectedId === ws.id ? 'rgba(255,108,55,0.12)' : 'transparent', borderLeft: selectedId === ws.id ? '2px solid #FF6C37' : '2px solid transparent', transition: 'background .1s' }}
                onMouseEnter={e => { if (selectedId !== ws.id) e.currentTarget.style.background = '#2a2a2a'; }}
                onMouseLeave={e => { if (selectedId !== ws.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: selectedId === ws.id ? '#FF6C37' : '#2d2d2d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{ws.name.charAt(0)}</span>
                </div>
                <span style={{ color: '#e0e0e0', fontSize: 12 }}>{ws.name}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ background: 'none', border: '1px solid #3d3d3d', borderRadius: 4, padding: '6px 16px', color: '#ccc', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#666'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#3d3d3d'; }}
          >Cancel</button>
          <button onClick={() => { if (selectedId) { onMove(selectedId); onClose(); } }}
            disabled={!selectedId}
            style={{ background: selectedId ? '#FF6C37' : '#555', border: 'none', borderRadius: 4, padding: '6px 16px', color: '#fff', fontSize: 12, cursor: selectedId ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'background .15s' }}
            onMouseEnter={e => { if (selectedId) e.currentTarget.style.background = '#e55a28'; }}
            onMouseLeave={e => { if (selectedId) e.currentTarget.style.background = '#FF6C37'; }}
          ><ArrowRight size={13} />Move</button>
        </div>
      </div>
    </div>
  );
};

/* ─── CONTEXT MENU ────────────────────────────────────────────── */
const CtxMenu = ({ x, y, items, onClose }) => {
  useEffect(() => {
    const close = () => onClose();
    setTimeout(() => document.addEventListener('click', close), 0);
    return () => document.removeEventListener('click', close);
  }, [onClose]);
  return (
    <div style={{ position: 'fixed', left: x, top: y, zIndex: 9999, background: '#2a2a2a', border: '1px solid #3d3d3d', borderRadius: 6, width: 190, boxShadow: '0 6px 24px rgba(0,0,0,.6)', overflow: 'hidden' }}>
      {items.map((item, i) =>
        item === 'sep' ? <div key={i} style={{ height: 1, background: '#333', margin: '3px 0' }} /> : (
          <button key={i} onClick={() => { item.action(); onClose(); }}
            style={{ width: '100%', background: 'none', border: 'none', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, color: item.danger ? '#f93e3e' : '#ccc', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .1s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#3d3d3d'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >{item.icon}{item.label}</button>
        )
      )}
    </div>
  );
};

/* ─── INLINE EDIT INPUT ───────────────────────────────────────── */
const InlineInput = ({ value, onChange, onCommit, onCancel, extraStyle = {} }) => (
  <input autoFocus value={value}
    onChange={e => onChange(e.target.value)}
    onBlur={onCommit}
    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); onCommit(); } if (e.key === 'Escape') { e.preventDefault(); onCancel(); } }}
    onClick={e => e.stopPropagation()}
    style={{
      background: 'transparent', border: 'none', outline: 'none',
      boxShadow: '0 1px 0 #FF6C37',
      color: '#e0e0e0', fontSize: 12, fontWeight: 500,
      flex: 1, minWidth: 0, fontFamily: 'inherit', padding: 0, margin: 0,
      lineHeight: 'inherit', display: 'block',
      ...extraStyle,
    }}
  />
);

/* ─── ENVIRONMENT PANEL ───────────────────────────────────────── */
const EnvironmentPanel = ({ environments, setEnvironments, onOpenEnv, activeTabId, activeWorkspaceId }) => {
  const [search, setSearch] = useState('');
  const [ctx, setCtx] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [inlineEdit, setInlineEdit] = useState(null);
  const fileRef = useRef();

  const filtered = environments.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const addEnv = () => {
    if (!activeWorkspaceId) return;
    const name = `New Environment ${environments.length + 1}`;
    CreateEnvironment({ workspace_id: activeWorkspaceId, name: name, variables: [{ id: uid(), key: '', value: '', enabled: true }] })
      .then(env => {
        if (env) {
          setEnvironments(prev => [...prev, env]);
          onOpenEnv(env);
          setTimeout(() => setInlineEdit({ id: env.id, value: env.name }), 50);
        }
      })
      .catch(console.error);
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result);
        const name = data.name || file.name.replace('.json', '');
        const variables = (data.values || data.variables || []).map(v => ({ id: uid(), key: v.key || v.name || '', value: v.value || '', enabled: v.enabled !== false }));
        CreateEnvironment({ workspace_id: activeWorkspaceId, name, variables })
          .then(env => {
            if (env) setEnvironments(prev => [...prev, env]);
          })
          .catch(console.error);
      } catch { alert('Invalid environment file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const commitEdit = (env) => {
    if (inlineEdit?.value?.trim() && inlineEdit.value.trim() !== env.name) {
      UpdateEnvironment(env.id, { name: inlineEdit.value.trim(), variables: env.variables || [] })
        .then(updated => {
          if (updated) setEnvironments(prev => prev.map(e => e.id === env.id ? updated : e));
        })
        .catch(console.error);
    }
    setInlineEdit(null);
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
      {confirmDel && <ConfirmModal {...confirmDel} onClose={() => setConfirmDel(null)} />}
      <div style={{ padding: '8px', display: 'flex', gap: 5, borderBottom: '1px solid #383838' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            style={{ width: '100%', background: '#1e1e1e', border: '1px solid #3d3d3d', borderRadius: 4, padding: '5px 8px 5px 26px', color: '#e0e0e0', fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <button onClick={addEnv} title="New Environment" data-testid="new-env-btn"
          style={{ background: '#FF6C37', border: 'none', borderRadius: 4, padding: '5px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', transition: 'background .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e55a28'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FF6C37'; }}
        ><Plus size={14} /></button>
        <button onClick={() => fileRef.current?.click()} title="Import Environment"
          style={{ background: '#2d2d2d', border: 'none', borderRadius: 4, padding: '5px 8px', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#6bc5f8'; e.currentTarget.style.background = '#363636'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.background = '#2d2d2d'; }}
        ><Download size={14} /></button>
      </div>
      {ctx && <CtxMenu x={ctx.x} y={ctx.y} items={ctx.items} onClose={() => setCtx(null)} />}
      <div>
        {filtered.map(env => {
          const isActive = activeTabId === `envtab-${env.id}`;
          const isEditing = inlineEdit?.id === env.id;
          return (
            <div key={env.id}
              onClick={() => !isEditing && onOpenEnv(env)}
              onContextMenu={e => {
                e.preventDefault();
                setCtx({
                  x: e.clientX, y: e.clientY, items: [
                    { icon: <Pencil size={12} />, label: 'Rename', action: () => setInlineEdit({ id: env.id, value: env.name }) },
                    {
                      icon: <Copy size={12} />, label: 'Duplicate', action: () => {
                        DuplicateEnvironment(env.id).then(dup => {
                          if (dup) setEnvironments(prev => { const idx = prev.findIndex(e => e.id === env.id); const res = [...prev]; res.splice(idx + 1, 0, dup); return res; });
                        }).catch(console.error);
                      }
                    },
                    {
                      icon: <Trash2 size={12} />, label: 'Delete', danger: true, action: () => setConfirmDel({
                        title: 'Delete Environment', message: `Delete "${env.name}"? This cannot be undone.`, onConfirm: () => {
                          DeleteEnvironment(env.id).then(() => {
                            setEnvironments(prev => prev.filter(e => e.id !== env.id));
                          }).catch(console.error);
                        }
                      })
                    },
                  ]
                });
              }}
              style={{ padding: '9px 10px', cursor: 'pointer', borderBottom: '1px solid #2d2d2d', display: 'flex', alignItems: 'center', gap: 8, background: isActive ? 'rgba(255,108,55,0.08)' : 'transparent', borderLeft: isActive ? '2px solid #FF6C37' : '2px solid transparent', transition: 'background .1s' }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#333'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 6, background: isActive ? '#FF6C37' : '#2d2d2d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #3d3d3d' }}>
                <Globe size={12} style={{ color: isActive ? '#fff' : '#888' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <InlineInput value={inlineEdit.value} onChange={v => setInlineEdit(p => ({ ...p, value: v }))} onCommit={() => commitEdit(env)} onCancel={() => setInlineEdit(null)}
                    extraStyle={{ height: '15px', lineHeight: '15px' }} />
                ) : (
                  <div onDoubleClick={e => { e.stopPropagation(); setInlineEdit({ id: env.id, value: env.name }); }}
                    style={{ color: '#e0e0e0', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', height: '15px', lineHeight: '15px' }}>{env.name}</div>
                )}
                <div style={{ color: '#666', fontSize: 10 }}>{env.variables.filter(v => v.key).length} variable{env.variables.filter(v => v.key).length !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={e => {
                e.stopPropagation(); setCtx({
                  x: e.clientX, y: e.clientY, items: [
                    { icon: <Pencil size={12} />, label: 'Rename', action: () => setInlineEdit({ id: env.id, value: env.name }) },
                    {
                      icon: <Copy size={12} />, label: 'Duplicate', action: () => {
                        DuplicateEnvironment(env.id).then(dup => {
                          if (dup) setEnvironments(prev => { const idx = prev.findIndex(e => e.id === env.id); const res = [...prev]; res.splice(idx + 1, 0, dup); return res; });
                        }).catch(console.error);
                      }
                    },
                    {
                      icon: <Trash2 size={12} />, label: 'Delete', danger: true, action: () => setConfirmDel({
                        title: 'Delete Environment', message: `Delete "${env.name}"? This cannot be undone.`, onConfirm: () => {
                          DeleteEnvironment(env.id).then(() => {
                            setEnvironments(prev => prev.filter(e => e.id !== env.id));
                          }).catch(console.error);
                        }
                      })
                    },
                  ]
                });
              }}
                style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', padding: 2, flexShrink: 0, transition: 'color .1s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#aaa'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
              ><MoreHorizontal size={12} /></button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <Globe size={32} style={{ color: '#444', margin: '0 auto 10px', display: 'block' }} />
            <p style={{ color: '#666', fontSize: 12 }}>No environments yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── SIDEBAR ─────────────────────────────────────────────────── */
const Sidebar = ({ onSelectRequest, activeRequestId, activeEnvTabIds, onOpenEnv, environments, setEnvironments, activeTabId, activeWorkspaceId, workspaces }) => {
  const [activeTab, setActiveTab] = useState('collections');
  // collections: backend data merged with local UI state (isOpen, items)
  const [collections, setCollections] = useState([]);
  const [colLoading, setColLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ctx, setCtx] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [moveModal, setMoveModal] = useState(null); // { collection }
  const [inlineEdit, setInlineEdit] = useState(null); // { id, value, onCommit }
  const [expandedExamples, setExpandedExamples] = useState({});
  const [drag, setDrag] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const importFileRef = useRef();
  const importFolderRef = useRef();
  const importMenuRef = useRef();

  // Set webkitdirectory on folder ref
  useEffect(() => {
    if (importFolderRef.current) importFolderRef.current.webkitdirectory = true;
  }, []);

  // Fetch collections from backend whenever workspace changes
  const fetchCollections = useCallback(() => {
    if (!activeWorkspaceId) return;
    setCollections([]);   // clear stale collections immediately
    setColLoading(true);
    ListCollections(activeWorkspaceId)
      .then(data => {
        if (data) {
          setCollections(data.map(col => ({
            ...col,
            isOpen: false,
            isFavorite: col.is_favorite ?? false,
            items: col.items || [],
          })));
        }
      })
      .catch(err => console.error('Failed to fetch collections:', err))
      .finally(() => setColLoading(false));
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Close import menu on outside click
  useEffect(() => {
    if (!showImportMenu) return;
    const handle = (e) => { if (importMenuRef.current && !importMenuRef.current.contains(e.target)) setShowImportMenu(false); };
    setTimeout(() => document.addEventListener('click', handle), 0);
    return () => document.removeEventListener('click', handle);
  }, [showImportMenu]);


  /* ── inline edit ─── */
  const startEdit = (id, value, onCommit) => setInlineEdit({ id, value, onCommit });
  const commitEdit = () => { if (inlineEdit?.value?.trim()) inlineEdit.onCommit(inlineEdit.value.trim()); setInlineEdit(null); };

  /* ── deep mutate helpers ─── */
  // Recursively map items inside any depth
  const mapItems = (colId, fn) => setCollections(prev => prev.map(c => c.id !== colId ? c : { ...c, items: fn(c.items) }));

  const mapDeepItems = (colId, folId, fn) => {
    const recurse = (items) => items.map(it => {
      if (it.id === folId) return { ...it, items: fn(it.items) };
      if (it.type === 'folder' && it.items) return { ...it, items: recurse(it.items) };
      return it;
    });
    setCollections(prev => prev.map(c => c.id !== colId ? c : { ...c, items: recurse(c.items) }));
  };

  const updateItemById = (colId, targetId, updater) => {
    const recurse = (items) => items.map(it => {
      if (it.id === targetId) return updater(it);
      if (it.items) return { ...it, items: recurse(it.items) };
      return it;
    });
    setCollections(prev => prev.map(c => c.id !== colId ? c : { ...c, items: recurse(c.items) }));
  };

  const deleteItemById = (colId, targetId) => {
    const recurse = (items) => {
      const filtered = items.filter(it => it.id !== targetId);
      return filtered.map(it => it.items ? { ...it, items: recurse(it.items) } : it);
    };
    setCollections(prev => prev.map(c => c.id !== colId ? c : { ...c, items: recurse(c.items) }));
  };

  const insertAfterById = (colId, targetId, newItem) => {
    const recurse = (items) => {
      const idx = items.findIndex(it => it.id === targetId);
      if (idx !== -1) {
        const arr = [...items];
        arr.splice(idx + 1, 0, newItem);
        return arr;
      }
      return items.map(it => it.items ? { ...it, items: recurse(it.items) } : it);
    };
    setCollections(prev => prev.map(c => c.id !== colId ? c : { ...c, items: recurse(c.items) }));
  };

  const toggleColOpen = (colId) => setCollections(prev => prev.map(c => c.id === colId ? { ...c, isOpen: !c.isOpen } : c));
  const toggleFolOpen = (colId, folId) => updateItemById(colId, folId, fol => ({ ...fol, isOpen: !fol.isOpen }));
  const toggleFav = (col) => {
    const newVal = !col.isFavorite;
    setCollections(prev => prev.map(c => c.id === col.id ? { ...c, isFavorite: newVal } : c));
    UpdateCollectionFavorite(col.id, newVal).catch(console.error);
  };


  /* ── drag & drop ─── */
  const onDragStart = (e, info) => { setDrag(info); e.dataTransfer.effectAllowed = 'move'; e.stopPropagation(); };
  const onDragOver = (e, info) => { e.preventDefault(); e.stopPropagation(); setDragOver(info); };
  const onDragEnd = () => { setDrag(null); setDragOver(null); };

  const onDrop = (e, targetInfo) => {
    e.preventDefault(); e.stopPropagation();
    if (!drag || drag.id === targetInfo.id || drag.colId !== targetInfo.colId) { onDragEnd(); return; }
    const colId = drag.colId;
    setCollections(prev => prev.map(col => {
      if (col.id !== colId) return col;
      // Extract dragged item
      let draggedItem = null;
      const extract = (items) => items.filter(it => { if (it.id === drag.id) { draggedItem = it; return false; } return true; });
      let newItems = drag.folId
        ? col.items.map(it => it.id !== drag.folId ? it : { ...it, items: extract(it.items) })
        : extract(col.items);
      if (!draggedItem) return col;
      // Insert at target
      if (targetInfo.type === 'inside') {
        newItems = newItems.map(it => it.id !== targetInfo.id ? it : { ...it, items: [...it.items, draggedItem] });
      } else if (targetInfo.folId) {
        newItems = newItems.map(it => {
          if (it.id !== targetInfo.folId) return it;
          const idx = it.items.findIndex(sub => sub.id === targetInfo.id);
          const arr = [...it.items];
          if (idx !== -1) arr.splice(idx, 0, draggedItem); else arr.push(draggedItem);
          return { ...it, items: arr };
        });
      } else {
        const idx = newItems.findIndex(it => it.id === targetInfo.id);
        const arr = [...newItems];
        if (idx !== -1) arr.splice(idx, 0, draggedItem); else arr.push(draggedItem);
        newItems = arr;
      }
      return { ...col, items: newItems };
    }));
    onDragEnd();
  };

  /* ── import ─── */
  const parseCollection = (data, fileName) => {
    const collectionName = data.info?.name || fileName;
    const localItems = (data.item || []).filter(it => it.request).map(it => ({
      type: 'request', id: uid(), name: it.name || 'Request', method: it.request?.method || 'GET',
      url: (typeof it.request?.url === 'string' ? it.request.url : it.request?.url?.raw) || '',
      headers: (it.request?.header || []).map(h => ({ key: h.key, value: h.value, enabled: !h.disabled })),
      params: [], pathVariables: [],
      body: { type: 'none', rawType: 'JSON', raw: it.request?.body?.raw || '', formData: [], urlEncoded: [] },
      auth: { type: 'none' }, examples: []
    }));
    if (activeWorkspaceId) {
      CreateCollection({ workspace_id: activeWorkspaceId, name: collectionName })
        .then(col => {
          if (col) setCollections(prev => [...prev, { ...col, isOpen: true, isFavorite: col.is_favorite ?? false, items: localItems }]);
        })
        .catch(() => {
          const fallback = { id: uid(), name: collectionName, isOpen: true, isFavorite: false, items: localItems };
          setCollections(prev => [...prev, fallback]);
        });
    } else {
      const col = { id: uid(), name: collectionName, isOpen: true, isFavorite: false, items: localItems };
      setCollections(prev => [...prev, col]);
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => { try { parseCollection(JSON.parse(evt.target.result), file.name.replace('.json', '')); } catch { alert('Invalid collection file.'); } };
    reader.readAsText(file); e.target.value = '';
  };

  const handleImportFolder = (e) => {
    Array.from(e.target.files).filter(f => f.name.endsWith('.json')).forEach(file => {
      const reader = new FileReader();
      reader.onload = evt => { try { const d = JSON.parse(evt.target.result); if (d.info || d.item) parseCollection(d, file.name.replace('.json', '')); } catch { } };
      reader.readAsText(file);
    }); e.target.value = '';
  };

  /* ── collection context menu ─── */
  const colMenu = (col, e) => {
    e.stopPropagation();
    setCtx({
      x: e.clientX, y: e.clientY, items: [
        {
          icon: <FolderPlus size={12} />, label: 'Add Folder',
          action: () => {
            CreateFolder({ collection_id: col.id, parent_id: null, name: 'New Folder' })
              .then(f => {
                if (f) setCollections(prev => prev.map(c => c.id !== col.id ? c : { ...c, isOpen: true, items: [...c.items, { type: 'folder', id: f.id, name: f.name, isOpen: true, items: [] }] }));
              })
              .catch(console.error);
          }
        },
        {
          icon: <Plus size={12} />, label: 'Add Request',
          action: () => setCollections(prev => prev.map(c => c.id !== col.id ? c : { ...c, isOpen: true, items: [...c.items, { type: 'request', id: uid(), name: 'New Request', method: 'GET', url: '', headers: [], params: [], pathVariables: [], body: { type: 'none', rawType: 'JSON', raw: '', formData: [], urlEncoded: [] }, auth: { type: 'none' }, examples: [] }] }))
        },
        'sep',
        {
          icon: <Pencil size={12} />, label: 'Rename',
          action: () => startEdit(col.id, col.name, name => {
            RenameCollection(col.id, name)
              .then(updated => {
                if (updated) setCollections(prev => prev.map(c => c.id === col.id ? { ...c, name: updated.name } : c));
              })
              .catch(console.error);
          })
        },
        {
          icon: <Copy size={12} />, label: 'Duplicate',
          action: () => {
            DuplicateCollection(col.id)
              .then(newCol => {
                if (newCol) {
                  const cloned = { ...newCol, isOpen: false, isFavorite: newCol.is_favorite ?? false, items: [] };
                  setCollections(prev => {
                    const idx = prev.findIndex(c => c.id === col.id);
                    const arr = [...prev];
                    arr.splice(idx + 1, 0, cloned);
                    return arr;
                  });
                }
              })
              .catch(console.error);
          }
        },
        {
          icon: <Trash2 size={12} />, label: 'Delete', danger: true,
          action: () => setConfirmDel({
            title: 'Delete Collection',
            message: `Delete "${col.name}"? All requests will be permanently lost.`,
            onConfirm: () => {
              DeleteCollection(col.id)
                .then(() => setCollections(prev => prev.filter(c => c.id !== col.id)))
                .catch(console.error);
            }
          })
        },
        'sep',
        {
          icon: <ArrowRight size={12} />, label: 'Move',
          action: () => setMoveModal({ collection: col })
        }
      ]
    });
  };


  const folMenu = (col, fol, e) => {
    e.stopPropagation();
    setCtx({
      x: e.clientX, y: e.clientY, items: [
        { icon: <Plus size={12} />, label: 'Add Request', action: () => mapDeepItems(col.id, fol.id, items => [...items, { type: 'request', id: uid(), name: 'New Request', method: 'GET', url: '', headers: [], params: [], pathVariables: [], body: { type: 'none', rawType: 'JSON', raw: '', formData: [], urlEncoded: [] }, auth: { type: 'none' }, examples: [] }]) },
        {
          icon: <FolderPlus size={12} />, label: 'Add Folder', action: () => {
            CreateFolder({ collection_id: col.id, parent_id: fol.id, name: 'New Folder' })
              .then(f => {
                if (f) mapDeepItems(col.id, fol.id, items => [...items, { type: 'folder', id: f.id, name: f.name, isOpen: true, items: [] }]);
              })
              .catch(console.error);
          }
        },
        'sep',
        {
          icon: <Pencil size={12} />, label: 'Rename', action: () => startEdit(fol.id, fol.name, name => {
            RenameFolder(fol.id, { name })
              .then(updated => {
                if (updated) updateItemById(col.id, fol.id, it => ({ ...it, name: updated.name }));
              })
              .catch(console.error);
          })
        },
        {
          icon: <Copy size={12} />, label: 'Duplicate', action: () => {
            DuplicateFolder(fol.id)
              .then(dup => {
                if (dup) insertAfterById(col.id, fol.id, cloneItem({ ...fol, id: dup.id, name: dup.name }));
              })
              .catch(console.error);
          }
        },
        {
          icon: <Trash2 size={12} />, label: 'Delete', danger: true, action: () => setConfirmDel({
            title: 'Delete Folder', message: `Delete "${fol.name}" and its ${fol.items?.length || 0} item(s)?`, onConfirm: () => {
              DeleteFolder(fol.id)
                .then(() => deleteItemById(col.id, fol.id))
                .catch(console.error);
            }
          })
        }
      ]
    });
  };

  const reqMenu = (col, req, folId, e) => {
    e.stopPropagation();
    const updateReq = fn => folId ? mapDeepItems(col.id, folId, fn) : mapItems(col.id, fn);
    setCtx({
      x: e.clientX, y: e.clientY, items: [
        { icon: <Pencil size={12} />, label: 'Rename', action: () => startEdit(req.id, req.name, name => updateReq(items => items.map(it => it.id === req.id ? { ...it, name } : it))) },
        { icon: <Copy size={12} />, label: 'Duplicate', action: () => updateReq(items => { const idx = items.findIndex(it => it.id === req.id); const arr = [...items]; arr.splice(idx + 1, 0, cloneItem(req)); return arr; }) },
        'sep',
        { icon: <Trash2 size={12} />, label: 'Delete', danger: true, action: () => setConfirmDel({ title: 'Delete Request', message: `Delete "${req.name}"?`, onConfirm: () => updateReq(items => items.filter(it => it.id !== req.id)) }) }
      ]
    });
  };

  const exMenu = (col, req, folId, ex, e) => {
    e.stopPropagation();
    const updateEx = fn => folId
      ? mapDeepItems(col.id, folId, items => items.map(it => it.id === req.id ? { ...it, examples: fn(it.examples) } : it))
      : mapItems(col.id, items => items.map(it => it.id === req.id ? { ...it, examples: fn(it.examples) } : it));
    setCtx({
      x: e.clientX, y: e.clientY, items: [
        { icon: <Pencil size={12} />, label: 'Rename', action: () => startEdit(ex.id, ex.name, name => updateEx(exs => exs.map(x => x.id === ex.id ? { ...x, name } : x))) },
        { icon: <Copy size={12} />, label: 'Duplicate', action: () => updateEx(exs => { const idx = exs.findIndex(x => x.id === ex.id); const arr = [...exs]; arr.splice(idx + 1, 0, { ...ex, id: uid(), name: `${ex.name} (copy)` }); return arr; }) },
        'sep',
        { icon: <Trash2 size={12} />, label: 'Delete', danger: true, action: () => setConfirmDel({ title: 'Delete Example', message: `Delete "${ex.name}"?`, onConfirm: () => updateEx(exs => exs.filter(x => x.id !== ex.id)) }) }
      ]
    });
  };

  /* ── render request row ─── */
  const renderRequest = (col, req, folId, depth = 0) => {
    const hasExamples = req.examples && req.examples.length > 0;
    const exOpen = expandedExamples[req.id];
    const isDragTarget = dragOver?.id === req.id && dragOver?.type === 'before';
    const isDragging = drag?.id === req.id;
    const isEditing = inlineEdit?.id === req.id;
    return (
      <React.Fragment key={req.id}>
        <div
          draggable={!isEditing}
          onDragStart={e => onDragStart(e, { id: req.id, type: 'request', colId: col.id, folId })}
          onDragOver={e => onDragOver(e, { id: req.id, type: 'before', colId: col.id, folId })}
          onDrop={e => onDrop(e, { id: req.id, type: 'before', colId: col.id, folId })}
          onDragEnd={onDragEnd}
          onClick={() => !isEditing && onSelectRequest(req)}
          onContextMenu={e => { e.preventDefault(); reqMenu(col, req, folId, e); }}
          style={{
            display: 'flex', alignItems: 'center', padding: `5px 8px 5px ${depth === 0 ? 16 : 28}px`,
            cursor: 'pointer', gap: 5,
            background: isDragTarget ? 'rgba(255,108,55,0.1)' : activeRequestId === req.id ? 'rgba(255,108,55,0.12)' : 'transparent',
            borderLeft: activeRequestId === req.id ? '2px solid #FF6C37' : '2px solid transparent',
            borderTop: isDragTarget ? '2px solid #FF6C37' : '1px solid transparent',
            opacity: isDragging ? 0.35 : 1, transition: 'background .1s'
          }}
          onMouseEnter={e => { if (activeRequestId !== req.id && !isDragTarget) e.currentTarget.style.background = '#333'; }}
          onMouseLeave={e => { if (activeRequestId !== req.id && !isDragTarget) e.currentTarget.style.background = 'transparent'; }}
        >
          <button onClick={e => { e.stopPropagation(); if (hasExamples) setExpandedExamples(p => ({ ...p, [req.id]: !p[req.id] })); }}
            style={{ background: 'none', border: 'none', color: hasExamples ? '#777' : 'transparent', cursor: hasExamples ? 'pointer' : 'default', padding: 1, display: 'flex', flexShrink: 0 }}>
            {hasExamples ? (exOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />) : <ChevronRight size={11} style={{ opacity: 0 }} />}
          </button>
          <span style={{ fontSize: 10, fontWeight: 700, color: METHOD_COLORS[req.method] || '#999', minWidth: 34, letterSpacing: '.3px' }}>{req.method.substring(0, 4)}</span>
          {isEditing ? (
            <InlineInput value={inlineEdit.value} onChange={v => setInlineEdit(p => ({ ...p, value: v }))} onCommit={commitEdit} onCancel={() => setInlineEdit(null)} />
          ) : (
            <span
              onDoubleClick={e => { e.stopPropagation(); const fn = items => items.map(it => it.id === req.id ? { ...it, name: inlineEdit?.value || it.name } : it); startEdit(req.id, req.name, name => { folId ? mapDeepItems(col.id, folId, items => items.map(it => it.id === req.id ? { ...it, name } : it)) : mapItems(col.id, items => items.map(it => it.id === req.id ? { ...it, name } : it)); }); }}
              style={{ color: '#ccc', fontSize: 12, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >{req.name}</span>
          )}
          <button onClick={e => { e.stopPropagation(); reqMenu(col, req, folId, e); }}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', padding: 2, flexShrink: 0, opacity: 0, transition: 'all .1s' }}
            className="req-menu-btn"
          ><MoreHorizontal size={12} /></button>
        </div>
        {exOpen && hasExamples && req.examples.map(ex => (
          <div key={ex.id}
            onContextMenu={e => { e.preventDefault(); exMenu(col, req, folId, ex, e); }}
            onClick={() => onSelectRequest({ ...req, name: ex.name, _exampleId: ex.id })}
            style={{ display: 'flex', alignItems: 'center', padding: `4px 8px 4px ${depth === 0 ? 36 : 48}px`, cursor: 'pointer', gap: 6, transition: 'background .1s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2d2d2d'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, color: ex.status >= 200 && ex.status < 300 ? '#49cc90' : '#f93e3e', minWidth: 34 }}>{ex.status || '—'}</span>
            {inlineEdit?.id === ex.id ? (
              <InlineInput value={inlineEdit.value} onChange={v => setInlineEdit(p => ({ ...p, value: v }))} onCommit={commitEdit} onCancel={() => setInlineEdit(null)} extraStyle={{ fontSize: 11 }} />
            ) : (
              <span
                onDoubleClick={e => { e.stopPropagation(); startEdit(ex.id, ex.name, name => { const fn = items => items.map(it => it.id === req.id ? { ...it, examples: it.examples.map(x => x.id === ex.id ? { ...x, name } : x) } : it); folId ? mapDeepItems(col.id, folId, fn) : mapItems(col.id, fn); }); }}
                style={{ color: '#aaa', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >{ex.name}</span>
            )}
            <button onClick={e => { e.stopPropagation(); exMenu(col, req, folId, ex, e); }}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', padding: 2, flexShrink: 0, opacity: 0, transition: 'all .1s' }}
              className="req-menu-btn"
            ><MoreHorizontal size={11} /></button>
          </div>
        ))}
      </React.Fragment>
    );
  };

  const renderNode = (col, item, folId = null, depth = 0) => {
    if (item.type === 'folder') {
      const isDragInside = dragOver?.id === item.id && dragOver?.type === 'inside';
      const isFolDragging = drag?.id === item.id;
      const isFolDragTarget = dragOver?.id === item.id && dragOver?.type === 'before';
      const isEditing = inlineEdit?.id === item.id;
      return (
        <div key={item.id}
          draggable={!isEditing}
          onDragStart={e => onDragStart(e, { id: item.id, type: 'folder', colId: col.id, folId })}
          onDragEnd={onDragEnd}
        >
          <div
            onContextMenu={e => { e.preventDefault(); folMenu(col, item, e); }}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver({ id: item.id, type: 'inside', colId: col.id, folId }); }}
            onDrop={e => onDrop(e, { id: item.id, type: 'inside', colId: col.id, folId })}
            style={{ display: 'flex', alignItems: 'center', padding: `6px 8px 6px ${depth * 12 + 20}px`, cursor: 'pointer', borderBottom: '1px solid #2d2d2d', gap: 5, transition: 'background .1s', background: isDragInside ? 'rgba(255,108,55,0.12)' : 'transparent', borderTop: isFolDragTarget ? '2px solid #FF6C37' : undefined, outline: isDragInside ? '1px solid rgba(255,108,55,0.4)' : undefined, opacity: isFolDragging ? 0.35 : 1 }}
            onMouseEnter={e => { if (!isDragInside) e.currentTarget.style.background = '#2e2e2e'; }}
            onMouseLeave={e => { if (!isDragInside) e.currentTarget.style.background = 'transparent'; }}
          >
            <span onClick={() => toggleFolOpen(col.id, item.id)} style={{ color: '#777', display: 'flex', flexShrink: 0 }}>
              {item.isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
            <span onClick={() => toggleFolOpen(col.id, item.id)} style={{ color: '#e8a87c', display: 'flex', flexShrink: 0 }}>
              {item.isOpen ? <FolderOpen size={12} /> : <Folder size={12} />}
            </span>
            {isEditing ? (
              <InlineInput value={inlineEdit.value} onChange={v => setInlineEdit(p => ({ ...p, value: v }))} onCommit={commitEdit} onCancel={() => setInlineEdit(null)} extraStyle={{ fontSize: 11 }} />
            ) : (
              <span
                onClick={() => toggleFolOpen(col.id, item.id)}
                onDoubleClick={e => { e.stopPropagation(); startEdit(item.id, item.name, name => mapItems(col.id, items => items.map(it => it.id === item.id ? { ...it, name } : it))); }}
                style={{ color: '#ddd', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
              >{item.name}</span>
            )}
            <span style={{ color: '#555', fontSize: 10, flexShrink: 0 }}>{item.items?.length || 0}</span>
            <button onClick={e => { e.stopPropagation(); folMenu(col, item, e); }}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', padding: 2, flexShrink: 0, transition: 'color .1s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#aaa'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
            ><MoreHorizontal size={11} /></button>
          </div>
          {item.isOpen && item.items?.map(child => renderNode(col, child, item.id, depth + 1))}
        </div>
      );
    }
    return renderRequest(col, item, folId, depth);
  };

  const sortedCollections = [...collections].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
  const filtered = sortedCollections.map(col => ({ ...col, items: filterItems(col.items, searchQuery) }));

  return (
    <>
      {ctx && <CtxMenu x={ctx.x} y={ctx.y} items={ctx.items} onClose={() => setCtx(null)} />}
      {confirmDel && <ConfirmModal {...confirmDel} onClose={() => setConfirmDel(null)} />}
      {moveModal && (
        <MoveModal
          collection={moveModal.collection}
          workspaces={workspaces || []}
          currentWorkspaceId={activeWorkspaceId}
          onMove={(targetWorkspaceId) => {
            MoveCollection(moveModal.collection.id, { target_workspace_id: targetWorkspaceId })
              .then(() => {
                // Remove from current workspace view
                setCollections(prev => prev.filter(c => c.id !== moveModal.collection.id));
              })
              .catch(console.error);
          }}
          onClose={() => setMoveModal(null)}
        />
      )}
      <input ref={importFileRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
      <input ref={importFolderRef} type="file" accept=".json" multiple onChange={handleImportFolder} style={{ display: 'none' }} />

      <style>{`
        .req-menu-btn { opacity: 0 !important; }
        div:hover > .req-menu-btn { opacity: 1 !important; }
      `}</style>

      <div style={{ backgroundColor: '#2b2b2b', borderRight: '1px solid #383838', display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
        {/* Header Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #383838', backgroundColor: '#252525', flexShrink: 0 }}>
          {[
            { id: 'collections', icon: <FolderOpen size={13} />, label: 'Collections' },
            { id: 'environments', icon: <Globe size={13} />, label: 'Environments' },
            { id: 'history', icon: <Clock size={13} />, label: 'History' },
          ].map(tab => (
            <button key={tab.id} data-testid={`sidebar-tab-${tab.id}`} onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, padding: '10px 4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: activeTab === tab.id ? '#FF6C37' : '#888', borderBottom: activeTab === tab.id ? '2px solid #FF6C37' : '2px solid transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'color .15s', fontFamily: 'inherit' }}
            >{tab.icon}{tab.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* ── COLLECTIONS ── */}
          {activeTab === 'collections' && (
            <>
              <div style={{ padding: 8, display: 'flex', gap: 5, borderBottom: '1px solid #383838', flexShrink: 0 }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..."
                    style={{ width: '100%', background: '#1e1e1e', border: '1px solid #3d3d3d', borderRadius: 4, padding: '5px 8px 5px 26px', color: '#e0e0e0', fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
                <button onClick={() => {
                  if (!activeWorkspaceId) return;
                  const tempId = uid();
                  const placeholder = { id: tempId, name: 'New Collection', isOpen: true, isFavorite: false, items: [] };
                  setCollections(prev => [...prev, placeholder]);
                  startEdit(tempId, 'New Collection', name => {
                    CreateCollection({ workspace_id: activeWorkspaceId, name })
                      .then(col => {
                        if (col) {
                          setCollections(prev => prev.map(c => c.id === tempId ? { ...col, isOpen: true, isFavorite: col.is_favorite ?? false, items: [] } : c));
                        } else {
                          setCollections(prev => prev.filter(c => c.id !== tempId));
                        }
                      })
                      .catch(() => setCollections(prev => prev.filter(c => c.id !== tempId)));
                  });
                }} title="New Collection" data-testid="new-collection-btn"
                  style={{ background: '#FF6C37', border: 'none', borderRadius: 4, padding: '5px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'background .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e55a28'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FF6C37'; }}
                ><Plus size={14} /></button>

                <button onClick={() => importFileRef.current?.click()} title="Import" data-testid="import-collection-btn"
                  style={{ background: '#2d2d2d', border: 'none', borderRadius: 4, padding: '5px 8px', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center', transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#6bc5f8'; e.currentTarget.style.background = '#363636'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.background = '#2d2d2d'; }}
                ><Download size={14} /></button>
              </div>

              {/* Loading indicator */}
              {colLoading && (
                <div style={{ padding: '12px 16px', textAlign: 'center', color: '#666', fontSize: 11 }}>Loading collections...</div>
              )}

              {filtered.map(col => (
                <div key={col.id}>
                  {/* Collection header */}
                  <div
                    onContextMenu={e => { e.preventDefault(); colMenu(col, e); }}
                    onDragOver={e => { e.preventDefault(); }}
                    onDrop={e => {
                      if (drag && drag.colId === col.id) {
                        e.preventDefault();
                        setCollections(prev => prev.map(c => {
                          if (c.id !== col.id) return c;
                          let draggedItem = null;
                          let newItems = drag.folId
                            ? c.items.map(it => it.id !== drag.folId ? it : { ...it, items: it.items.filter(sub => { if (sub.id === drag.id) { draggedItem = sub; return false; } return true; }) })
                            : c.items.filter(it => { if (it.id === drag.id) { draggedItem = it; return false; } return true; });
                          if (!draggedItem) return c;
                          return { ...c, items: [...newItems, draggedItem] };
                        }));
                        onDragEnd();
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'center', padding: '7px 8px', cursor: 'pointer', borderBottom: '1px solid #2d2d2d', gap: 4, transition: 'background .1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#333'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span onClick={() => toggleColOpen(col.id)} style={{ color: '#777', display: 'flex', flexShrink: 0 }}>
                      {col.isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </span>
                    <span onClick={() => toggleColOpen(col.id)} style={{ color: '#e8a87c', display: 'flex', flexShrink: 0 }}>
                      {col.isOpen ? <FolderOpen size={13} /> : <Folder size={13} />}
                    </span>
                    {inlineEdit?.id === col.id ? (
                      <InlineInput value={inlineEdit.value} onChange={v => setInlineEdit(p => ({ ...p, value: v }))} onCommit={commitEdit} onCancel={() => setInlineEdit(null)} />
                    ) : (
                      <span
                        onClick={() => toggleColOpen(col.id)}
                        onDoubleClick={e => {
                          e.stopPropagation(); startEdit(col.id, col.name, name => {
                            RenameCollection(col.id, name)
                              .then(updated => { if (updated) setCollections(prev => prev.map(c => c.id === col.id ? { ...c, name: updated.name } : c)); })
                              .catch(console.error);
                          });
                        }}
                        style={{ color: '#e0e0e0', fontSize: 12, fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}
                      >{col.name}</span>
                    )}
                    <button onClick={e => { e.stopPropagation(); toggleFav(col); }} title={col.isFavorite ? 'Unfavourite' : 'Favourite'}
                      style={{ background: 'none', border: 'none', color: col.isFavorite ? '#fca130' : '#444', cursor: 'pointer', display: 'flex', padding: 2, flexShrink: 0, transition: 'color .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#fca130'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = col.isFavorite ? '#fca130' : '#444'; }}
                    ><Star size={11} fill={col.isFavorite ? '#fca130' : 'none'} /></button>
                    <button onClick={e => colMenu(col, e)}
                      style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', padding: 2, flexShrink: 0, transition: 'color .1s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#aaa'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
                    ><MoreHorizontal size={12} /></button>
                  </div>

                  {/* Collection items */}
                  {col.isOpen && col.items.map(item => renderNode(col, item, null, 0))}
                </div>
              ))}

              {filtered.length === 0 && !searchQuery && !colLoading && (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <FolderOpen size={32} style={{ color: '#444', margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ color: '#666', fontSize: 12 }}>No collections yet</p>
                  <p style={{ color: '#555', fontSize: 11 }}>Click + to create one</p>
                </div>
              )}
            </>
          )}

          {/* ── ENVIRONMENTS ── */}
          {activeTab === 'environments' && (
            <EnvironmentPanel environments={environments} setEnvironments={setEnvironments} onOpenEnv={onOpenEnv} activeTabId={activeTabId} activeWorkspaceId={activeWorkspaceId} />
          )}

          {/* ── HISTORY ── */}
          {activeTab === 'history' && (
            <div>
              <div style={{ padding: '8px', display: 'flex', gap: 5, borderBottom: '1px solid #383838', flexShrink: 0 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                  <input placeholder="Search..." style={{ width: '100%', background: '#1e1e1e', border: '1px solid #3d3d3d', borderRadius: 4, padding: '5px 8px 5px 26px', color: '#e0e0e0', fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>
              {[
                { id: 'h1', method: 'GET', url: 'https://reqres.in/api/users', time: '2 min ago' },
                { id: 'h2', method: 'POST', url: 'https://reqres.in/api/users', time: '5 min ago' },
                { id: 'h3', method: 'DELETE', url: 'https://jsonplaceholder.typicode.com/posts/1', time: '10 min ago' },
                { id: 'h4', method: 'GET', url: 'https://api.github.com/users/octocat', time: '1 hr ago' },
              ].map(item => (
                <div key={item.id}
                  onClick={() => onSelectRequest({ id: item.id, name: item.url, method: item.method, url: item.url, headers: [], params: [], pathVariables: [], body: { type: 'none', rawType: 'JSON', raw: '', formData: [], urlEncoded: [] }, auth: { type: 'none' }, examples: [] })}
                  style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #2d2d2d', transition: 'background .1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#333'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: METHOD_COLORS[item.method] || '#999', minWidth: 34 }}>{item.method}</span>
                    <span style={{ fontSize: 10, color: '#555' }}>{item.time}</span>
                  </div>
                  <div style={{ color: '#ccc', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 42 }}>{item.url}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

function filterItems(items, q) {
  if (!q) return items;
  return items.reduce((acc, item) => {
    if (item.type === 'folder') {
      const filtered = filterItems(item.items, q);
      if (filtered.length > 0 || item.name.toLowerCase().includes(q.toLowerCase())) acc.push({ ...item, items: filtered });
    } else if (item.name.toLowerCase().includes(q.toLowerCase()) || (item.url || '').toLowerCase().includes(q.toLowerCase())) {
      acc.push(item);
    }
    return acc;
  }, []);
}

export default Sidebar;
