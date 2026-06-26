import React, { useState, useCallback } from 'react';
import { TopBar } from '@/components/postie/TopBar';
import { Sidebar } from '@/components/postie/Sidebar';
import { RequestTabsBar } from '@/components/postie/RequestTabsBar';
import { RequestPanel } from '@/components/postie/RequestPanel';
import { ResponsePanel } from '@/components/postie/ResponsePanel';
import { EnvironmentEditor } from '@/components/postie/EnvironmentEditor';
import { ConfirmDialog, MoveDialog } from '@/components/postie/CrudDialogs';
import { generateMockResponse } from '@/data/mockData';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { useTabs } from '@/hooks/useTabs';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';

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
        openRequest,
        openEnvironmentTab,
        newTab,
        duplicateTab,
        closeTab,
        closeOthers,
        closeAll,
    } = tabsApi;

    const handleSend = async () => {
        if (!activeTab || activeTab.type !== 'request') return;
        updateTab({ ...activeTab, isSending: true });
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 500));
        const res = generateMockResponse(activeTab);
        setTabs((ts) => ts.map((t) => (t.id === activeTab.id ? { ...t, isSending: false, response: res } : t)));
        if (activeTab.url) {
            data.setHistory((h) =>
                [{ id: `h-${Date.now()}`, method: activeTab.method, url: activeTab.url, time: 'Just now' }, ...h].slice(0, 20),
            );
        }
    };

    const tabActions = {
        onNew: newTab,
        onDuplicate: duplicateTab,
        onClose: closeTab,
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
                        onOpenRequest={openRequest}
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
                                    <RequestPanel request={activeTab} onUpdate={updateTab} onSend={handleSend} />
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
                <span>{data.activeWorkspace.name}</span>
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
                    onPick: (wsId) => move.col && data.moveCollectionToWorkspace(move.col.id, wsId),
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
