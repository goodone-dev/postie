// Tiny localStorage helpers for persisting Postie state across reloads.
const PREFIX = 'postie:';

export function loadState(key, fallback) {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw == null) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function saveState(key, value) {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
        // Ignore quota / serialization errors — persistence is best-effort.
    }
}
