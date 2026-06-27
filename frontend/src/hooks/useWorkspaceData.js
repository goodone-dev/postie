import { useState, useEffect, useCallback } from 'react';
import { loadState, saveState } from '@/lib/persist';
import {
    ListWorkspaces,
    CreateWorkspace,
    RenameWorkspace,
    DeleteWorkspace,
    ListEnvironments,
    CreateEnvironment,
    UpdateEnvironment,
    DeleteEnvironment,
    DuplicateEnvironment,
    ListCollections,
    GetCollection,
    CreateCollection,
    RenameCollection,
    DeleteCollection,
    DuplicateCollection,
    UpdateCollectionFavorite,
    CreateFolder,
    RenameFolder,
    DeleteFolder,
    DuplicateFolder,
    CreateRequest,
    RenameRequest,
    DeleteRequest,
    DuplicateRequest
} from '@/wailsjs/go/main/App';

// ---- Collection / folder / request CRUD factory ----
function makeCollectionCrud({ setCollections, activeWorkspaceId, collections, refreshCollections, refreshCollection }) {
    const mapCol = (colId, fn) => setCollections((cs) => cs.map((c) => (c.id === colId ? fn(c) : c)));
    const mapFolder = (colId, folderId, fn) => {
        const updateFolders = (folders) => (folders || []).map(f => {
            if (f.id === folderId) return fn(f);
            if (f.folders) return { ...f, folders: updateFolders(f.folders) };
            return f;
        });
        return mapCol(colId, (c) => ({ ...c, folders: updateFolders(c.folders) }));
    };

    return {
        addCollection: async (name) => {
            try {
                await CreateCollection({ workspace_id: activeWorkspaceId, name });
                refreshCollections();
            } catch (err) {
                console.error("Failed to create collection:", err);
            }
        },
        renameCollection: async (id, name) => {
            try {
                await RenameCollection(id, name);
                refreshCollection(id);
            } catch (err) {
                console.error("Failed to rename collection:", err);
            }
        },
        deleteCollection: async (id) => {
            try {
                const col = collections.find(c => c.id === id);
                if (!col) return;
                await DeleteCollection(id, col.name);
                refreshCollections();
            } catch (err) {
                console.error("Failed to delete collection:", err);
            }
        },
        toggleCollection: (id) => mapCol(id, (c) => ({ ...c, expanded: !c.expanded })),
        collapseCollection: (id) => mapCol(id, (c) => ({ ...c, expanded: false })),
        toggleFavorite: async (id) => {
            try {
                const col = collections.find(c => c.id === id);
                if (!col) return;
                await UpdateCollectionFavorite(id, !col.favorite);
                refreshCollection(id);
            } catch (err) {
                console.error("Failed to toggle favorite:", err);
            }
        },
        duplicateCollection: async (id) => {
            try {
                await DuplicateCollection(id);
                refreshCollections();
            } catch (err) {
                console.error("Failed to duplicate collection:", err);
            }
        },
        addFolder: async (colId, name, parentFolderId) => {
            try {
                const payload = { collection_id: colId, name };
                if (parentFolderId) payload.parent_id = parentFolderId;
                await CreateFolder(payload);
                refreshCollection(colId);
            } catch (err) { console.error("Failed to add folder", err); }
        },
        renameFolder: async (colId, folderId, name) => {
            try {
                await RenameFolder(folderId, { name });
                refreshCollection(colId);
            } catch (err) { console.error("Failed to rename folder", err); }
        },
        deleteFolder: async (colId, folderId) => {
            try {
                const col = collections.find(c => c.id === colId);
                const folder = col?.folders?.find(f => f.id === folderId);
                if (!folder) return;
                await DeleteFolder(folderId, folder.name);
                refreshCollection(colId);
            } catch (err) { console.error("Failed to delete folder", err); }
        },
        toggleFolder: (colId, folderId) => mapFolder(colId, folderId, (f) => ({ ...f, expanded: !f.expanded })),
        collapseFolder: (colId, folderId) => mapFolder(colId, folderId, (f) => ({ ...f, expanded: false })),
        duplicateFolder: async (colId, folderId) => {
            try {
                await DuplicateFolder(folderId);
                refreshCollection(colId);
            } catch (err) { console.error("Failed to duplicate folder", err); }
        },
        addRequest: async (colId, folderId, req) => {
            try {
                const reqData = {
                    collection_id: colId,
                    folder_id: folderId || null,
                    name: typeof req === 'string' ? req : req.name || 'New Request',
                    method: typeof req === 'string' ? 'GET' : req.method || 'GET',
                    url: typeof req === 'string' ? '' : req.url || '',
                    params: [], path_variables: [], auth: { type: 'none' }, headers: [], body: { type: 'none' }
                };
                await CreateRequest(reqData);
                refreshCollection(colId);
            } catch (err) { console.error("Failed to add request", err); }
        },
        renameRequest: async (colId, folderId, reqId, name) => {
            try {
                await RenameRequest(reqId, { name });
                refreshCollection(colId);
            } catch (err) { console.error("Failed to rename request", err); }
        },
        deleteRequest: async (colId, folderId, reqId) => {
            try {
                const col = collections.find(c => c.id === colId);
                const folder = col?.folders?.find(f => f.id === folderId);
                const req = folder?.requests?.find(r => r.id === reqId);
                await DeleteRequest(reqId, req?.method || 'GET', req?.name || 'Request');
                refreshCollection(colId);
            } catch (err) { console.error("Failed to delete request", err); }
        },
        duplicateRequest: async (colId, folderId, reqId) => {
            try {
                await DuplicateRequest(reqId);
                refreshCollection(colId);
            } catch (err) { console.error("Failed to duplicate request", err); }
        },

        // ---- Drag & drop moves (within the active workspace) ----
        moveRequest: (src, dest) =>
            setCollections((cs) => {
                let moved = null;
                const removed = cs.map((c) => ({
                    ...c,
                    folders: c.folders.map((f) => {
                        if (c.id === src.colId && f.id === src.folderId) {
                            moved = f.requests.find((r) => r.id === src.reqId) || moved;
                            return { ...f, requests: f.requests.filter((r) => r.id !== src.reqId) };
                        }
                        return f;
                    }),
                }));
                if (!moved) return cs;
                return removed.map((c) => {
                    if (c.id !== dest.colId) return c;
                    return {
                        ...c,
                        expanded: true,
                        folders: c.folders.map((f) => {
                            if (f.id !== dest.folderId) return f;
                            if (!dest.beforeReqId) return { ...f, expanded: true, requests: [...f.requests, moved] };
                            const arr = [...f.requests];
                            const i = arr.findIndex((r) => r.id === dest.beforeReqId);
                            arr.splice(i < 0 ? arr.length : i, 0, moved);
                            return { ...f, expanded: true, requests: arr };
                        }),
                    };
                });
            }),
        moveFolder: (src, dest) =>
            setCollections((cs) => {
                let moved = null;
                const removed = cs.map((c) =>
                    c.id === src.colId
                        ? { ...c, folders: c.folders.filter((f) => (f.id === src.folderId ? ((moved = f), false) : true)) }
                        : c,
                );
                if (!moved) return cs;
                return removed.map((c) => {
                    if (c.id !== dest.colId) return c;
                    const arr = [...c.folders];
                    if (!dest.beforeFolderId) arr.push(moved);
                    else {
                        const i = arr.findIndex((f) => f.id === dest.beforeFolderId);
                        arr.splice(i < 0 ? arr.length : i, 0, moved);
                    }
                    return { ...c, expanded: true, folders: arr };
                });
            }),
    };
}

// ---- Environment CRUD factory ----
function makeEnvironmentCrud({ setEnvironments, activeWorkspaceId, environments }) {
    return {
        addEnvironment: async (name) => {
            try {
                const res = await CreateEnvironment({ workspace_id: activeWorkspaceId, name, variables: [] });
                setEnvironments((es) => [...es, res]);
            } catch (err) {
                console.error("Failed to add environment", err);
            }
        },
        renameEnvironment: async (id, name) => {
            try {
                const env = environments.find(e => e.id === id);
                if (!env) return;
                const res = await UpdateEnvironment(id, { name, variables: env.variables || [] });
                setEnvironments((es) => es.map((e) => (e.id === id ? { ...e, name: res.name } : e)));
            } catch (err) {
                console.error("Failed to rename environment", err);
            }
        },
        deleteEnvironment: async (id) => {
            try {
                const env = environments.find(e => e.id === id);
                if (!env) return;
                await DeleteEnvironment(id, env.name);
                setEnvironments((es) => es.filter((e) => e.id !== id));
            } catch (err) {
                console.error("Failed to delete environment", err);
            }
        },
        setActiveEnvironment: (id) => setEnvironments((es) => es.map((e) => ({ ...e, active: e.id === id }))),
        duplicateEnvironment: async (id) => {
            try {
                const res = await DuplicateEnvironment(id);
                setEnvironments((es) => {
                    const idx = es.findIndex((e) => e.id === id);
                    if (idx < 0) return [...es, res];
                    const next = [...es];
                    next.splice(idx + 1, 0, res);
                    return next;
                });
            } catch (err) {
                console.error("Failed to duplicate environment", err);
            }
        },
        updateEnvironmentVariables: async (id, variables) => {
            try {
                const env = environments.find(e => e.id === id);
                if (!env) return;
                const res = await UpdateEnvironment(id, { name: env.name, variables });
                setEnvironments((es) => es.map((e) => (e.id === id ? { ...e, variables: res.variables } : e)));
            } catch (err) {
                console.error("Failed to update environment variables", err);
            }
        },
    };
}

// ---- Workspace CRUD factory ----
function makeWorkspaceCrud({ workspaces, setWorkspaces, activeWorkspaceId, setActiveWorkspaceId }) {
    return {
        addWorkspace: async (name) => {
            try {
                const res = await CreateWorkspace({ name });
                const newWs = { ...res, collections: [], environments: [] };
                setWorkspaces((prev) => [...prev, newWs]);
                setActiveWorkspaceId(newWs.id);
            } catch (err) {
                console.error("Failed to create workspace:", err);
            }
        },
        renameWorkspace: async (id, name) => {
            try {
                await RenameWorkspace(id, name);
                setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, name } : w)));
            } catch (err) {
                console.error("Failed to rename workspace:", err);
            }
        },
        deleteWorkspace: async (id) => {
            if (workspaces.length <= 1) return;
            const w = workspaces.find((ws) => ws.id === id);
            if (!w) return;
            try {
                await DeleteWorkspace(id, w.name);
                const remaining = workspaces.filter((ws) => ws.id !== id);
                setWorkspaces(remaining);
                if (id === activeWorkspaceId) setActiveWorkspaceId(remaining[0].id);
            } catch (err) {
                console.error("Failed to delete workspace:", err);
            }
        },
        selectWorkspace: (id) => setActiveWorkspaceId(id),
        // Move a collection from the active workspace to another workspace
        moveCollectionToWorkspace: (colId, targetWorkspaceId) =>
            setWorkspaces((prev) => {
                const source = prev.find((w) => w.id === activeWorkspaceId);
                const col = source?.collections.find((c) => c.id === colId);
                if (!col || targetWorkspaceId === activeWorkspaceId) return prev;
                return prev.map((w) => {
                    if (w.id === activeWorkspaceId) return { ...w, collections: w.collections.filter((c) => c.id !== colId) };
                    if (w.id === targetWorkspaceId) return { ...w, collections: [...w.collections, col] };
                    return w;
                });
            }),
    };
}

// Centralised workspace state composing focused CRUD factories.
// Each workspace owns its own collections and environments.
export function useWorkspaceData() {
    const [workspaces, setWorkspaces] = useState(() => loadState('workspaces', []));
    const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
        const saved = loadState('activeWorkspaceId', null);
        const list = loadState('workspaces', []);
        return list.length > 0 && list.some((w) => w.id === saved) ? saved : (list[0]?.id || null);
    });
    const [history, setHistory] = useState(() => loadState('history', []));

    useEffect(() => {
        ListWorkspaces().then(res => {
            if (res && res.length > 0) {
                setWorkspaces(prevWs => {
                    const mapped = res.map(w => {
                        const existing = prevWs.find(pw => pw.id === w.id);
                        return {
                            ...w,
                            collections: existing?.collections || [],
                            environments: existing?.environments || []
                        };
                    });
                    return mapped;
                });

                setActiveWorkspaceId(currentId => {
                    return res.some(w => w.id === currentId) ? currentId : res[0].id;
                });
            }
        }).catch(err => console.error("Failed to list workspaces", err));
    }, []);
    // Shallow list — used on workspace switch and after add/delete/duplicate collection
    const refreshCollections = useCallback(() => {
        if (!activeWorkspaceId) return;
        ListCollections(activeWorkspaceId).then(res => {
            const colList = res || [];
            setWorkspaces(prevWs => prevWs.map(w => {
                if (w.id !== activeWorkspaceId) return w;
                const oldCols = w.collections || [];
                const newCols = colList.map(c => {
                    const oldCol = oldCols.find(oc => oc.id === c.id);
                    return {
                        ...c,
                        favorite: c.is_favorite,
                        folders: oldCol?.folders ?? [],
                        requests: oldCol?.requests ?? [],
                        expanded: oldCol?.expanded ?? false
                    };
                });
                return { ...w, collections: newCols };
            }));
        }).catch(err => console.error("Failed to list collections:", err));
    }, [activeWorkspaceId]);

    // Detail fetch — used after any folder/request action on a specific collection
    const refreshCollection = useCallback((colId) => {
        if (!colId) return;
        GetCollection(colId).then(c => {
            setWorkspaces(prevWs => prevWs.map(w => {
                if (w.id !== activeWorkspaceId) return w;
                const oldCols = w.collections || [];
                const oldCol = oldCols.find(oc => oc.id === colId);

                const findFolder = (folders, id) => {
                    if (!folders) return undefined;
                    for (const f of folders) {
                        if (f.id === id) return f;
                        const found = findFolder(f.folders, id);
                        if (found) return found;
                    }
                    return undefined;
                };

                const mapItems = (items, parentExpanded) =>
                    (items || [])
                        .filter(item => item.type === 'folder')
                        .map(f => {
                            const oldFolder = findFolder(oldCol?.folders, f.id);
                            return {
                                ...f,
                                expanded: oldFolder !== undefined ? oldFolder.expanded : false,
                                requests: (f.items || []).filter(r => r.type === 'request'),
                                folders: mapItems(f.items, true)
                            };
                        });
                const updatedCol = {
                    ...c,
                    favorite: c.is_favorite,
                    folders: mapItems(c.items),
                    requests: (c.items || []).filter(item => item.type === 'request'),
                    expanded: oldCol !== undefined ? oldCol.expanded : false
                };
                return {
                    ...w,
                    collections: oldCols.map(oc => oc.id === colId ? updatedCol : oc)
                };
            }));
        }).catch(err => console.error("Failed to refresh collection:", err));
    }, [activeWorkspaceId]);

    useEffect(() => {
        if (!activeWorkspaceId) return;
        ListEnvironments(activeWorkspaceId).then(res => {
            setWorkspaces(prevWs => prevWs.map(w => {
                if (w.id === activeWorkspaceId) {
                    const oldEnvs = w.environments || [];
                    const activeEnvId = oldEnvs.find(e => e.active)?.id;
                    const newEnvs = (res || []).map(e => ({
                        ...e,
                        active: e.id === activeEnvId
                    }));
                    return { ...w, environments: newEnvs };
                }
                return w;
            }));
        }).catch(err => console.error("Failed to list environments:", err));

        refreshCollections();
    }, [activeWorkspaceId, refreshCollections]);
    useEffect(() => saveState('workspaces', workspaces), [workspaces]);
    useEffect(() => saveState('activeWorkspaceId', activeWorkspaceId), [activeWorkspaceId]);
    useEffect(() => saveState('history', history), [history]);

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || { collections: [], environments: [] };

    const setCollections = (updater) =>
        setWorkspaces((ws) =>
            ws.map((w) =>
                w.id === activeWorkspaceId
                    ? { ...w, collections: typeof updater === 'function' ? updater(w.collections) : updater }
                    : w,
            ),
        );
    const setEnvironments = (updater) =>
        setWorkspaces((ws) =>
            ws.map((w) =>
                w.id === activeWorkspaceId
                    ? { ...w, environments: typeof updater === 'function' ? updater(w.environments) : updater }
                    : w,
            ),
        );

    return {
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        collections: activeWorkspace.collections,
        environments: activeWorkspace.environments,
        history,
        setHistory,
        ...makeWorkspaceCrud({ workspaces, setWorkspaces, activeWorkspaceId, setActiveWorkspaceId }),
        ...makeCollectionCrud({ setCollections, activeWorkspaceId, collections: activeWorkspace.collections, refreshCollections, refreshCollection }),
        ...makeEnvironmentCrud({ setEnvironments, activeWorkspaceId, environments: activeWorkspace.environments }),
    };
}
