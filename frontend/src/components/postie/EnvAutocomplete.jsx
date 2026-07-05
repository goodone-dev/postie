import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

// ─── hook ──────────────────────────────────────────────────────────────────

/**
 * useEnvAutocomplete
 *
 * Attach to any <input> or <textarea> to get {{ autocomplete behaviour.
 *
 * @param {Array<{key:string,value:string}>} envVariables
 * @param {(selected:string)=>void} onSelect  called with the raw key (without braces)
 */
export function useEnvAutocomplete(envVariables = [], onSelect) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    // Portal position: coordinates of the dropdown anchor
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    const filtered = (envVariables || []).filter(
        (v) => v.key && (!query || v.key.toLowerCase().includes(query.toLowerCase()))
    );

    // Detect {{ pattern at the current caret position
    const getQueryAtCaret = useCallback((el) => {
        const val = el.value;
        const caret = el.selectionStart ?? val.length;
        const before = val.slice(0, caret);
        const matchIdx = before.lastIndexOf('{{');
        if (matchIdx === -1) return null;
        const between = before.slice(matchIdx + 2);
        if (between.includes('}}')) return null;
        return between;
    }, []);

    // Compute and cache dropdown position from input's bounding rect
    const updatePosition = useCallback(() => {
        const el = inputRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setDropdownPos({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: Math.max(rect.width, 240),
        });
    }, []);

    const handleInput = useCallback((e) => {
        const q = getQueryAtCaret(e.target);
        if (q !== null) {
            setQuery(q);
            setActiveIndex(0);
            updatePosition();
            setOpen(true);
        } else {
            setOpen(false);
        }
    }, [getQueryAtCaret, updatePosition]);

    const handleKeyDown = useCallback((e) => {
        if (!open) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            if (filtered[activeIndex]) {
                e.preventDefault();
                commitSelection(filtered[activeIndex].key);
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    }, [open, filtered, activeIndex]); // eslint-disable-line

    const commitSelection = useCallback((key) => {
        const el = inputRef.current;
        if (!el) return;
        const val = el.value;
        const caret = el.selectionStart ?? val.length;
        const before = val.slice(0, caret);
        const matchIdx = before.lastIndexOf('{{');
        const after = val.slice(caret);
        const newVal = before.slice(0, matchIdx) + `{{${key}}}` + after;
        // Trigger React's synthetic change
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
            'value'
        )?.set;
        nativeInputValueSetter?.call(el, newVal);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        // Move caret after }}
        const newCaret = matchIdx + key.length + 4;
        requestAnimationFrame(() => {
            el.setSelectionRange(newCaret, newCaret);
            el.focus();
        });
        setOpen(false);
        onSelect?.(key);
    }, [onSelect]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                inputRef.current && !inputRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Reposition on scroll / resize while open
    useEffect(() => {
        if (!open) return;
        const reposition = () => updatePosition();
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [open, updatePosition]);

    // Scroll active item into view inside the dropdown
    useEffect(() => {
        if (!open || !dropdownRef.current) return;
        const active = dropdownRef.current.querySelector('[data-active="true"]');
        active?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, open]);

    return {
        inputRef,
        dropdownRef,
        open: open && filtered.length > 0,
        filtered,
        activeIndex,
        dropdownPos,
        handleInput,
        handleKeyDown,
        commitSelection,
        setOpen,
    };
}

// ─── portal dropdown UI ─────────────────────────────────────────────────────

/**
 * EnvDropdown
 *
 * Renders via a React portal directly into document.body so it escapes
 * any overflow:hidden ancestor (e.g. KeyValueEditor's card container).
 * Position is supplied as absolute page coordinates from getBoundingClientRect.
 */
export const EnvDropdown = ({ dropdownRef, open, filtered, activeIndex, onSelect, pos }) => {
    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div
            ref={dropdownRef}
            className="fixed z-[9999] rounded-lg border border-border bg-card shadow-elegant overflow-hidden"
            style={{
                top: pos.top,
                left: pos.left,
                width: pos.width,
                minWidth: 220,
                maxWidth: 360,
            }}
        >
            {/* Header */}
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-secondary/60 border-b border-border">
                Environment Variables
            </div>
            <div className="max-h-52 overflow-y-auto scrollbar-thin">
                {filtered.map((v, i) => (
                    <button
                        key={v.key}
                        data-active={i === activeIndex ? 'true' : 'false'}
                        onMouseDown={(e) => {
                            e.preventDefault(); // prevent blur before commit
                            onSelect(v.key);
                        }}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                            i === activeIndex
                                ? 'bg-primary/15 text-foreground'
                                : 'hover:bg-secondary/60 text-foreground'
                        }`}
                    >
                        <span className="mono text-[13px] font-medium text-primary truncate flex-shrink-0 max-w-[45%]">
                            {v.key}
                        </span>
                        <span className="text-[12px] text-muted-foreground truncate min-w-0">
                            {v.value || <span className="italic opacity-50">empty</span>}
                        </span>
                    </button>
                ))}
            </div>
        </div>,
        document.body
    );
};

// ─── convenience wrappers ───────────────────────────────────────────────────

/**
 * EnvInput — drop-in replacement for <input> with {{ autocomplete.
 */
export const EnvInput = ({ envVariables, onChange, className, ...props }) => {
    const {
        inputRef, dropdownRef, open, filtered, activeIndex,
        dropdownPos, handleInput, handleKeyDown, commitSelection,
    } = useEnvAutocomplete(envVariables);

    return (
        <>
            <input
                ref={inputRef}
                {...props}
                className={className}
                onChange={(e) => {
                    handleInput(e);
                    onChange?.(e);
                }}
                onKeyDown={(e) => {
                    handleKeyDown(e);
                    props.onKeyDown?.(e);
                }}
            />
            <EnvDropdown
                dropdownRef={dropdownRef}
                open={open}
                filtered={filtered}
                activeIndex={activeIndex}
                onSelect={commitSelection}
                pos={dropdownPos}
            />
        </>
    );
};

/**
 * EnvTextarea — drop-in replacement for <textarea> with {{ autocomplete.
 */
export const EnvTextarea = ({ envVariables, onChange, className, ...props }) => {
    const {
        inputRef, dropdownRef, open, filtered, activeIndex,
        dropdownPos, handleInput, handleKeyDown, commitSelection,
    } = useEnvAutocomplete(envVariables);

    return (
        <>
            <textarea
                ref={inputRef}
                {...props}
                className={className}
                onChange={(e) => {
                    handleInput(e);
                    onChange?.(e);
                }}
                onKeyDown={(e) => {
                    handleKeyDown(e);
                    props.onKeyDown?.(e);
                }}
            />
            <EnvDropdown
                dropdownRef={dropdownRef}
                open={open}
                filtered={filtered}
                activeIndex={activeIndex}
                onSelect={commitSelection}
                pos={dropdownPos}
            />
        </>
    );
};
