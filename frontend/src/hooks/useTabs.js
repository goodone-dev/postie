import { useState, useCallback, useEffect } from 'react';
import { loadState, saveState } from '@/lib/persist';

const newRequestTemplate = (overrides = {}) => ({
    id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'request',
    // sourceId: the backend request ID (uuid) if this tab was opened from a collection
    sourceId: overrides.sourceId || null,
    colId: overrides.colId || null,
    folderId: overrides.folderId || null,
    name: overrides.name || 'Untitled Request',
    method: overrides.method || 'GET',
    url: overrides.url || '',
    params: overrides.params || [{ id: 'p1', key: '', value: '', description: '', enabled: true }],
    headers: overrides.headers || [
        { id: 'h1', key: 'Accept', value: 'application/json', description: '', enabled: true },
        { id: 'h2', key: '', value: '', description: '', enabled: true },
    ],
    body: overrides.body || '',
    bodyType: overrides.bodyType || 'none',
    auth: overrides.auth || { type: 'none' },
    response: null,
    isSending: false,
    isDirty: false,
    activeTab: 'params',
});

const DEFAULT_TAB = () =>
    newRequestTemplate({
        name: 'Get user by ID',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/users/1',
    });

// Manages open tabs (request + environment editor), the active tab, and lifecycle.
export function useTabs() {
    const [tabs, setTabs] = useState(() => {
        const saved = loadState('tabs', null);
        return Array.isArray(saved) && saved.length > 0 ? saved : [DEFAULT_TAB()];
    });
    const [activeTabId, setActiveTabId] = useState(() => {
        const saved = loadState('activeTabId', null);
        return tabs.some((t) => t.id === saved) ? saved : tabs[0].id;
    });

    useEffect(() => saveState('tabs', tabs), [tabs]);
    useEffect(() => saveState('activeTabId', activeTabId), [activeTabId]);

    const activeTab = tabs.find((t) => t.id === activeTabId);

    const updateTab = useCallback((patch) => {
        setTabs((ts) => ts.map((t) => (t.id === patch.id ? { ...patch, isDirty: true } : t)));
    }, []);

    const markClean = useCallback((id) => {
        setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, isDirty: false } : t)));
    }, []);

    const openRequest = useCallback(
        (req) => {
            // If req has a sourceId (backend UUID), check if already open by sourceId
            if (req.sourceId) {
                const existing = tabs.find((t) => t.type === 'request' && t.sourceId === req.sourceId);
                if (existing) {
                    setActiveTabId(existing.id);
                    return;
                }
            } else {
                // Fallback: match by name+method+url for non-collection requests
                const existing = tabs.find(
                    (t) => t.type === 'request' && !t.sourceId && t.url === req.url && t.method === req.method && t.name === req.name,
                );
                if (existing) {
                    setActiveTabId(existing.id);
                    return;
                }
            }
            const newReq = newRequestTemplate(req);
            setTabs((ts) => [...ts, newReq]);
            setActiveTabId(newReq.id);
        },
        [tabs],
    );

    // Open (or focus) an environment editor tab. Stable id per environment.
    const openEnvironmentTab = useCallback((env) => {
        const id = `envtab-${env.id}`;
        setTabs((ts) => {
            if (ts.some((t) => t.id === id)) return ts;
            return [...ts, { id, type: 'environment', envId: env.id, name: env.name }];
        });
        setActiveTabId(id);
    }, []);

    const newTab = useCallback(() => {
        const t = newRequestTemplate({});
        setTabs((ts) => [...ts, t]);
        setActiveTabId(t.id);
    }, []);

    // Duplicate a tab (request tabs only; env tabs are singletons by env id).
    const duplicateTab = useCallback(
        (id) => {
            const src = tabs.find((t) => t.id === id);
            if (!src || src.type !== 'request') return;
            const copy = { ...src, id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`, response: null, isSending: false };
            const idx = tabs.findIndex((t) => t.id === id);
            const next = [...tabs];
            next.splice(idx + 1, 0, copy);
            setTabs(next);
            setActiveTabId(copy.id);
        },
        [tabs],
    );

    // Close every tab except the given one.
    const closeOthers = useCallback((id) => {
        setTabs((ts) => ts.filter((t) => t.id === id));
        setActiveTabId(id);
    }, []);

    // Close all tabs -> open a single fresh request tab.
    const closeAll = useCallback(() => {
        const fresh = newRequestTemplate({});
        setTabs([fresh]);
        setActiveTabId(fresh.id);
    }, []);

    // Closing the last tab opens a fresh one. State is computed from the
    // current render values (never inside a setState updater) so activeTabId
    // always matches the newly-created tab and the panels never go blank.
    const closeTab = useCallback(
        (id) => {
            const idx = tabs.findIndex((t) => t.id === id);
            const next = tabs.filter((t) => t.id !== id);
            if (next.length === 0) {
                const fresh = newRequestTemplate({});
                setTabs([fresh]);
                setActiveTabId(fresh.id);
                return;
            }
            setTabs(next);
            if (id === activeTabId) {
                setActiveTabId(next[Math.max(0, idx - 1)].id);
            }
        },
        [tabs, activeTabId],
    );

    return {
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
    };
}
