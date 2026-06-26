import { useState, useEffect } from 'react';
import { loadState, saveState } from '@/lib/persist';
import {
    initialWorkspaces,
    initialHistory,
    newWorkspace,
    newCollection,
    newFolder,
    newSavedRequest,
    newEnvironment,
    cloneCollection,
    cloneFolder,
    cloneEnvironment,
} from '@/data/mockData';
import {
    ListWorkspaces,
    CreateWorkspace,
    RenameWorkspace,
    DeleteWorkspace,
    ListEnvironments,
    CreateEnvironment,
    UpdateEnvironment,
    DeleteEnvironment,
    DuplicateEnvironment
} from '@/wailsjs/go/main/App';

// ---- Collection / folder / request CRUD factory ----
function makeCollectionCrud(setCollections) {
    const mapCol = (colId, fn) => setCollections((cs) => cs.map((c) => (c.id === colId ? fn(c) : c)));
    const mapFolder = (colId, folderId, fn) =>
        mapCol(colId, (c) => ({ ...c, folders: c.folders.map((f) => (f.id === folderId ? fn(f) : f)) }));

    const insertRequest = (col, folderId, req) => {
        let folders = col.folders;
        let targetId = folderId;
        if (folders.length === 0) {
            const f = newFolder('New Folder');
            folders = [f];
            targetId = f.id;
        } else if (!targetId) {
            targetId = folders[0].id;
        }
        return {
            ...col,
            expanded: true,
            folders: folders.map((f) =>
                f.id === targetId ? { ...f, expanded: true, requests: [...f.requests, newSavedRequest(req)] } : f,
            ),
        };
    };

    return {
        addCollection: (name) => setCollections((cs) => [...cs, newCollection(name)]),
        renameCollection: (id, name) => mapCol(id, (c) => ({ ...c, name })),
        deleteCollection: (id) => setCollections((cs) => cs.filter((c) => c.id !== id)),
        toggleCollection: (id) => mapCol(id, (c) => ({ ...c, expanded: !c.expanded })),
        collapseCollection: (id) => mapCol(id, (c) => ({ ...c, expanded: false })),
        toggleFavorite: (id) => mapCol(id, (c) => ({ ...c, favorite: !c.favorite })),
        duplicateCollection: (id) =>
            setCollections((cs) => {
                const idx = cs.findIndex((c) => c.id === id);
                if (idx < 0) return cs;
                const copy = cloneCollection(cs[idx]);
                const next = [...cs];
                next.splice(idx + 1, 0, copy);
                return next;
            }),
        addFolder: (colId, name) => mapCol(colId, (c) => ({ ...c, expanded: true, folders: [...c.folders, newFolder(name)] })),
        renameFolder: (colId, folderId, name) => mapFolder(colId, folderId, (f) => ({ ...f, name })),
        deleteFolder: (colId, folderId) => mapCol(colId, (c) => ({ ...c, folders: c.folders.filter((f) => f.id !== folderId) })),
        toggleFolder: (colId, folderId) => mapFolder(colId, folderId, (f) => ({ ...f, expanded: !f.expanded })),
        collapseFolder: (colId, folderId) => mapFolder(colId, folderId, (f) => ({ ...f, expanded: false })),
        duplicateFolder: (colId, folderId) =>
            mapCol(colId, (c) => {
                const idx = c.folders.findIndex((f) => f.id === folderId);
                if (idx < 0) return c;
                const copy = cloneFolder(c.folders[idx]);
                const folders = [...c.folders];
                folders.splice(idx + 1, 0, copy);
                return { ...c, folders };
            }),
        addRequest: (colId, folderId, req) => mapCol(colId, (c) => insertRequest(c, folderId, req)),
        renameRequest: (colId, folderId, reqId, name) =>
            mapFolder(colId, folderId, (f) => ({ ...f, requests: f.requests.map((r) => (r.id === reqId ? { ...r, name } : r)) })),
        deleteRequest: (colId, folderId, reqId) =>
            mapFolder(colId, folderId, (f) => ({ ...f, requests: f.requests.filter((r) => r.id !== reqId) })),

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
    const [workspaces, setWorkspaces] = useState(() => loadState('workspaces', initialWorkspaces));
    const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
        const saved = loadState('activeWorkspaceId', null);
        const list = loadState('workspaces', initialWorkspaces);
        return list.some((w) => w.id === saved) ? saved : list[0].id;
    });
    const [history, setHistory] = useState(() => loadState('history', initialHistory));

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
    }, [activeWorkspaceId]);
    useEffect(() => saveState('workspaces', workspaces), [workspaces]);
    useEffect(() => saveState('activeWorkspaceId', activeWorkspaceId), [activeWorkspaceId]);
    useEffect(() => saveState('history', history), [history]);

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

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
        ...makeCollectionCrud(setCollections),
        ...makeEnvironmentCrud({ setEnvironments, activeWorkspaceId, environments: activeWorkspace.environments }),
    };
}
