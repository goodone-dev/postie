import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const uid = () => `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const EnvironmentEditor = ({ environment, onUpdate }) => {
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(environment?.name || '');

  if (!environment) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 13, backgroundColor: '#1e1e1e' }}>
        Environment not found
      </div>
    );
  }

  const vars = environment.variables || [];

  const commitName = () => {
    if (nameVal.trim()) onUpdate({ ...environment, name: nameVal.trim() });
    setEditName(false);
  };

  const updateVar = (index, key, value) => {
    const updated = vars.map((v, i) => i === index ? { ...v, [key]: value } : v);
    onUpdate({ ...environment, variables: updated });
  };

  const addVar = () => {
    onUpdate({ ...environment, variables: [...vars, { id: uid(), key: '', value: '', enabled: true }] });
  };

  const removeVar = (index) => {
    onUpdate({ ...environment, variables: vars.filter((_, i) => i !== index) });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #2d2d2d', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, backgroundColor: '#252525' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FF6C37', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>E</span>
        </div>
        {editName ? (
          <input
            autoFocus
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setEditName(false); setNameVal(environment.name); } }}
            style={{ background: 'none', border: 'none', borderBottom: '1px solid #FF6C37', outline: 'none', color: '#e0e0e0', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', padding: '2px 4px' }}
          />
        ) : (
          <span
            onDoubleClick={() => { setEditName(true); setNameVal(environment.name); }}
            title="Double-click to rename"
            style={{ color: '#e0e0e0', fontSize: 15, fontWeight: 600, cursor: 'text' }}
          >
            {environment.name}
          </span>
        )}
        <span style={{ color: '#555', fontSize: 11, marginLeft: 4 }}>(double-click name to rename)</span>
      </div>

      {/* Variable Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 28px', gap: 6, marginBottom: 8, padding: '0 2px' }}>
          <div />
          <div style={{ color: '#555', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Variable</div>
          <div style={{ color: '#555', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</div>
          <div />
        </div>

        {vars.map((v, i) => (
          <div key={v.id || i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 28px', gap: 6, marginBottom: 5, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={v.enabled}
              onChange={e => updateVar(i, 'enabled', e.target.checked)}
              style={{ accentColor: '#FF6C37', width: 14, height: 14, margin: '0 auto', cursor: 'pointer' }}
              data-testid={`env-var-enabled-${i}`}
            />
            <input
              value={v.key}
              onChange={e => updateVar(i, 'key', e.target.value)}
              placeholder="Variable"
              data-testid={`env-var-key-${i}`}
              style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: 3, padding: '5px 8px', color: v.enabled ? '#e8a87c' : '#666', fontSize: 12, outline: 'none', fontFamily: '"Fira Code", monospace', width: '100%', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#FF6C37'; }}
              onBlur={e => { e.target.style.borderColor = '#333'; }}
            />
            <input
              value={v.value}
              onChange={e => updateVar(i, 'value', e.target.value)}
              placeholder="Value"
              data-testid={`env-var-value-${i}`}
              style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: 3, padding: '5px 8px', color: v.enabled ? '#e0e0e0' : '#666', fontSize: 12, outline: 'none', fontFamily: '"Fira Code", monospace', width: '100%', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#FF6C37'; }}
              onBlur={e => { e.target.style.borderColor = '#333'; }}
            />
            <button
              onClick={() => removeVar(i)}
              data-testid={`env-var-delete-${i}`}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 3, transition: 'color 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f93e3e'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
            ><Trash2 size={12} /></button>
          </div>
        ))}

        <button
          onClick={addVar}
          data-testid="env-add-variable-btn"
          style={{ marginTop: 10, background: 'none', border: 'none', color: '#FF6C37', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0', fontFamily: 'inherit', transition: 'opacity 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          <Plus size={13} /> Add Variable
        </button>
      </div>

      {/* Footer info */}
      <div style={{ padding: '10px 20px', borderTop: '1px solid #2d2d2d', flexShrink: 0, backgroundColor: '#252525' }}>
        <span style={{ color: '#555', fontSize: 11 }}>
          {vars.filter(v => v.key).length} variable{vars.filter(v => v.key).length !== 1 ? 's' : ''} · Changes are saved automatically
        </span>
      </div>
    </div>
  );
};

export default EnvironmentEditor;
