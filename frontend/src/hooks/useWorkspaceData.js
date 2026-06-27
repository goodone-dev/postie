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
    MoveCollection,
    CreateFolder,
    RenameFolder,
    DeleteFolder,
    DuplicateFolder,
    CreateRequest,
    RenameRequest,
    DeleteRequest,
    DuplicateRequest
} from '@/wailsjs/go/main/App';

// ---- helpers ----
const mapCol = (setCollections, colId, fn) =>
    setCollections((cs) => cs.map((c) => (c.id === colId ? fn(c) : c)));

const mapFolder = (setCollections, colId, folderId, fn) => {
    const updateFolders = (folders) =>
        (folders || []).map((f) => {
            if (f.id === folderId) return fn(f);
            if (f.folders) return { ...f, folders: updateFolders(f.folders) };
            return f;
        });
    mapCol(setCollections, colId, (c) => ({ ...c, folders: updateFolders(c.folders) }));
};

const findFolder = (folders, id) => {
    if (!folders) return undefined;
    for (const f of folders) {
        if (f.id === id) return f;
        const found = findFolder(f.folders, id);
        if (found) return found;
    }
    return undefined;
};

const updateRequestInFolders = (folders, reqId, patch) => {
    return folders.map((f) => ({
        ...f,
        requests: (f.requests || []).map((r) => r.id === reqId ? { ...r, ...patch } : r),
        folders: updateRequestInFolders(f.folders || [], reqId, patch),
    }));
};

// ---- Collection / folder / request CRUD factory ----
function makeCollectionCrud({ collections, setCollections, activeWorkspaceId }) {
    return {
        // ---- Collections ----
        addCollection: async (name) => {
            try {
                const res = await CreateCollection({ workspace_id: activeWorkspaceId, name });
                setCollections((cs) => [...cs, {
                    ...res,
                    favorite: res.is_favorite ?? false,
                    folders: res.folders ?? [],
                    requests: res.requests ?? [],
                    expanded: false,
                    loaded: false,
                }]);
            } catch (err) {
                console.error("Failed to create collection:", err);
            }
        },
        renameCollection: async (id, name) => {
            try {
                await RenameCollection(id, name);
                mapCol(setCollections, id, (c) => ({ ...c, name }));
            } catch (err) {
                console.error("Failed to rename collection:", err);
            }
        },
        deleteCollection: async (id) => {
            try {
                const col = collections.find((c) => c.id === id);
                if (!col) return;
                await DeleteCollection(id, col.name);
                setCollections((cs) => cs.filter((c) => c.id !== id));
            } catch (err) {
                console.error("Failed to delete collection:", err);
            }
        },
        // Toggle open: fetch full data on first open, then just flip expanded flag
        toggleCollection: async (id) => {
            try {
                const col = collections.find((c) => c.id === id);
                const willExpand = !col?.expanded;
                if (willExpand && !col?.loaded) {
                    const c = await GetCollection(id);
                    setCollections((cs) => {
                        const old = cs.find((oc) => oc.id === id);
                        const mapFolders = (folders) =>
                            (folders || []).map((f) => {
                                const oldFolder = findFolder(old?.folders, f.id);
                                return {
                                    ...f,
                                    expanded: oldFolder?.expanded ?? false,
                                    folders: mapFolders(f.folders),
                                    requests: f.requests || [],
                                };
                            });
                        const updated = {
                            ...c,
                            favorite: c.is_favorite,
                            folders: mapFolders(c.folders),
                            requests: c.requests || [],
                            expanded: true,
                            loaded: true,
                        };
                        return cs.map((oc) => (oc.id === id ? updated : oc));
                    });
                } else {
                    mapCol(setCollections, id, (c) => ({ ...c, expanded: willExpand }));
                }
            } catch (err) {
                console.error("Failed to toggle collection:", err);
            }
        },
        collapseCollection: (id) => mapCol(setCollections, id, (c) => ({ ...c, expanded: false })),
        toggleFavorite: async (id) => {
            try {
                const col = collections.find((c) => c.id === id);
                if (!col) return;
                const newFav = !col.favorite;
                await UpdateCollectionFavorite(id, newFav);
                mapCol(setCollections, id, (c) => ({ ...c, favorite: newFav }));
            } catch (err) {
                console.error("Failed to toggle favorite:", err);
            }
        },
        duplicateCollection: async (id) => {
            try {
                const res = await DuplicateCollection(id);
                setCollections((cs) => {
                    const idx = cs.findIndex((c) => c.id === id);
                    const newCol = {
                        ...res,
                        favorite: res.is_favorite ?? false,
                        folders: res.folders ?? [],
                        requests: res.requests ?? [],
                        expanded: false,
                        loaded: false,
                    };
                    if (idx < 0) return [...cs, newCol];
                    const next = [...cs];
                    next.splice(idx + 1, 0, newCol);
                    return next;
                });
            } catch (err) {
                console.error("Failed to duplicate collection:", err);
            }
        },
        moveCollection: async (colId, targetWorkspaceId) => {
            try {
                await MoveCollection(colId, { target_workspace_id: targetWorkspaceId });
                setCollections((cs) => cs.filter((c) => c.id !== colId));
            } catch (err) {
                console.error("Failed to move collection:", err);
            }
        },

        // ---- Folders ----
        addFolder: async (colId, name, parentFolderId) => {
            try {
                const payload = { collection_id: colId, name };
                if (parentFolderId) payload.parent_id = parentFolderId;
                const res = await CreateFolder(payload);
                const newFolder = { ...res, expanded: false, folders: res.folders ?? [], requests: res.requests ?? [] };
                if (parentFolderId) {
                    mapFolder(setCollections, colId, parentFolderId, (f) => ({
                        ...f,
                        folders: [...(f.folders || []), newFolder],
                    }));
                } else {
                    mapCol(setCollections, colId, (c) => ({
                        ...c,
                        folders: [...(c.folders || []), newFolder],
                    }));
                }
            } catch (err) {
                console.error("Failed to add folder", err);
            }
        },
        renameFolder: async (colId, folderId, name) => {
            try {
                await RenameFolder(folderId, { name });
                mapFolder(setCollections, colId, folderId, (f) => ({ ...f, name }));
            } catch (err) {
                console.error("Failed to rename folder", err);
            }
        },
        deleteFolder: async (colId, folderId) => {
            try {
                const col = collections.find((c) => c.id === colId);
                const folder = findFolder(col?.folders, folderId);
                if (!folder) return;
                await DeleteFolder(folderId, folder.name);
                const removeFolderFromList = (folders) =>
                    (folders || [])
                        .filter((f) => f.id !== folderId)
                        .map((f) => ({ ...f, folders: removeFolderFromList(f.folders) }));
                mapCol(setCollections, colId, (c) => ({
                    ...c,
                    folders: removeFolderFromList(c.folders),
                }));
            } catch (err) {
                console.error("Failed to delete folder", err);
            }
        },
        toggleFolder: (colId, folderId) => mapFolder(setCollections, colId, folderId, (f) => ({ ...f, expanded: !f.expanded })),
        collapseFolder: (colId, folderId) => mapFolder(setCollections, colId, folderId, (f) => ({ ...f, expanded: false })),
        duplicateFolder: async (colId, folderId) => {
            try {
                const res = await DuplicateFolder(folderId);
                const newFolder = { ...res, expanded: false, folders: res.folders ?? [], requests: res.requests ?? [] };
                mapCol(setCollections, colId, (c) => {
                    const insertAfter = (folders) => {
                        const out = [];
                        for (const f of folders || []) {
                            out.push({ ...f, folders: insertAfter(f.folders) });
                            if (f.id === folderId) out.push(newFolder);
                        }
                        return out;
                    };
                    return { ...c, folders: insertAfter(c.folders) };
                });
            } catch (err) {
                console.error("Failed to duplicate folder", err);
            }
        },

        // ---- Requests ----
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
                const res = await CreateRequest(reqData);
                if (folderId) {
                    mapFolder(setCollections, colId, folderId, (f) => ({
                        ...f,
                        requests: [...(f.requests || []), res],
                    }));
                } else {
                    mapCol(setCollections, colId, (c) => ({
                        ...c,
                        requests: [...(c.requests || []), res],
                    }));
                }
            } catch (err) {
                console.error("Failed to add request", err);
            }
        },
        renameRequest: async (colId, folderId, reqId, name) => {
            try {
                await RenameRequest(reqId, { name });
                if (folderId) {
                    mapFolder(setCollections, colId, folderId, (f) => ({
                        ...f,
                        requests: (f.requests || []).map((r) => (r.id === reqId ? { ...r, name } : r)),
                    }));
                } else {
                    mapCol(setCollections, colId, (c) => ({
                        ...c,
                        requests: (c.requests || []).map((r) => (r.id === reqId ? { ...r, name } : r)),
                    }));
                }
            } catch (err) {
                console.error("Failed to rename request", err);
            }
        },
        deleteRequest: async (colId, folderId, reqId) => {
            try {
                const col = collections.find((c) => c.id === colId);
                const folder = folderId ? findFolder(col?.folders, folderId) : null;
                const req = (folder?.requests ?? col?.requests ?? []).find((r) => r.id === reqId);
                await DeleteRequest(reqId, req?.method || 'GET', req?.name || 'Request');
                if (folderId) {
                    mapFolder(setCollections, colId, folderId, (f) => ({
                        ...f,
                        requests: (f.requests || []).filter((r) => r.id !== reqId),
                    }));
                } else {
                    mapCol(setCollections, colId, (c) => ({
                        ...c,
                        requests: (c.requests || []).filter((r) => r.id !== reqId),
                    }));
                }
            } catch (err) {
                console.error("Failed to delete request", err);
            }
        },
        duplicateRequest: async (colId, folderId, reqId) => {
            try {
                const res = await DuplicateRequest(reqId);
                if (folderId) {
                    mapFolder(setCollections, colId, folderId, (f) => {
                        const reqs = [...(f.requests || [])];
                        const idx = reqs.findIndex((r) => r.id === reqId);
                        reqs.splice(idx < 0 ? reqs.length : idx + 1, 0, res);
                        return { ...f, requests: reqs };
                    });
                } else {
                    mapCol(setCollections, colId, (c) => {
                        const reqs = [...(c.requests || [])];
                        const idx = reqs.findIndex((r) => r.id === reqId);
                        reqs.splice(idx < 0 ? reqs.length : idx + 1, 0, res);
                        return { ...c, requests: reqs };
                    });
                }
            } catch (err) {
                console.error("Failed to duplicate request", err);
            }
        },
        updateRequest: (reqId, patch) => {
            setCollections((cs) =>
                cs.map((c) => ({
                    ...c,
                    folders: updateRequestInFolders(c.folders || [], reqId, patch),
                    requests: (c.requests || []).map((r) => r.id === reqId ? { ...r, ...patch } : r),
                }))
            );
        },

        // ---- Drag & drop moves (within the active workspace) ----
        moveRequest: (src, dest) =>
            setCollections((cs) => {
                let moved = null;
                const removed = cs.map((c) => ({
                    ...c,
                    folders: (c.folders || []).map((f) => {
                        if (c.id === src.colId && f.id === src.folderId) {
                            moved = (f.requests || []).find((r) => r.id === src.reqId) || moved;
                            return { ...f, requests: (f.requests || []).filter((r) => r.id !== src.reqId) };
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
                        folders: (c.folders || []).map((f) => {
                            if (f.id !== dest.folderId) return f;
                            const reqs = f.requests || [];
                            if (!dest.beforeReqId) return { ...f, expanded: true, requests: [...reqs, moved] };
                            const arr = [...reqs];
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
                        ? { ...c, folders: (c.folders || []).filter((f) => (f.id === src.folderId ? ((moved = f), false) : true)) }
                        : c,
                );
                if (!moved) return cs;
                return removed.map((c) => {
                    if (c.id !== dest.colId) return c;
                    const arr = [...(c.folders || [])];
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
function makeEnvironmentCrud({ environments, setEnvironments, activeWorkspaceId, setActiveEnvironmentId }) {
    return {
        createEnvironment: async (name) => {
            if (!activeWorkspaceId) return;
            const payload = { workspace_id: activeWorkspaceId, name: name || 'New Environment' };
            try {
                const res = await CreateEnvironment(payload);
                setEnvironments((es) => [...es, res]);
            } catch (err) {
                console.error("CreateEnvironment failed:", err);
            }
        },
        updateEnvironment: async (id, patch) => {
            try {
                if (patch.active !== undefined) {
                    if (setActiveEnvironmentId) setActiveEnvironmentId(patch.active ? id : null);
                    setEnvironments((es) => es.map((e) => ({ ...e, active: e.id === id })));
                } else {
                    const res = await UpdateEnvironment(id, { name: patch.name });
                    setEnvironments((es) => es.map((e) => (e.id === id ? { ...e, ...res } : e)));
                }
            } catch (err) {
                console.error("UpdateEnvironment failed:", err);
            }
        },
        deleteEnvironment: async (id) => {
            try {
                await DeleteEnvironment(id, activeWorkspaceId);
                setEnvironments((es) => es.filter((e) => e.id !== id));
            } catch (err) {
                console.error("DeleteEnvironment failed:", err);
            }
        },
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
        setActiveEnvironment: (id) => {
            setActiveEnvironmentId(id ?? null);
            setEnvironments((es) => es.map((e) => ({ ...e, active: e.id === id })));
        },
        updateEnvironmentVariables: async (id, variables) => {
            try {
                const env = environments.find((e) => e.id === id);
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
function makeWorkspaceCrud({ workspaces, setWorkspaces, activeWorkspaceId, setActiveWorkspaceId, setCollections }) {
    return {
        addWorkspace: async (name) => {
            try {
                const res = await CreateWorkspace({ name });
                const newWs = { ...res };
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
    };
}

// Centralised workspace state composing focused CRUD factories.
export function useWorkspaceData() {
    const [workspaces, setWorkspaces] = useState([]);
    const [collections, setCollections] = useState([]);
    const [environments, setEnvironments] = useState([]);
    const [history, setHistory] = useState(() => loadState('history', []));

    const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => loadState('activeWorkspaceId', null));
    const [activeEnvironmentId, setActiveEnvironmentId] = useState(() => loadState('activeEnvironmentId', null));

    // Load workspaces once on mount
    useEffect(() => {
        ListWorkspaces().then((res) => {
            if (res && res.length > 0) {
                setWorkspaces(res);
                setActiveWorkspaceId((currentId) =>
                    res.some((w) => w.id === currentId) ? currentId : res[0].id
                );
            }
        }).catch((err) => console.error("Failed to list workspaces", err));
    }, []);

    // Load collections & environments whenever the active workspace changes
    useEffect(() => {
        if (!activeWorkspaceId) return;

        ListCollections(activeWorkspaceId).then((res) => {
            const colList = res || [];
            setCollections(
                colList.map((c) => ({
                    ...c,
                    favorite: c.is_favorite,
                    folders: c.folders ?? [],
                    requests: c.requests ?? [],
                    expanded: false,
                    loaded: false,
                }))
            );
        }).catch((err) => console.error("Failed to list collections:", err));

        ListEnvironments(activeWorkspaceId).then((res) => {
            const savedEnvId = loadState('activeEnvironmentId', null);
            setEnvironments(
                (res || []).map((e) => ({ ...e, active: e.id === savedEnvId }))
            );
        }).catch((err) => console.error("Failed to list environments:", err));
    }, [activeWorkspaceId]);

    useEffect(() => saveState('activeWorkspaceId', activeWorkspaceId), [activeWorkspaceId]);
    useEffect(() => saveState('activeEnvironmentId', activeEnvironmentId), [activeEnvironmentId]);
    useEffect(() => saveState('history', history), [history]);

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || {};

    return {
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        collections,
        environments,
        history,
        setHistory,
        ...makeWorkspaceCrud({ workspaces, setWorkspaces, activeWorkspaceId, setActiveWorkspaceId, setCollections }),
        ...makeCollectionCrud({ collections, setCollections, activeWorkspaceId }),
        ...makeEnvironmentCrud({ environments, setEnvironments, activeWorkspaceId, setActiveEnvironmentId }),
    };
}
