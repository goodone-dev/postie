import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

const EnvInput = ({ value, onChange, placeholder, style, onFocus, onBlur, onKeyDown, activeEnvironment, testId }) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const backdropRef = useRef(null);
  const optionsListRef = useRef(null);
  const isFocusedRef = useRef(false);
  const pendingCursorRef = useRef(null);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalValue(value || '');
    }
  }, [value]);

  useLayoutEffect(() => {
    if (pendingCursorRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursorRef.current, pendingCursorRef.current);
      pendingCursorRef.current = null;
    }
  }, [localValue]);

  useEffect(() => {
    if (!optionsListRef.current) return;
    const selected = optionsListRef.current.children[selectedIndex];
    if (selected) selected.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const envVars = (activeEnvironment?.variables || [])
    .filter(v => v.enabled && v.key)
    .map(v => ({ key: v.key, value: v.value || '' }));

  const envVarKeys = envVars.map(v => v.key);

  const handleScroll = (e) => {
    if (backdropRef.current) backdropRef.current.scrollLeft = e.target.scrollLeft;
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/\{\{([^{}]*)$/);

    if (match) {
      const search = match[1].toLowerCase();
      const filtered = envVars.filter(v => v.key.toLowerCase().includes(search));
      if (filtered.length > 0) {
        setOptions(filtered);
        setShowOptions(true);
        setSelectedIndex(0);
      } else {
        setShowOptions(false);
      }
    } else {
      setShowOptions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (showOptions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(s => (s + 1) % options.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(s => (s - 1 + options.length) % options.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertOption(options[selectedIndex].key);
      } else if (e.key === 'Escape') {
        setShowOptions(false);
      }
    } else {
      if (onKeyDown) onKeyDown(e);
    }
  };

  const insertOption = (optKey) => {
    if (!inputRef.current) return;
    const input = inputRef.current;
    const cursor = input.selectionStart;
    const textBeforeCursor = localValue.slice(0, cursor);
    const match = textBeforeCursor.match(/\{\{([^{}]*)$/);
    if (match) {
      const start = textBeforeCursor.lastIndexOf('{{');
      input.setRangeText(`{{${optKey}}}`, start, cursor, 'end');
      const newVal = input.value;
      pendingCursorRef.current = input.selectionStart;
      setShowOptions(false);
      input.focus();
      setLocalValue(newVal);
      onChange(newVal);
    }
  };

  const renderBackdrop = () => {
    const parts = (localValue || '').split(/(\{\{[^{}]*\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const varName = part.slice(2, -2);
        const exists = envVarKeys.includes(varName);
        return (
          <span key={i} style={{
            color: exists ? '#4da2ff' : '#f93e3e',
            background: exists ? 'rgba(77,162,255,0.12)' : 'rgba(249,62,62,0.12)',
            borderRadius: 3,
          }}>{part}</span>
        );
      }
      return <span key={i} style={{ color: '#e0e0e0' }}>{part}</span>;
    });
  };

  const getHorizPad = (padding) => {
    if (!padding) return '12px';
    const parts = String(padding).trim().split(/\s+/);
    return parts.length === 1 ? parts[0] : parts[1];
  };

  const { flex, width, minWidth, ...inputStyleObj } = style || {};

  return (
    <div style={{ position: 'relative', flex, width: width || '100%', minWidth, boxSizing: 'border-box' }}>
      <div
        ref={backdropRef}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: getHorizPad(inputStyleObj.padding),
          paddingRight: getHorizPad(inputStyleObj.padding),
          border: inputStyleObj.border || '1px solid transparent',
          fontFamily: inputStyleObj.fontFamily || '"Fira Code", monospace',
          fontSize: inputStyleObj.fontSize || '13px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          color: 'transparent',
          backgroundColor: inputStyleObj.background || '#2d2d2d',
          borderRadius: inputStyleObj.borderRadius || '4px',
          lineHeight: inputStyleObj.lineHeight || 'normal',
          zIndex: 0,
        }}
      >
        <span style={{ whiteSpace: 'pre', pointerEvents: 'none' }}>
          {renderBackdrop()}
        </span>
      </div>

      <input
        ref={inputRef}
        value={localValue}
        onChange={handleInput}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        data-testid={testId}
        onFocus={e => {
          isFocusedRef.current = true;
          setIsFocused(true);
          if (onFocus) onFocus(e);
        }}
        onBlur={e => {
          isFocusedRef.current = false;
          setTimeout(() => setIsFocused(false), 200);
          if (onBlur) onBlur(e);
        }}
        style={{
          ...inputStyleObj,
          color: 'transparent',
          caretColor: '#e0e0e0',
          background: 'transparent',
          position: 'relative',
          width: '100%',
          boxSizing: 'border-box',
          outline: 'none',
          zIndex: 1,
        }}
      />

      {showOptions && isFocused && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 9999,
          background: '#1c1c1c',
          border: '1px solid #353535',
          borderRadius: 8,
          minWidth: 260,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '7px 12px 6px',
            borderBottom: '1px solid #2a2a2a',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: activeEnvironment ? '#49cc90' : '#555',
              flexShrink: 0,
            }} />
            <span style={{ color: '#666', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {activeEnvironment ? activeEnvironment.name : 'Environment'}
            </span>
            <span style={{ color: '#444', fontSize: 10, marginLeft: 'auto' }}>
              {options.length} var{options.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div ref={optionsListRef} style={{ maxHeight: 200, overflowY: 'auto' }}>
            {options.map((opt, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={opt.key}
                  onMouseDown={e => { e.preventDefault(); insertOption(opt.key); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: isSelected ? '#252525' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderLeft: `2px solid ${isSelected ? '#4da2ff' : 'transparent'}`,
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 5,
                    background: isSelected ? 'rgba(77,162,255,0.15)' : '#222',
                    border: `1px solid ${isSelected ? 'rgba(77,162,255,0.3)' : '#333'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 9, fontWeight: 700,
                    color: isSelected ? '#4da2ff' : '#555',
                    fontFamily: 'monospace',
                    transition: 'all 0.1s',
                  }}>
                    {'{}'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: isSelected ? '#4da2ff' : '#c9c9c9',
                      fontSize: 12,
                      fontFamily: '"Fira Code", monospace',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {opt.key}
                    </div>
                    <div style={{
                      color: '#555',
                      fontSize: 11,
                      fontFamily: '"Fira Code", monospace',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: 1,
                    }}>
                      {opt.value ? opt.value : <span style={{ fontStyle: 'italic', color: '#3d3d3d' }}>empty</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvInput;
