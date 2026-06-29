import React, { useState, useCallback, useEffect } from 'react';
import { TopBar } from '@/components/postie/TopBar';
import { Sidebar } from '@/components/postie/Sidebar';
import { RequestTabsBar } from '@/components/postie/RequestTabsBar';
import { RequestPanel } from '@/components/postie/RequestPanel';
import { ResponsePanel } from '@/components/postie/ResponsePanel';
import { EnvironmentEditor } from '@/components/postie/EnvironmentEditor';
import { ConfirmDialog, MoveDialog } from '@/components/postie/CrudDialogs';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { useTabs } from '@/hooks/useTabs';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { SendRequest, GetRequest, UpdateRequest } from '@/wailsjs/go/main/App';

function useConfirmDialog() {
    const [confirm, setConfirm] = useState({ open: false, config: null });
    const openConfirm = useCallback((config) => setConfirm({ open: true, config }), [setConfirm]);
    return { confirm, setConfirm, openConfirm };
}

export default function AppWorkspace() {
    const data = useWorkspaceData();
    const tabsApi = useTabs();
    const { confirm, setConfirm, openConfirm } = useConfirmDialog();
    const [move, setMove] = useState({ open: false, col: null });
    const [activeView, setActiveView] = useState('collections');

    const {
        tabs,
        activeTabId,
        activeTab,
        setTabs,
        setActiveTabId,
        updateTab,
        markClean,
        openRequest,
        openEnvironmentTab,
        newTab,
        duplicateTab,
        closeTab,
        closeOthers,
        closeAll,
    } = tabsApi;

    // Open a collection request: fetch full data from backend then open tab
    const handleOpenRequest = useCallback(async (req) => {
        // If it's from sidebar (has an id that looks like a UUID), fetch full data
        if (req.id && !req.id.startsWith('req-')) {
            try {
                const full = await GetRequest(req.id);
                // Map backend format → tab format
                const mapped = {
                    sourceId: full.id,
                    colId: req.colId || null,
                    folderId: req.folderId || null,
                    name: full.name,
                    method: full.method,
                    url: full.url || '',
                    params: (full.params && full.params.length > 0)
                        ? full.params.map((p, i) => ({ id: `p${i}`, key: p.key, value: p.value, description: p.description || '', enabled: p.enabled !== false }))
                        : [{ id: 'p1', key: '', value: '', description: '', enabled: true }],
                    headers: (full.headers && full.headers.length > 0)
                        ? full.headers.map((h, i) => ({ id: `h${i}`, key: h.key, value: h.value, description: h.description || '', enabled: h.enabled !== false }))
                        : [{ id: 'h1', key: 'Accept', value: 'application/json', description: '', enabled: true }, { id: 'h2', key: '', value: '', description: '', enabled: true }],
                    body: full.body?.raw?.value || '',
                    bodyType: full.body?.type || 'none',
                    auth: full.auth || { type: 'none' },
                    isDirty: false,
                };
                openRequest(mapped);
                return;
            } catch (err) {
                console.error('Failed to fetch request:', err);
            }
        }
        // Fallback for history or non-collection requests
        openRequest(req);
    }, [openRequest]);

    // Save the active tab to backend
    const handleSaveRequest = useCallback(async () => {
        if (!activeTab || activeTab.type !== 'request' || !activeTab.sourceId) return;
        try {
            const payload = {
                name: activeTab.name,
                method: activeTab.method,
                url: activeTab.url || '',
                params: (activeTab.params || []).filter(p => p.key).map(p => ({ key: p.key, value: p.value, description: p.description || '', enabled: p.enabled !== false })),
                path_variables: [],
                auth: (() => {
                    const a = activeTab.auth || { type: 'none' };
                    const base = { type: a.type };
                    if (a.type === 'bearer' && a.token) base.bearer = { token: a.token };
                    if (a.type === 'basic') base.basic = { username: a.username || '', password: a.password || '' };
                    if (a.type === 'apikey') base.api_key = { key: a.key || '', value: a.value || '' };
                    return base;
                })(),
                headers: (activeTab.headers || []).filter(h => h.key).map(h => ({ key: h.key, value: h.value, description: h.description || '', enabled: h.enabled !== false })),
                body: {
                    type: activeTab.bodyType || 'none',
                    ...(activeTab.bodyType === 'raw' ? { raw: { type: 'json', value: activeTab.body || '' } } : {}),
                },
            };
            await UpdateRequest(activeTab.sourceId, payload);
            markClean(activeTab.id);
            data.updateRequest(activeTab.sourceId, { name: activeTab.name, method: activeTab.method });
        } catch (err) {
            console.error('Failed to save request:', err);
        }
    }, [activeTab, markClean, data]);

    // Keyboard shortcut: Cmd/Ctrl+S to save
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSaveRequest();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleSaveRequest]);

    const handleSend = async () => {
        if (!activeTab || activeTab.type !== 'request') return;
        setTabs((ts) => ts.map((t) => (t.id === activeTab.id ? { ...t, isSending: true } : t)));

        try {
            const start = performance.now();
            const headers = activeTab.headers
                .filter(h => h.enabled && h.key)
                .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

            const payload = {
                url: activeTab.url,
                method: activeTab.method,
                headers: headers,
                body: activeTab.bodyType !== 'none' ? activeTab.body : ''
            };

            const res = await SendRequest(payload);
            const elapsed = Math.max(0, Math.floor(performance.now() - start));

            const responseData = {
                status: res.status,
                statusText: res.statusText,
                time: elapsed,
                size: new Blob([res.body || '']).size,
                headers: Object.entries(res.headers || {}).map(([key, value]) => ({ key, value })),
                body: res.body,
                error: false,
            };

            setTabs((ts) => ts.map((t) => (t.id === activeTab.id ? { ...t, isSending: false, response: responseData } : t)));
        } catch (err) {
            const responseData = {
                status: 0,
                statusText: 'Error',
                time: 0,
                size: 0,
                headers: [],
                body: '{\n  "error": "' + (err.message || err) + '"\n}',
                error: true,
            };
            setTabs((ts) => ts.map((t) => (t.id === activeTab.id ? { ...t, isSending: false, response: responseData } : t)));
        }

        if (activeTab.url) {
            data.setHistory((h) =>
                [{ id: `h-${Date.now()}`, method: activeTab.method, url: activeTab.url, time: 'Just now' }, ...h].slice(0, 20),
            );
        }
    };

    const tabActions = {
        onNew: newTab,
        onDuplicate: duplicateTab,
        onClose: (id) => {
            const tab = tabs.find((t) => t.id === id);
            if (tab && tab.isDirty && tab.type !== 'environment') {
                openConfirm({
                    title: 'Close unsaved tab?',
                    description: 'You have unsaved changes. Are you sure you want to close this tab?',
                    confirmText: 'Close',
                    onConfirm: () => closeTab(id),
                });
            } else {
                closeTab(id);
            }
        },
        onCloseOthers: (id) =>
            openConfirm({ title: 'Close other tabs?', description: 'All tabs except this one will be closed.', confirmText: 'Close Others', onConfirm: () => closeOthers(id) }),
        onCloseAll: () =>
            openConfirm({ title: 'Close all tabs?', description: 'All open tabs will be closed.', confirmText: 'Close All', onConfirm: () => closeAll() }),
        onForceClose: () => closeAll(),
    };

    const openMove = useCallback((col) => setMove({ open: true, col }), []);

    const activeEnv = data.environments.find((e) => e.active);
    const activeEnvForTab = activeTab?.type === 'environment' ? data.environments.find((e) => e.id === activeTab.envId) : null;

    return (
        <div className="h-screen w-screen flex flex-col bg-background overflow-hidden text-foreground">
            <TopBar
                workspaces={data.workspaces}
                activeWorkspace={data.activeWorkspace}
                environments={data.environments}
                activeEnv={activeEnv}
                onEnvChange={data.setActiveEnvironment}
                onSelectWorkspace={data.selectWorkspace}
                openConfirm={openConfirm}
                addWorkspace={data.addWorkspace}
                renameWorkspace={data.renameWorkspace}
                deleteWorkspace={data.deleteWorkspace}
            />

            <PanelGroup direction="horizontal" className="flex-1 min-h-0">
                <Panel defaultSize={26} minSize={18} maxSize={36}>
                    <Sidebar
                        data={data}
                        onOpenRequest={handleOpenRequest}
                        onOpenEnvironment={openEnvironmentTab}
                        onMove={openMove}
                        activeView={activeView}
                        setActiveView={setActiveView}
                        openConfirm={openConfirm}
                    />
                </Panel>

                <ResizeHandle />

                <Panel defaultSize={80} minSize={50}>
                    <div className="h-full flex flex-col bg-background">
                        <RequestTabsBar tabs={tabs} activeId={activeTabId} onSelect={setActiveTabId} actions={tabActions} />

                        {activeTab?.type === 'environment' && (
                            activeEnvForTab ? (
                                <EnvironmentEditor env={activeEnvForTab} onChange={(vars) => data.updateEnvironmentVariables(activeEnvForTab.id, vars)} />
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">This environment was deleted.</div>
                            )
                        )}

                        {activeTab?.type === 'request' && (
                            <PanelGroup direction="vertical" className="flex-1 min-h-0">
                                <Panel defaultSize={55} minSize={25}>
                                    <RequestPanel request={activeTab} onUpdate={updateTab} onSend={handleSend} onSave={handleSaveRequest} />
                                </Panel>
                                <ResizeHandle horizontal />
                                <Panel defaultSize={45} minSize={20}>
                                    <ResponsePanel response={activeTab.response} isSending={activeTab.isSending} />
                                </Panel>
                            </PanelGroup>
                        )}
                    </div>
                </Panel>
            </PanelGroup>

            {/* Footer status bar */}
            <footer className="h-7 shrink-0 border-t border-border bg-card/80 backdrop-blur-xl flex items-center px-4 gap-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
                    Online
                </div>
                <span>v3.2.1</span>
                <span className="mx-1">·</span>
                <span>{data.activeWorkspace?.name || 'Workspace'}</span>
                <div className="ml-auto flex items-center gap-3">
                    <span>{tabs.length} open tabs</span>
                    <span className="mono">{activeEnv?.name || 'No env'}</span>
                </div>
            </footer>

            <ConfirmDialog open={confirm.open} onOpenChange={(o) => setConfirm((c) => ({ ...c, open: o }))} config={confirm.config} />
            <MoveDialog
                open={move.open}
                onOpenChange={(o) => setMove((m) => ({ ...m, open: o }))}
                config={{
                    collectionName: move.col?.name,
                    workspaces: data.workspaces.filter((w) => w.id !== data.activeWorkspaceId),
                    onPick: (wsId) => move.col && data.moveCollection(move.col.id, wsId),
                }}
            />
        </div>
    );
}

const ResizeHandle = ({ horizontal = false }) => (
    <PanelResizeHandle
        className={cn(
            'group relative bg-border/40 hover:bg-primary/40 transition-colors',
            horizontal ? 'h-px w-full' : 'w-px h-full',
        )}
    >
        <div
            className={cn(
                'absolute opacity-0 group-hover:opacity-100 transition-opacity rounded bg-primary/80',
                horizontal ? 'h-1 w-12 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2' : 'w-1 h-12 top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2',
            )}
        />
    </PanelResizeHandle>
);
