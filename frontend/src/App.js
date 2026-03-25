import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './components/Postie/Sidebar';
import RequestPanel from './components/Postie/RequestPanel';
import ResponsePanel from './components/Postie/ResponsePanel';
import EnvironmentEditor from './components/Postie/EnvironmentEditor';
import { NotificationPanel, SettingsModal, UserModal } from './components/Postie/TopModals';
import { DEFAULT_REQUEST, METHOD_COLORS } from './mock';
import { CreateWorkspace, ListWorkspaces, RenameWorkspace, DeleteWorkspace, ListEnvironments, UpdateEnvironment, SendRequest, UpdateRequest, ListCollections, CreateRequest, GetCollection } from './wailsjs/go/main/App';
import { Plus, X, Settings, Bell, Search, ChevronDown, Layers, Check, Globe, Trash2, Save } from 'lucide-react';
import './App.css';

let tabCounter = 1;
const createTab = (req = null) => ({
  id: `tab-${Date.now()}-${tabCounter++}`,
  type: 'request',
  request: req ? { ...req } : { ...DEFAULT_REQUEST, id: `req-${Date.now()}` },
  response: null,
  isSending: false,
  isDirty: false,
});

const createEnvTab = (env) => ({
  id: `envtab-${env.id}`,
  type: 'environment',
  envId: env.id,
  envName: env.name,
  isDirty: false,
});

const SaveRequestModal = ({ request, activeWorkspaceId, onClose, onSuccess }) => {
  const [cols, setCols] = useState([]);
  const [folderTree, setFolderTree] = useState([]);
  const [selectedCol, setSelectedCol] = useState('');
  const [selectedFol, setSelectedFol] = useState('');
  const [name, setName] = useState(request.name || 'Untitled Request');
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const inputRef = React.useRef(null);

  useEffect(() => {
    if (activeWorkspaceId) {
      ListCollections(activeWorkspaceId).then(res => {
        setCols(res || []);
        if (res && res.length > 0) setSelectedCol(res[0].id);
      }).catch(console.error);
    }
    setTimeout(() => inputRef.current?.select(), 50);
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (selectedCol) {
      GetCollection(selectedCol).then(res => {
        if (!res || !res.items) return setFolderTree([]);
        const flattenFolders = (items, prefix = "") => {
          let flat = [];
          for (const it of items) {
            if (it.type === 'folder' || (!it.method && it.items)) {
              flat.push({ id: it.id, name: prefix + it.name });
              // Indent children further
              if (it.items && it.items.length > 0) {
                flat = flat.concat(flattenFolders(it.items, prefix + "\u00A0\u00A0\u00A0↳\u00A0"));
              }
            }
          }
          return flat;
        };
        setFolderTree(flattenFolders(res.items));
      }).catch(console.error);
    } else {
      setFolderTree([]);
    }
  }, [selectedCol]);

  const handleSave = () => {
    if (!selectedCol) return;
    CreateRequest({
      collection_id: selectedCol,
      folder_id: selectedFol || undefined,
      name,
      method: request.method || 'GET',
      url: request.url || '',
      params: request.params || [],
      path_variables: request.path_variables || [],
      headers: request.headers || [],
      auth: request.auth || { type: 'none' },
      body: request.body || { type: 'none', raw: { type: 'JSON', value: '' }, form_data: [], url_encoded: [] }
    }).then(res => {
      if (res) onSuccess(res);
      onClose();
    }).catch(console.error);
  };

  const inputStyle = {
    width: '100%', background: '#141414', border: '1px solid #333', borderRadius: 6,
    padding: '9px 12px', color: '#e8e8e8', outline: 'none', fontFamily: 'inherit',
    fontSize: 13, boxSizing: 'border-box', transition: 'border-color .15s',
  };

  const labelStyle = { color: '#666', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 6, display: 'block' };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 440, background: 'linear-gradient(145deg,#1a1a1a,#161616)', border: '1px solid #2a2a2a', borderRadius: 12, boxShadow: '0 32px 80px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.04)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 16px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#f0f0f0', fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>Save Request</div>
            <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>Add to a collection to persist and organize</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', lineHeight: 1, transition: 'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Request Name</label>
            <input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              onFocus={e => e.currentTarget.style.borderColor = '#FF6C37'}
              onBlur={e => e.currentTarget.style.borderColor = '#333'}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: cols.length > 0 && selectedCol ? 16 : 0 }}>
            <label style={labelStyle}>Collection</label>
            <select
              value={selectedCol}
              onChange={e => { setSelectedCol(e.target.value); setSelectedFol(''); }}
              style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }}
            >
              <option value="" disabled>Select a collection…</option>
              {cols.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedCol && (
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Folder <span style={{ color: '#444', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              <select
                value={selectedFol}
                onChange={e => setSelectedFol(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }}
              >
                <option value="">Root of collection</option>
                {folderTree.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px 18px', borderTop: '1px solid #1f1f1f', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            onMouseEnter={() => setHoveredBtn('cancel')} onMouseLeave={() => setHoveredBtn(null)}
            style={{ background: hoveredBtn === 'cancel' ? '#252525' : 'none', border: '1px solid #2d2d2d', borderRadius: 6, padding: '7px 18px', color: '#aaa', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', transition: 'all .15s' }}
          >Cancel</button>
          <button
            onClick={handleSave}
            disabled={!selectedCol || !name.trim()}
            onMouseEnter={() => setHoveredBtn('save')} onMouseLeave={() => setHoveredBtn(null)}
            style={{ background: (!selectedCol || !name.trim()) ? '#333' : hoveredBtn === 'save' ? '#e85f2a' : '#FF6C37', border: 'none', borderRadius: 6, padding: '7px 20px', color: (!selectedCol || !name.trim()) ? '#666' : '#fff', cursor: (!selectedCol || !name.trim()) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={13} />
            Save Request
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteWorkspaceModal = ({ ws, onClose, onConfirm }) => {
  const [hovered, setHovered] = useState(null);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 390, background: 'linear-gradient(145deg,#1a1a1a,#161616)', border: '1px solid #2a2a2a', borderRadius: 12, boxShadow: '0 32px 80px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.04)', overflow: 'hidden' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,#f93e3e,#ff6b35)' }} />
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(249,62,62,0.1)', border: '1px solid rgba(249,62,62,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f93e3e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#f0f0f0', fontWeight: 700, fontSize: 14, letterSpacing: '-.01em' }}>Delete Workspace</div>
            <div style={{ color: '#505050', fontSize: 11, marginTop: 2 }}>This action cannot be undone</div>
          </div>
        </div>
        <div style={{ padding: '14px 20px 16px' }}>
          <div style={{ color: '#777', fontSize: 13, lineHeight: 1.65 }}>
            Delete <span style={{ color: '#e8a87c', fontWeight: 600 }}>"{ws.name}"</span>? All collections and requests inside will be permanently lost.
          </div>
        </div>
        <div style={{ padding: '12px 20px 18px', borderTop: '1px solid #1f1f1f', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            onMouseEnter={() => setHovered('cancel')} onMouseLeave={() => setHovered(null)}
            style={{ background: hovered === 'cancel' ? '#252525' : 'none', border: '1px solid #2d2d2d', borderRadius: 6, padding: '6px 16px', color: '#aaa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            onMouseEnter={() => setHovered('delete')} onMouseLeave={() => setHovered(null)}
            style={{ background: hovered === 'delete' ? '#d43030' : '#f93e3e', border: 'none', borderRadius: 6, padding: '6px 18px', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, transition: 'background .15s', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmUnsavedModal = ({ dirtyTabs, onDiscard, onClose }) => {
  const [hoveredBtn, setHoveredBtn] = useState(null);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 420, background: 'linear-gradient(145deg,#1a1a1a,#161616)', border: '1px solid #2a2a2a', borderRadius: 12, boxShadow: '0 32px 80px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.04)', overflow: 'hidden' }}>
        {/* Header with warning accent */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#f93e3e,#ff6b35)' }} />
        <div style={{ padding: '18px 22px 16px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(249,62,62,0.12)', border: '1px solid rgba(249,62,62,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
          </div>
          <div>
            <div style={{ color: '#f0f0f0', fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>Unsaved Changes</div>
            <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>{dirtyTabs.length} tab{dirtyTabs.length !== 1 ? 's' : ''} with unsaved changes will be closed</div>
          </div>
        </div>

        {/* Tab list */}
        <div style={{ padding: '16px 22px' }}>
          <div style={{ color: '#555', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 }}>Affected Tabs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
            {dirtyTabs.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1c1c1c', border: '1px solid #252525', borderRadius: 6, padding: '8px 12px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6C37', flexShrink: 0 }} />
                <span style={{ color: '#d0d0d0', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.request?.name || t.envName || 'Untitled'}</span>
                {t.request?.method && <span style={{ fontSize: 10, fontWeight: 700, color: '#FF6C37', flexShrink: 0 }}>{t.request.method}</span>}
              </div>
            ))}
          </div>
          <div style={{ color: '#484848', fontSize: 12, marginTop: 14, lineHeight: 1.6 }}>
            Discarding will permanently lose any unsaved changes. This action cannot be undone.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px 18px', borderTop: '1px solid #1f1f1f', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            onMouseEnter={() => setHoveredBtn('cancel')} onMouseLeave={() => setHoveredBtn(null)}
            style={{ background: hoveredBtn === 'cancel' ? '#252525' : 'none', border: '1px solid #2d2d2d', borderRadius: 6, padding: '7px 18px', color: '#aaa', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', transition: 'all .15s' }}
          >Keep Editing</button>
          <button
            onClick={onDiscard}
            onMouseEnter={() => setHoveredBtn('discard')} onMouseLeave={() => setHoveredBtn(null)}
            style={{ background: hoveredBtn === 'discard' ? '#d43030' : '#f93e3e', border: 'none', borderRadius: 6, padding: '7px 20px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all .15s' }}
          >Discard & Close</button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [tabs, setTabs] = useState(() => { const t = createTab(); return [t]; });
  const [activeTabId, setActiveTabId] = useState('');
  const [selectedEnvId, setSelectedEnvId] = useState('');
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
  const [environments, setEnvironments] = useState([]);
  const [sidebarSignal, setSidebarSignal] = useState(null);
  // Workspace state
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('');
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [editingWorkspaceId, setEditingWorkspaceId] = useState(null);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState('');
  const [renamingWorkspaceId, setRenamingWorkspaceId] = useState(null);
  const [renamingWorkspaceName, setRenamingWorkspaceName] = useState('');
  const [confirmDelWorkspace, setConfirmDelWorkspace] = useState(null); // { ws }

  const [confirmCloseTabs, setConfirmCloseTabs] = useState(null); // { tabIds: [], dirtyTabs: [] }
  const [saveModalRequest, setSaveModalRequest] = useState(null); // { request: req, onSuccess: fn }

  // Fetch initial workspaces
  useEffect(() => {
    ListWorkspaces()
      .then((data) => {
        if (data && data.length > 0) {
          setWorkspaces(data);
          setActiveWorkspaceId(data[0].id);
        }
      })
  }, []);

  // Auto-activate the only remaining tab if activeTabId is stale or null
  useEffect(() => {
    if (tabs.length > 0) {
      const validActive = tabs.find(t => t.id === activeTabId);
      if (!validActive) setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  // Fetch environments when active workspace changes
  useEffect(() => {
    if (!activeWorkspaceId) return;
    ListEnvironments(activeWorkspaceId)
      .then((data) => {
        setEnvironments(data || []);
      })
      .catch((err) => console.error("Error fetching environments:", err));
  }, [activeWorkspaceId]);

  // Global escape key handler to close modals/menus
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setConfirmDelWorkspace(null);
        setConfirmCloseTabs(null);
        setSaveModalRequest(null);
        setWorkspaceDropdownOpen(false);
        setEnvDropdownOpen(false);
        setShowSettings(false);
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);
  // Modal states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Tab context menu
  const [tabCtx, setTabCtx] = useState(null);
  // Resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const isResizingSidebar = useRef(false);
  // Resizable response panel
  const [responseHeight, setResponseHeight] = useState(300);
  const isResizingResponse = useRef(false);
  const mainAreaRef = useRef(null);

  useEffect(() => {
    if (tabs.length > 0 && !activeTabId) setActiveTabId(tabs[0].id);
  }, [tabs, activeTabId]);

  // Resize sidebar
  useEffect(() => {
    const onMove = (e) => { if (isResizingSidebar.current) setSidebarWidth(Math.max(180, Math.min(480, e.clientX))); };
    const onUp = () => { isResizingSidebar.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  // Resize response panel
  useEffect(() => {
    const onMove = (e) => {
      if (!isResizingResponse.current || !mainAreaRef.current) return;
      const rect = mainAreaRef.current.getBoundingClientRect();
      const fromBottom = rect.bottom - e.clientY;
      setResponseHeight(Math.max(120, Math.min(rect.height - 100, fromBottom)));
    };
    const onUp = () => { isResizingResponse.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  useEffect(() => {
    const handleClick = () => { setEnvDropdownOpen(false); setWorkspaceDropdownOpen(false); setTabCtx(null); };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Open request tab — deduplicate by request ID
  const openRequestTab = (req) => {
    if (req.id) {
      const existing = tabs.find(t => t.type === 'request' && t.request?.id === req.id);
      if (existing) { setActiveTabId(existing.id); return; }
    }
    const newTab = createTab(req);
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  // Open environment tab — deduplicate by env ID
  const openEnvTab = (env) => {
    const tabId = `envtab-${env.id}`;
    const existing = tabs.find(t => t.id === tabId);
    if (existing) { setActiveTabId(tabId); return; }
    const envTab = createEnvTab(env);
    setTabs(prev => [...prev, envTab]);
    setActiveTabId(tabId);
  };

  const addTab = (req = null) => {
    const newTab = createTab(req);
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTabs = (tabIdsToClose) => {
    const dirtyTabs = tabs.filter(t => tabIdsToClose.includes(t.id) && t.isDirty);
    if (dirtyTabs.length > 0) {
      setConfirmCloseTabs({ tabIds: tabIdsToClose, dirtyTabs });
      return;
    }
    executeCloseTabs(tabIdsToClose);
  };

  const executeCloseTabs = (tabIdsToClose) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => !tabIdsToClose.includes(t.id));
      if (newTabs.length === 0) {
        const newTab = createTab();
        setActiveTabId(newTab.id);
        return [newTab];
      }
      if (tabIdsToClose.includes(activeTabId)) {
        const firstIdx = prev.findIndex(t => t.id === tabIdsToClose[0]);
        const nextIdx = Math.min(firstIdx, newTabs.length - 1);
        setActiveTabId(newTabs[nextIdx].id);
      }
      return newTabs;
    });
  };

  const closeTab = (tabId, e) => {
    if (e) e.stopPropagation();
    closeTabs([tabId]);
  };

  // Tab context menu actions
  const tabCtxItems = tabCtx ? [
    { label: 'New Request', action: () => addTab() },
    {
      label: 'Duplicate Tab', action: () => {
        const tab = tabs.find(t => t.id === tabCtx.tabId);
        if (!tab || tab.type !== 'request') return;
        const newTab = { ...createTab(tab.request), response: tab.response };
        setTabs(prev => { const idx = prev.findIndex(t => t.id === tabCtx.tabId); const arr = [...prev]; arr.splice(idx + 1, 0, newTab); return arr; });
        setActiveTabId(newTab.id);
      }
    },
    'sep',
    { label: 'Close Tab', action: () => closeTabs([tabCtx.tabId]) },
    {
      label: 'Close Other Tabs', action: () => {
        const toClose = tabs.filter(t => t.id !== tabCtx.tabId).map(t => t.id);
        if (toClose.length > 0) closeTabs(toClose);
      }
    },
    {
      label: 'Close All Tabs', action: () => {
        const toClose = tabs.map(t => t.id);
        if (toClose.length > 0) closeTabs(toClose);
      }
    },
  ] : [];

  const updateActiveRequest = (request) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, request, isDirty: true } : t));
  };

  const buildFetchOptions = (request) => {
    const options = { method: request.method, headers: {} };

    (request.headers || []).filter(h => h.enabled && h.key).forEach(h => {
      options.headers[h.key] = h.value;
    });

    if (request.auth?.type === 'bearer' && request.auth.bearerToken) {
      options.headers['Authorization'] = `Bearer ${request.auth.bearerToken}`;
    } else if (request.auth?.type === 'basic') {
      const encoded = btoa(`${request.auth.basicUsername || ''}:${request.auth.basicPassword || ''}`);
      options.headers['Authorization'] = `Basic ${encoded}`;
    } else if (request.auth?.type === 'apikey' && request.auth.apiKeyName) {
      options.headers[request.auth.apiKeyName] = request.auth.apiKeyValue || '';
    }

    if (!['GET', 'HEAD'].includes(request.method)) {
      if (request.body?.type === 'raw' && request.body.raw?.value) {
        options.body = request.body.raw.value;
        if (!options.headers['Content-Type']) {
          const ctMap = { JSON: 'application/json', Text: 'text/plain', HTML: 'text/html', XML: 'application/xml', JavaScript: 'application/javascript' };
          options.headers['Content-Type'] = ctMap[request.body.raw.type] || 'application/json';
        }
      } else if (request.body?.type === 'form-data') {
        const fd = new FormData();
        (request.body.form_data || []).filter(f => f.enabled && f.key).forEach(f => fd.append(f.key, f.value));
        options.body = fd;
      } else if (request.body?.type === 'x-www-form-urlencoded') {
        const params = (request.body.url_encoded || []).filter(f => f.enabled && f.key)
          .map(f => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`).join('&');
        options.body = params;
        if (!options.headers['Content-Type']) options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }

    return options;
  };

  const sendRequest = async () => {
    if (!activeTab) return;
    const { request } = activeTab;
    if (!request.url?.trim()) return;

    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isSending: true, response: null } : t));

    const startTime = Date.now();
    try {
      let url = request.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

      const options = buildFetchOptions(request);

      // Build body string for proxy
      let bodyStr = null;
      if (options.body) {
        if (typeof options.body === 'string') {
          bodyStr = options.body;
        } else if (options.body instanceof FormData) {
          // FormData needs direct fetch; attempt fallback
          bodyStr = null;
        }
      }

      const proxyPayload = {
        url,
        method: request.method,
        headers: options.headers || {},
        body: bodyStr || '',
      };

      const proxyResp = await SendRequest(proxyPayload);
      const elapsed = Date.now() - startTime;
      const data = proxyResp;


      const byteSize = new Blob([data.body || '']).size;
      const size = byteSize > 1024 ? `${(byteSize / 1024).toFixed(2)} KB` : `${byteSize} B`;

      // Map status code to text
      const statusTexts = { 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 408: 'Request Timeout', 422: 'Unprocessable Entity', 500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable' };
      const statusText = statusTexts[data.status] || data.statusText || '';

      setTabs(prev => prev.map(t => t.id === activeTabId ? {
        ...t,
        isSending: false,
        response: { status: data.status, statusText, headers: data.headers || {}, body: data.body || '', time: elapsed, size }
      } : t));
    } catch (error) {
      const elapsed = Date.now() - startTime;
      const errMsg = error.response?.data?.error || error.message || 'Unknown error';
      setTabs(prev => prev.map(t => t.id === activeTabId ? {
        ...t,
        isSending: false,
        response: {
          status: 0,
          statusText: 'Error',
          headers: {},
          body: JSON.stringify({ error: errMsg }, null, 2),
          time: elapsed,
          size: '0 B'
        }
      } : t));
    }
  };

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const selectedEnv = environments.find(e => e.id === selectedEnvId);

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      const ws = await CreateWorkspace({ name: newWorkspaceName.trim() });
      if (ws) {
        setWorkspaces(prev => [...prev, ws]);
        setActiveWorkspaceId(ws.id);
        setNewWorkspaceName('');
        setShowCreateWorkspace(false);
        setWorkspaceDropdownOpen(false);
      }
    } catch (e) {
      console.error('Failed to create workspace', e);
    }
  };

  const saveAsSample = () => {
    if (!activeTab || activeTab.type !== 'request' || !activeTab.response) return;
    const exampleId = `ex-${Date.now()}`;
    const example = {
      id: exampleId,
      name: `Example ${activeTab.response.status}`,
      status: activeTab.response.status,
      body: activeTab.response.body,
    };
    // Silently save — no modal or alert
    console.log('Saved example:', example);
  };

  const saveRequest = async () => {
    if (!activeTab || activeTab.type !== 'request') return;
    const { request } = activeTab;

    if (request.id.startsWith('req-')) {
      setSaveModalRequest({
        request,
        onSuccess: (savedRequest) => {
          setTabs(prev => prev.map(t => (t.type === 'request' && t.request.id === request.id) ? { ...t, request: savedRequest, isDirty: false } : t));
          setSidebarSignal({
            type: 'create_request',
            request: savedRequest,
            collectionId: savedRequest.collection_id,
            folderId: savedRequest.folder_id
          });
        }
      });
      return;
    }

    try {
      await UpdateRequest(request.id, {
        name: request.name || 'Untitled',
        method: request.method || 'GET',
        url: request.url || '',
        params: request.params || [],
        path_variables: request.path_variables || [],
        headers: request.headers || [],
        auth: request.auth || { type: 'none' },
        body: request.body || { type: 'none', raw: { type: 'JSON', value: '' }, form_data: [], url_encoded: [] }
      });
      setSidebarSignal({ type: 'update_request', id: request.id, name: request.name || 'Untitled', method: request.method || 'GET' });
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isDirty: false } : t));
    } catch (e) {
      console.error('Failed to save request', e);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#1c1c1c', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif', overflow: 'hidden' }}>

      {confirmCloseTabs && (
        <ConfirmUnsavedModal
          dirtyTabs={confirmCloseTabs.dirtyTabs}
          onDiscard={() => {
            const tabsToClose = confirmCloseTabs.tabIds;
            setConfirmCloseTabs(null);
            executeCloseTabs(tabsToClose);
          }}
          onClose={() => setConfirmCloseTabs(null)}
        />
      )}

      {saveModalRequest && (
        <SaveRequestModal
          request={saveModalRequest.request}
          activeWorkspaceId={activeWorkspaceId}
          onSuccess={saveModalRequest.onSuccess}
          onClose={() => setSaveModalRequest(null)}
        />
      )}

      {/* ── DELETE WORKSPACE CONFIRM MODAL ─────────────────────────────── */}
      {confirmDelWorkspace && (
        <DeleteWorkspaceModal
          ws={confirmDelWorkspace.ws}
          onClose={() => setConfirmDelWorkspace(null)}
          onConfirm={() => {
            const { ws } = confirmDelWorkspace;
            setConfirmDelWorkspace(null);
            DeleteWorkspace(ws.id).then(() => {
              if (ws.id === activeWorkspaceId) setActiveWorkspaceId(workspaces.find(w => w.id !== ws.id)?.id || '');
              setWorkspaces(prev => prev.filter(w => w.id !== ws.id));
              setWorkspaceDropdownOpen(false);
            }).catch(console.error);
          }}
        />
      )}


      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <div style={{ height: '48px', backgroundColor: '#1a1a1a', borderBottom: '1px solid #2d2d2d', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '6px', flexShrink: 0, zIndex: 100 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '6px' }}>
          <svg viewBox="0 0 48 48" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" fill="#FF6C37" />
            <path d="M14 24 L24 14 L34 24 L24 34 Z" fill="white" opacity="0.9" />
            <circle cx="24" cy="24" r="6" fill="#FF6C37" />
          </svg>
          <span style={{ color: '#FF6C37', fontWeight: '700', fontSize: '15px', letterSpacing: '0.2px' }}>Postie</span>
        </div>

        <div style={{ width: '1px', height: '18px', background: '#2d2d2d', margin: '0 2px' }} />

        {/* Home */}
        <button style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '12px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontFamily: 'inherit', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2d2d2d'; e.currentTarget.style.color = '#e0e0e0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#aaa'; }}
        >Home</button>

        {/* Workspace Dropdown */}
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button data-testid="workspace-dropdown-btn" onClick={() => setWorkspaceDropdownOpen(prev => !prev)}
            style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '12px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2d2d2d'; e.currentTarget.style.color = '#e0e0e0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#aaa'; }}
          >
            <Layers size={12} />
            {activeWorkspace?.name || 'My Workspace'}
            <ChevronDown size={11} />
          </button>

          {workspaceDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, background: '#2a2a2a', border: '1px solid #3d3d3d', borderRadius: '6px', minWidth: '220px', marginTop: '3px', boxShadow: '0 6px 24px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid #333' }}>
                <span style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Workspaces</span>
              </div>
              {workspaces.map(ws => (
                <div key={ws.id}
                  style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#333'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {renamingWorkspaceId === ws.id ? (
                    <input
                      autoFocus
                      value={renamingWorkspaceName}
                      onChange={e => setRenamingWorkspaceName(e.target.value)}
                      onBlur={() => {
                        if (renamingWorkspaceName.trim()) {
                          RenameWorkspace(ws.id, renamingWorkspaceName.trim())
                            .then(updated => {
                              if (updated) setWorkspaces(prev => prev.map(w => w.id === ws.id ? updated : w));
                            })
                            .catch(console.error);
                        }
                        setRenamingWorkspaceId(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (renamingWorkspaceName.trim()) {
                            RenameWorkspace(ws.id, renamingWorkspaceName.trim())
                              .then(updated => {
                                if (updated) setWorkspaces(prev => prev.map(w => w.id === ws.id ? updated : w));
                              })
                              .catch(console.error);
                          }
                          setRenamingWorkspaceId(null);
                        }
                        if (e.key === 'Escape') setRenamingWorkspaceId(null);
                      }}
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, background: '#1e1e1e', border: '1px solid #FF6C37', borderRadius: 4, padding: '4px 8px', color: '#e0e0e0', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                    />
                  ) : (
                    <>
                      <div onClick={() => { setActiveWorkspaceId(ws.id); setWorkspaceDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: ws.id === activeWorkspaceId ? '#FF6C37' : '#3d3d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#fff', fontSize: '10px', fontWeight: '700' }}>{ws.name.charAt(0)}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#e0e0e0', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</div>
                          <div style={{ color: '#666', fontSize: '10px' }}>{ws.type}</div>
                        </div>
                        {ws.id === activeWorkspaceId && <Check size={12} style={{ color: '#FF6C37', flexShrink: 0 }} />}
                      </div>
                      {/* Rename / Delete icons */}
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button title="Rename" onClick={e => { e.stopPropagation(); setRenamingWorkspaceId(ws.id); setRenamingWorkspaceName(ws.name); }}
                          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 3, borderRadius: 3, display: 'flex', transition: 'color .1s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#e0e0e0'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        {workspaces.length > 1 && (
                          <button title="Delete" onClick={e => {
                            e.stopPropagation();
                            setConfirmDelWorkspace({ ws });
                          }}
                            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 3, borderRadius: 3, display: 'flex', transition: 'color .1s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#f93e3e'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div style={{ padding: '6px 8px', borderTop: '1px solid #333' }}>
                {showCreateWorkspace ? (
                  <div style={{ padding: '6px' }} onClick={e => e.stopPropagation()}>
                    <input autoFocus value={newWorkspaceName} onChange={e => setNewWorkspaceName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') createWorkspace(); if (e.key === 'Escape') setShowCreateWorkspace(false); }}
                      placeholder="Workspace name"
                      style={{ width: '100%', background: '#1e1e1e', border: '1px solid #FF6C37', borderRadius: '4px', padding: '6px 10px', color: '#e0e0e0', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '6px' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={createWorkspace}
                        style={{ flex: 1, background: '#FF6C37', border: 'none', borderRadius: '4px', padding: '5px', color: '#fff', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>Create</button>
                      <button onClick={() => setShowCreateWorkspace(false)}
                        style={{ flex: 1, background: '#333', border: 'none', borderRadius: '4px', padding: '5px', color: '#ccc', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowCreateWorkspace(true)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '7px 6px', color: '#FF6C37', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
                    <Plus size={12} /> Create Workspace
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: 'relative', width: '200px' }}>
          <Search size={12} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
          <input placeholder="Search"
            style={{ width: '100%', background: '#262626', border: '1px solid #333', borderRadius: '16px', padding: '5px 10px 5px 27px', color: '#e0e0e0', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onFocus={e => { e.target.style.borderColor = '#FF6C37'; }}
            onBlur={e => { e.target.style.borderColor = '#333'; }}
          />
        </div>

        {/* Environment Selector */}
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button data-testid="env-selector-btn" onClick={() => setEnvDropdownOpen(prev => !prev)}
            style={{ background: '#262626', border: '1px solid #333', borderRadius: '4px', padding: '5px 10px', color: selectedEnv ? '#e8a87c' : '#777', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '125px', justifyContent: 'space-between', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; }}
          >
            <span>{selectedEnv ? selectedEnv.name : 'No Environment'}</span>
            <ChevronDown size={11} style={{ color: '#666' }} />
          </button>
          {envDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, background: '#2a2a2a', border: '1px solid #3d3d3d', borderRadius: '6px', minWidth: '160px', marginTop: '3px', boxShadow: '0 6px 24px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <div onClick={() => { setSelectedEnvId(''); setEnvDropdownOpen(false); }}
                style={{ padding: '8px 14px', cursor: 'pointer', color: !selectedEnvId ? '#FF6C37' : '#ccc', fontSize: '12px', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#333'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >No Environment</div>
              {environments.map(env => (
                <div key={env.id} onClick={() => { setSelectedEnvId(env.id); setEnvDropdownOpen(false); }}
                  style={{ padding: '8px 14px', cursor: 'pointer', color: selectedEnvId === env.id ? '#FF6C37' : '#ccc', fontSize: '12px', fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#333'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >{env.name}</div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Icons: Bell, Settings, User ── */}
        <div style={{ display: 'flex', gap: '2px', marginLeft: '4px', alignItems: 'center' }}>
          {/* Notifications — coming soon */}
          <div style={{ position: 'relative' }} className="coming-soon-wrap">
            <button data-testid="notifications-btn"
              disabled
              style={{ background: 'none', border: 'none', color: '#444', cursor: 'not-allowed', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', position: 'relative', opacity: 0.4 }}
            >
              <Bell size={15} />
            </button>
            <div className="coming-soon-tip" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, background: 'linear-gradient(135deg,#1e1e1e,#181818)', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', width: 170, boxShadow: '0 8px 24px rgba(0,0,0,.6)', zIndex: 9999, pointerEvents: 'none', opacity: 0, transition: 'opacity .15s' }}>
              <div style={{ color: '#FF6C37', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>🚀 Coming Soon</div>
              <div style={{ color: '#666', fontSize: 11, lineHeight: 1.5 }}>Notifications will be available in a future release.</div>
            </div>
          </div>

          {/* Settings — coming soon */}
          <div style={{ position: 'relative' }} className="coming-soon-wrap">
            <button data-testid="settings-btn"
              disabled
              style={{ background: 'none', border: 'none', color: '#444', cursor: 'not-allowed', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', opacity: 0.4 }}
            >
              <Settings size={15} />
            </button>
            <div className="coming-soon-tip" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, background: 'linear-gradient(135deg,#1e1e1e,#181818)', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', width: 170, boxShadow: '0 8px 24px rgba(0,0,0,.6)', zIndex: 9999, pointerEvents: 'none', opacity: 0, transition: 'opacity .15s' }}>
              <div style={{ color: '#FF6C37', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>🚀 Coming Soon</div>
              <div style={{ color: '#666', fontSize: 11, lineHeight: 1.5 }}>Settings panel will be available in a future release.</div>
            </div>
          </div>

          {/* User Avatar — coming soon */}
          <div style={{ position: 'relative', marginLeft: '4px' }} className="coming-soon-wrap">
            <div data-testid="user-avatar-btn"
              style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', border: '2px solid transparent', opacity: 0.4 }}
            >
              <span style={{ color: '#888', fontSize: '11px', fontWeight: '700' }}>U</span>
            </div>
            <div className="coming-soon-tip" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, background: 'linear-gradient(135deg,#1e1e1e,#181818)', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', width: 170, boxShadow: '0 8px 24px rgba(0,0,0,.6)', zIndex: 9999, pointerEvents: 'none', opacity: 0, transition: 'opacity .15s' }}>
              <div style={{ color: '#FF6C37', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>🚀 Coming Soon</div>
              <div style={{ color: '#666', fontSize: 11, lineHeight: 1.5 }}>User profile & authentication coming soon.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS & PANELS ─────────────────────────────────────────── */}
      {showNotifications && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 498 }} onClick={() => setShowNotifications(false)} />
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        </>
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showUserMenu && <UserModal onClose={() => setShowUserMenu(false)} />}

      {/* MAIN LAYOUT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Resizable Sidebar */}
        <div style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth, display: 'flex', flexShrink: 0 }}>
          <Sidebar
            onSelectRequest={openRequestTab}
            activeRequestId={activeTab?.type === 'request' ? activeTab.request?.id : null}
            activeEnvTabIds={tabs.filter(t => t.type === 'environment').map(t => t.envId)}
            onOpenEnv={openEnvTab}
            environments={environments}
            setEnvironments={setEnvironments}
            activeTabId={activeTabId}
            activeWorkspaceId={activeWorkspaceId}
            workspaces={workspaces}
            sidebarSignal={sidebarSignal}
            onRequestRenamed={(id, name) => setTabs(p => p.map(t => (t.type === 'request' && t.request.id === id) ? { ...t, name, request: { ...t.request, name } } : t))}
            onRequestDeleted={(id) => {
              setTabs(prev => {
                const newTabs = prev.filter(t => !(t.type === 'request' && t.request.id === id));
                if (newTabs.length === 0) {
                  const newTab = createTab();
                  setActiveTabId(newTab.id);
                  return [newTab];
                }
                setActiveTabId(act => {
                  const wasActive = prev.find(t => t.id === act)?.request?.id === id;
                  if (wasActive) return newTabs[0].id;
                  return act;
                });
                return newTabs;
              });
            }}
          />
        </div>
        {/* Sidebar resize handle */}
        <div
          onMouseDown={() => { isResizingSidebar.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }}
          style={{ width: 4, background: 'transparent', cursor: 'col-resize', flexShrink: 0, borderRight: '1px solid #2d2d2d', transition: 'background .15s', zIndex: 10 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FF6C37'; }}
          onMouseLeave={e => { if (!isResizingSidebar.current) e.currentTarget.style.background = 'transparent'; }}
        />

        {/* Tab context menu */}
        {tabCtx && (
          <div style={{ position: 'fixed', left: tabCtx.x, top: tabCtx.y, zIndex: 9999, background: '#2a2a2a', border: '1px solid #3d3d3d', borderRadius: 6, width: 200, boxShadow: '0 6px 24px rgba(0,0,0,.6)', overflow: 'hidden' }}>
            {tabCtxItems.map((item, i) =>
              item === 'sep' ? <div key={i} style={{ height: 1, background: '#333', margin: '3px 0' }} /> : (
                <button key={i} onClick={() => { item.action(); setTabCtx(null); }}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '8px 14px', color: '#ccc', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background .1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#3d3d3d'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >{item.label}</button>
              )
            )}
          </div>
        )}

        {/* Main Content */}
        <div ref={mainAreaRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Tab Bar */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#252525', borderBottom: '1px solid #2d2d2d', flexShrink: 0, minHeight: '38px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              {tabs.map((tab) => {
                const isEnvTab = tab.type === 'environment';
                const label = isEnvTab ? tab.envName : (tab.request?.name || 'Untitled');
                const method = isEnvTab ? null : tab.request?.method;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setTabCtx({ tabId: tab.id, x: e.clientX, y: e.clientY }); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', height: 38, cursor: 'pointer', borderRight: '1px solid #2d2d2d', backgroundColor: activeTabId === tab.id ? '#1e1e1e' : 'transparent', borderTop: activeTabId === tab.id ? '2px solid #FF6C37' : '2px solid transparent', minWidth: 110, maxWidth: 190, flexShrink: 0, transition: 'background .1s' }}
                    onMouseEnter={e => { if (activeTabId !== tab.id) e.currentTarget.style.background = '#2a2a2a'; }}
                    onMouseLeave={e => { if (activeTabId !== tab.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {isEnvTab
                      ? <Globe size={11} style={{ color: '#3ecf8e', flexShrink: 0 }} />
                      : <span style={{ fontSize: 10, fontWeight: 700, color: METHOD_COLORS[method] || '#e0e0e0', minWidth: 28, letterSpacing: '.3px' }}>{method?.substring(0, 4)}</span>
                    }
                    <span style={{ color: activeTabId === tab.id ? '#e0e0e0' : '#aaa', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                    {tab.isDirty && <div style={{ width: 6, height: 6, backgroundColor: '#FF6C37', borderRadius: '50%', flexShrink: 0 }} />}
                    {!isEnvTab && tab.isSending && <div style={{ width: 10, height: 10, border: '2px solid #333', borderTopColor: '#FF6C37', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />}
                    <button onClick={e => closeTab(tab.id, e)}
                      style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 2, borderRadius: 2, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color .1s' }}
                      onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = '#e0e0e0'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
                    ><X size={11} /></button>
                  </div>
                );
              })}
            </div>
            <button data-testid="add-tab-btn" onClick={() => addTab()}
              style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', padding: '0 12px', height: 38, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e0e0e0'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#777'; }}
            ><Plus size={14} /></button>
          </div>

          {/* Active Tab Content */}
          {activeTab && (
            activeTab.type === 'environment' ? (
              <EnvironmentEditor
                environment={environments.find(e => e.id === activeTab.envId)}
                onUpdate={(updatedEnv) => {
                  setEnvironments(prev => prev.map(e => e.id === updatedEnv.id ? updatedEnv : e));
                  UpdateEnvironment(updatedEnv.id, { name: updatedEnv.name, variables: updatedEnv.variables || [] })
                    .catch(console.error);
                }}
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <RequestPanel
                  request={activeTab.request}
                  onRequestChange={updateActiveRequest}
                  onSend={sendRequest}
                  onSave={saveRequest}
                  isSending={activeTab.isSending}
                />
                {/* Response resize handle */}
                <div
                  onMouseDown={() => { isResizingResponse.current = true; document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none'; }}
                  style={{ height: 5, background: 'transparent', cursor: 'row-resize', flexShrink: 0, borderTop: '1px solid #2d2d2d', transition: 'background .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FF6C37'; }}
                  onMouseLeave={e => { if (!isResizingResponse.current) e.currentTarget.style.background = 'transparent'; }}
                />
                <div style={{ height: responseHeight, minHeight: responseHeight, maxHeight: responseHeight, overflow: 'hidden', flexShrink: 0 }}>
                  <ResponsePanel
                    response={activeTab.response}
                    isSending={activeTab.isSending}
                    onSaveAsSample={activeTab.response ? saveAsSample : null}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ height: '22px', backgroundColor: '#FF6C37', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }} />
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '10px' }}>Connected</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>|</span>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '10px' }}>Postie v11.0</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '10px' }}>Free Plan</span>
        <button style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '3px', padding: '1px 8px', color: 'rgba(255,255,255,0.9)', fontSize: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Upgrade
        </button>
      </div>
    </div>
  );
}

export default App;
