import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Trash2, Key } from 'lucide-react';
import { HTTP_METHODS, METHOD_COLORS } from '../../mock';

/* ─── RAW BODY PLACEHOLDERS ──────────────────────────────────── */
const RAW_PLACEHOLDERS = {
  JSON: `{\n  "key": "value",\n  "name": "John Doe",\n  "age": 30\n}`,
  Text: `Enter plain text content here...`,
  JavaScript: `// JavaScript code\nconsole.log("Hello, World!");\n\nconst data = {\n  key: "value"\n};`,
  HTML: `<!DOCTYPE html>\n<html>\n  <head><title>Page</title></head>\n  <body>\n    <h1>Hello World</h1>\n  </body>\n</html>`,
  XML: `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <element>\n    <key>value</key>\n  </element>\n</root>`,
};

/* ─── SNIPPET DEFINITIONS ───────────────────────────────────── */
const PRE_SNIPPETS = [
  { label: 'Set variable', code: `pm.environment.set("variable_key", "variable_value");` },
  { label: 'Get variable', code: `const value = pm.environment.get("variable_key");` },
  { label: 'Send request', code: `pm.sendRequest("https://httpbin.org/get", function (err, res) {\n  console.log(res.json());\n});` },
  { label: 'Log data', code: `console.log(pm.request.url.toString());` },
];
const POST_SNIPPETS = [
  { label: 'Status code: 200', code: `pm.test("Status code is 200", function () {\n  pm.response.to.have.status(200);\n});` },
  { label: 'Response body: JSON', code: `pm.test("Response body is JSON", function () {\n  const json = pm.response.json();\n  pm.expect(json).to.be.an("object");\n});` },
  { label: 'Response time', code: `pm.test("Response time < 200ms", function () {\n  pm.expect(pm.response.responseTime).to.be.below(200);\n});` },
  { label: 'Response header', code: `pm.test("Content-Type header", function () {\n  pm.response.to.have.header("Content-Type");\n});` },
];

/* ─── PATH VAR EXTRACTOR ────────────────────────────────────── */
const extractPathVars = (url) => {
  const vars = [], seen = new Set();
  [/(?<!https?:)\/:([\w-]+)/g, /\{\{([\w-]+)\}\}/g].forEach(regex => {
    let m;
    while ((m = regex.exec(url)) !== null) { if (!seen.has(m[1])) { seen.add(m[1]); vars.push(m[1]); } }
  });
  return vars;
};

/* ─── REQUEST PANEL ─────────────────────────────────────────── */
const RequestPanel = ({ request, onRequestChange, onSend, onSave, isSending }) => {
  const [activeTab, setActiveTab] = useState('params');
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const [comingSoonTip, setComingSoonTip] = useState(null); // { x, y, text }
  const [activeScriptTab, setActiveScriptTab] = useState('pre-request');
  const [preRequestScript, setPreRequestScript] = useState('');
  const [postResponseScript, setPostResponseScript] = useState('');
  const [reqSettings, setReqSettings] = useState({
    followRedirects: true, sendNoCacheHeader: false, sslVerification: true,
    autoEncodeURL: true, sendPostieToken: false, stripAuthOnRedirect: false,
    requestTimeout: '0', maxResponseSize: '50',
  });

  const methodRef = useRef(null);
  const scriptRef = useRef(null);

  // Auto-close method dropdown on outside click
  useEffect(() => {
    if (!methodDropdownOpen) return;
    const handle = (e) => { if (methodRef.current && !methodRef.current.contains(e.target)) setMethodDropdownOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [methodDropdownOpen]);

  // Path variable sync
  const pathVarKeys = extractPathVars(request.url || '');
  const pathVars = request.path_variables || [];
  useEffect(() => {
    const existingKeys = pathVars.map(p => p.key);
    const toAdd = pathVarKeys.filter(k => !existingKeys.includes(k));
    const toRemove = existingKeys.filter(k => !pathVarKeys.includes(k));
    if (toAdd.length > 0 || toRemove.length > 0) {
      onRequestChange({ ...request, path_variables: [...pathVars.filter(p => pathVarKeys.includes(p.key)), ...toAdd.map(k => ({ key: k, value: '', enabled: true }))] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.url]);

  /* ── snippet insertion ── */
  const insertSnippet = (code) => {
    const ta = scriptRef.current;
    const setter = activeScriptTab === 'pre-request' ? setPreRequestScript : setPostResponseScript;
    const current = activeScriptTab === 'pre-request' ? preRequestScript : postResponseScript;
    const pos = ta ? ta.selectionStart : current.length;
    const prefix = current.length > 0 && !current.endsWith('\n') ? '\n' : '';
    const newVal = current.slice(0, pos) + prefix + code + '\n';
    setter(newVal);
    setTimeout(() => { if (ta) { ta.focus(); ta.setSelectionRange(newVal.length, newVal.length); } }, 0);
  };

  const updateRequest = (updates) => onRequestChange({ ...request, ...updates });
  const updateUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const params = [];
      urlObj.searchParams.forEach((value, key) => params.push({ key, value, enabled: true }));
      if (params.length > 0) { updateRequest({ url, params: [...params, { key: '', value: '', enabled: true }] }); return; }
    } catch { }
    updateRequest({ url });
  };

  const syncUrlWithParams = (params) => {
    try {
      const baseUrl = (request.url || '').split('?')[0];
      const enabledParams = params.filter(p => p.enabled && p.key);
      if (enabledParams.length === 0) { updateRequest({ params, url: baseUrl }); return; }
      updateRequest({ params, url: `${baseUrl}?${enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')}` });
    } catch { updateRequest({ params }); }
  };

  const updateRow = (field, index, key, value) => {
    const updated = (request[field] || []).map((row, i) => i === index ? { ...row, [key]: value } : row);
    if (field === 'params') syncUrlWithParams(updated); else updateRequest({ [field]: updated });
  };
  const addRow = (field) => updateRequest({ [field]: [...(request[field] || []), { key: '', value: '', enabled: true }] });
  const removeRow = (field, index) => {
    const updated = (request[field] || []).filter((_, i) => i !== index);
    if (field === 'params') syncUrlWithParams(updated); else updateRequest({ [field]: updated });
  };

  const updateBody = (updates) => updateRequest({ body: { ...request.body, ...updates } });
  const updateAuth = (updates) => updateRequest({ auth: { ...request.auth, ...updates } });
  const updateBodyRow = (field, index, key, value) => {
    const rows = (request.body[field] || []).map((row, i) => i === index ? { ...row, [key]: value } : row);
    updateBody({ [field]: rows });
  };
  const addBodyRow = (field) => updateBody({ [field]: [...(request.body[field] || []), { key: '', value: '', fieldType: 'text', enabled: true }] });
  const removeBodyRow = (field, index) => updateBody({ [field]: (request.body[field] || []).filter((_, i) => i !== index) });
  const updatePathVar = (index, key, value) => updateRequest({ path_variables: (request.path_variables || []).map((v, i) => i === index ? { ...v, [key]: value } : v) });

  const activeParamCount = (request.params || []).filter(p => p.enabled && p.key).length;
  const activeHeaderCount = (request.headers || []).filter(h => h.enabled && h.key).length;
  const pathVarCount = (request.path_variables || []).filter(v => v.key).length;

  const tabs = [
    { id: 'params', label: 'Params', badge: activeParamCount + pathVarCount },
    { id: 'auth', label: 'Authorization' },
    { id: 'headers', label: 'Headers', badge: activeHeaderCount },
    { id: 'body', label: 'Body' },
    { id: 'scripts', label: 'Scripts', disabled: true, tooltip: 'Scripts execution is coming in a future release.' },
    { id: 'settings', label: 'Settings', disabled: true, tooltip: 'Per-request settings are coming in a future release.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: '#1e1e1e' }}>
      {/* Fixed-position coming-soon tooltip */}
      {comingSoonTip && (
        <div style={{ position: 'fixed', left: comingSoonTip.x, top: comingSoonTip.y, zIndex: 99999, pointerEvents: 'none', background: 'linear-gradient(135deg,#1e1e1e,#181818)', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', width: 210, boxShadow: '0 8px 24px rgba(0,0,0,.7)' }}>
          <div style={{ color: '#FF6C37', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>🚀 Coming Soon</div>
          <div style={{ color: '#666', fontSize: 11, lineHeight: 1.5 }}>{comingSoonTip.text}</div>
        </div>
      )}
      {/* Request Name */}
      <div style={{ padding: '10px 16px 0', borderBottom: '1px solid #2d2d2d' }}>
        <input value={request.name || ''} onChange={e => updateRequest({ name: e.target.value })} placeholder="Request Name"
          style={{ background: 'none', border: 'none', outline: 'none', color: '#e0e0e0', fontSize: '14px', fontWeight: '600', width: '100%', marginBottom: '8px', fontFamily: 'inherit' }} />
      </div>

      {/* URL Bar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #2d2d2d', display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Method Selector */}
        <div ref={methodRef} style={{ position: 'relative' }}>
          <button data-testid="method-selector" onClick={() => setMethodDropdownOpen(p => !p)}
            style={{ background: '#2d2d2d', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', minWidth: '100px', justifyContent: 'space-between', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#3d3d3d'; }}
          >
            <span style={{ color: METHOD_COLORS[request.method] || '#e0e0e0', fontWeight: '700', fontSize: '12px', letterSpacing: '0.3px' }}>{request.method}</span>
            <ChevronDown size={12} style={{ color: '#888' }} />
          </button>
          {methodDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, background: '#2d2d2d', border: '1px solid #444', borderRadius: '4px', minWidth: '120px', marginTop: '2px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              {HTTP_METHODS.map(method => (
                <div key={method} onClick={() => { updateRequest({ method }); setMethodDropdownOpen(false); }}
                  style={{ padding: '8px 14px', cursor: 'pointer', color: METHOD_COLORS[method] || '#e0e0e0', fontWeight: '700', fontSize: '12px', letterSpacing: '0.3px', transition: 'background 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#3d3d3d'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >{method}</div>
              ))}
            </div>
          )}
        </div>

        {/* URL Input */}
        <input data-testid="url-input" value={request.url || ''} onChange={e => updateUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend()}
          placeholder="Enter URL or paste text"
          style={{ flex: 1, background: '#2d2d2d', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '8px 12px', color: '#e0e0e0', fontSize: '13px', outline: 'none', fontFamily: '"Fira Code", "Consolas", monospace', transition: 'border-color 0.15s' }}
          onFocus={e => { e.target.style.borderColor = '#FF6C37'; }}
          onBlur={e => { e.target.style.borderColor = '#3d3d3d'; }}
        />

        <button data-testid="send-request-btn" onClick={onSend} disabled={isSending}
          style={{ background: isSending ? '#cc5520' : '#FF6C37', border: 'none', borderRadius: '4px', padding: '8px 20px', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: isSending ? 'not-allowed' : 'pointer', minWidth: '72px', transition: 'background 0.15s', fontFamily: 'inherit' }}
          onMouseEnter={e => { if (!isSending) e.currentTarget.style.background = '#e55a28'; }}
          onMouseLeave={e => { if (!isSending) e.currentTarget.style.background = '#FF6C37'; }}
        >{isSending ? 'Sending...' : 'Send'}</button>

        <button onClick={onSave} style={{ background: 'none', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '8px 14px', color: '#ccc', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6C37'; e.currentTarget.style.color = '#FF6C37'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#3d3d3d'; e.currentTarget.style.color = '#ccc'; }}
        >Save</button>
      </div>

      {/* Request Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2d2d2d', backgroundColor: '#252525', paddingLeft: '16px', flexShrink: 0, overflowX: 'auto' }}>
        {tabs.map(tab => (
          tab.disabled ? (
            <div
              key={tab.id}
              onMouseEnter={e => {
                const r = e.currentTarget.getBoundingClientRect();
                setComingSoonTip({ x: r.left, y: r.bottom + 6, text: tab.tooltip });
              }}
              onMouseLeave={() => setComingSoonTip(null)}
            >
              <button
                disabled
                style={{ background: 'none', border: 'none', borderBottom: '2px solid transparent', padding: '8px 14px', color: '#484848', fontSize: '12px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', fontFamily: 'inherit', opacity: 0.5, pointerEvents: 'none' }}
              >
                {tab.label}
                <span style={{ fontSize: 9, color: '#555', fontWeight: 600, background: '#2a2a2a', border: '1px solid #333', borderRadius: 4, padding: '1px 5px', marginLeft: 2, letterSpacing: '.03em' }}>SOON</span>
              </button>
            </div>
          ) : (
            <button key={tab.id} data-testid={`request-tab-${tab.id}`} onClick={() => setActiveTab(tab.id)}
              style={{ background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #FF6C37' : '2px solid transparent', padding: '8px 14px', color: activeTab === tab.id ? '#FF6C37' : '#aaa', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#e0e0e0'; }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#aaa'; }}
            >
              {tab.label}
              {tab.badge > 0 && <span style={{ background: '#FF6C37', color: '#fff', borderRadius: '8px', padding: '0 5px', fontSize: '10px', fontWeight: '700', minWidth: '16px', textAlign: 'center', lineHeight: '16px' }}>{tab.badge}</span>}
            </button>
          )
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── PARAMS ── */}
        {activeTab === 'params' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            <KeyValueTable rows={request.params || []} onAdd={() => addRow('params')} onRemove={i => removeRow('params', i)}
              onUpdate={(i, k, v) => updateRow('params', i, k, v)} keyPlaceholder="Key" valuePlaceholder="Value" title="Query Params" />
            {pathVarKeys.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ color: '#777', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Path Variables</span>
                  <span style={{ color: '#555', fontSize: '10px' }}>— detected from URL</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 1.5fr 28px', gap: '4px', marginBottom: '4px' }}>
                  <div /><div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Variable</div>
                  <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</div>
                  <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div><div />
                </div>
                {(request.path_variables || []).map((pv, i) => (
                  <div key={pv.key} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 1.5fr 28px', gap: '4px', marginBottom: '4px', alignItems: 'center' }}>
                    <input type="checkbox" checked={pv.enabled} onChange={e => updatePathVar(i, 'enabled', e.target.checked)} style={{ accentColor: '#FF6C37', width: '14px', height: '14px', margin: '0 auto', cursor: 'pointer' }} />
                    <div style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '3px', padding: '5px 8px', color: '#e8a87c', fontSize: '12px', fontFamily: '"Fira Code", monospace' }}>:{pv.key}</div>
                    <input value={pv.value} onChange={e => updatePathVar(i, 'value', e.target.value)} placeholder="Value"
                      style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '3px', padding: '5px 8px', color: '#e0e0e0', fontSize: '12px', outline: 'none', fontFamily: '"Fira Code", monospace', width: '100%', boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#333'; }} />
                    <input value={pv.description || ''} onChange={e => updatePathVar(i, 'description', e.target.value)} placeholder="Description"
                      style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '3px', padding: '5px 8px', color: '#e0e0e0', fontSize: '12px', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#333'; }} />
                    <div />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HEADERS ── */}
        {activeTab === 'headers' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            <KeyValueTable rows={request.headers || []} onAdd={() => addRow('headers')} onRemove={i => removeRow('headers', i)}
              onUpdate={(i, k, v) => updateRow('headers', i, k, v)} keyPlaceholder="Header Key" valuePlaceholder="Header Value" title="Headers" />
          </div>
        )}

        {/* ── BODY ── */}
        {activeTab === 'body' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Type selector row */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
              {['none', 'form-data', 'x-www-form-urlencoded', 'raw', 'binary'].map(type => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="radio" name="bodyType" value={type} checked={request.body.type === type} onChange={() => updateBody({ type })} style={{ accentColor: '#FF6C37' }} />
                  <span style={{ color: request.body.type === type ? '#e0e0e0' : '#888', fontSize: '12px' }}>{type}</span>
                </label>
              ))}
              {request.body.type === 'raw' && (
                <select value={request.body.raw?.type || 'JSON'} onChange={e => updateBody({ raw: { ...request.body.raw, type: e.target.value } })}
                  style={{ background: '#2d2d2d', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '3px 8px', color: '#e0e0e0', fontSize: '12px', cursor: 'pointer', outline: 'none', marginLeft: 'auto', fontFamily: 'inherit' }}>
                  {['JSON', 'Text', 'JavaScript', 'HTML', 'XML'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
            </div>
            {/* Body content */}
            {request.body.type === 'none' && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '12px' }}>This request does not have a body</div>}
            {request.body.type === 'raw' && (
              <textarea value={request.body.raw?.value || ''} onChange={e => updateBody({ raw: { ...request.body.raw, value: e.target.value } })}
                placeholder={RAW_PLACEHOLDERS[request.body.raw?.type || 'JSON'] || ''}
                style={{ flex: 1, width: '100%', background: '#1a1a1a', border: 'none', borderTop: '1px solid #2a2a2a', padding: '12px 16px', color: '#e0e0e0', fontSize: '12px', fontFamily: '"Fira Code", "Consolas", monospace', resize: 'none', outline: 'none', lineHeight: '1.6', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => { e.target.style.borderTop = '1px solid #FF6C37'; }} onBlur={e => { e.target.style.borderTop = '1px solid #2a2a2a'; }}
              />
            )}
            {request.body.type === 'form-data' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                <FormDataTable rows={request.body.form_data || []} onAdd={() => addBodyRow('form_data')} onRemove={i => removeBodyRow('form_data', i)} onUpdate={(i, k, v) => updateBodyRow('form_data', i, k, v)} />
              </div>
            )}
            {request.body.type === 'x-www-form-urlencoded' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                <KeyValueTable rows={request.body.url_encoded || []} onAdd={() => addBodyRow('url_encoded')} onRemove={i => removeBodyRow('url_encoded', i)}
                  onUpdate={(i, k, v) => updateBodyRow('url_encoded', i, k, v)} keyPlaceholder="Key" valuePlaceholder="Value" title="URL Encoded" />
              </div>
            )}
            {request.body.type === 'binary' && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ padding: '20px', border: '1px dashed #3d3d3d', borderRadius: '4px', textAlign: 'center' }}>
                  <input type="file" style={{ color: '#ccc', fontSize: '12px' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AUTH ── */}
        {activeTab === 'auth' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Auth Type</label>
              <select value={request.auth?.type || 'none'} onChange={e => updateAuth({ type: e.target.value })}
                style={{ background: '#2d2d2d', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '7px 12px', color: '#e0e0e0', fontSize: '13px', cursor: 'pointer', outline: 'none', minWidth: '200px', fontFamily: 'inherit' }}>
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key</option>
                <option value="oauth2">OAuth 2.0</option>
              </select>
            </div>
            {request.auth?.type === 'bearer' && (
              <div>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Token</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={14} style={{ color: '#888', flexShrink: 0 }} />
                  <input value={request.auth.bearerToken || ''} onChange={e => updateAuth({ bearerToken: e.target.value })} placeholder="Enter Bearer Token"
                    style={{ flex: 1, background: '#2d2d2d', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '7px 12px', color: '#e0e0e0', fontSize: '13px', outline: 'none', fontFamily: 'monospace' }}
                    onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#3d3d3d'; }} />
                </div>
              </div>
            )}
            {request.auth?.type === 'basic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[{ label: 'Username', key: 'basicUsername', type: 'text' }, { label: 'Password', key: 'basicPassword', type: 'password' }].map(f => (
                  <div key={f.key}>
                    <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                    <input type={f.type} value={request.auth[f.key] || ''} onChange={e => updateAuth({ [f.key]: e.target.value })} placeholder={f.label}
                      style={{ width: '100%', background: '#2d2d2d', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '7px 12px', color: '#e0e0e0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#3d3d3d'; }} />
                  </div>
                ))}
              </div>
            )}
            {request.auth?.type === 'apikey' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[{ label: 'Key Name', key: 'apiKeyName', placeholder: 'X-API-Key' }, { label: 'Value', key: 'apiKeyValue', placeholder: 'API Key value' }].map(f => (
                  <div key={f.key}>
                    <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                    <input value={request.auth[f.key] || ''} onChange={e => updateAuth({ [f.key]: e.target.value })} placeholder={f.placeholder}
                      style={{ width: '100%', background: '#2d2d2d', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '7px 12px', color: '#e0e0e0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                      onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#3d3d3d'; }} />
                  </div>
                ))}
              </div>
            )}
            {request.auth?.type === 'none' && <div style={{ color: '#666', fontSize: '12px', padding: '12px 0' }}>This request does not use any authorization.</div>}
            {request.auth?.type === 'oauth2' && (
              <div style={{ color: '#888', fontSize: '12px', padding: '16px', background: '#252525', borderRadius: '6px', border: '1px solid #333' }}>
                OAuth 2.0 — configure token URL, client ID, and scopes.<br /><br />
                <button style={{ background: '#FF6C37', border: 'none', borderRadius: '4px', padding: '6px 14px', color: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Get New Access Token</button>
              </div>
            )}
          </div>
        )}

        {/* ── SCRIPTS ── */}
        {activeTab === 'scripts' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 0, marginBottom: '12px', background: '#252525', borderRadius: '6px', overflow: 'hidden', border: '1px solid #2d2d2d', width: 'fit-content' }}>
              {['pre-request', 'post-response'].map(s => (
                <button key={s} onClick={() => setActiveScriptTab(s)}
                  style={{ background: activeScriptTab === s ? '#FF6C37' : 'none', border: 'none', padding: '7px 16px', color: activeScriptTab === s ? '#fff' : '#888', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: activeScriptTab === s ? '600' : '400', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (activeScriptTab !== s) e.currentTarget.style.color = '#e0e0e0'; }}
                  onMouseLeave={e => { if (activeScriptTab !== s) e.currentTarget.style.color = '#888'; }}
                >{s === 'pre-request' ? 'Pre-request' : 'Post-response'}</button>
              ))}
            </div>

            <div style={{ marginBottom: '8px', color: '#666', fontSize: '11px' }}>
              {activeScriptTab === 'pre-request' ? 'Runs before the request is sent.' : 'Runs after the response is received. Use pm.test() to write assertions.'}
            </div>

            <textarea ref={scriptRef}
              value={activeScriptTab === 'pre-request' ? preRequestScript : postResponseScript}
              onChange={e => { activeScriptTab === 'pre-request' ? setPreRequestScript(e.target.value) : setPostResponseScript(e.target.value); }}
              placeholder={activeScriptTab === 'pre-request'
                ? `// Pre-request Script\npm.environment.set('key', 'value');\npm.request.headers.add({ key: 'X-Timestamp', value: Date.now().toString() });`
                : `// Post-response Script\npm.test("Status is 200", function() {\n  pm.expect(pm.response.code).to.equal(200);\n});`}
              style={{ width: '100%', minHeight: '120px', maxHeight: 'calc(100vh - 420px)', height: '160px', background: '#1a1a1a', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '12px', color: '#e0e0e0', fontSize: '12px', fontFamily: '"Fira Code", "Consolas", monospace', resize: 'vertical', outline: 'none', lineHeight: '1.6', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#3d3d3d'; }}
            />

            <div style={{ marginTop: '12px' }}>
              <div style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>Snippets</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(activeScriptTab === 'pre-request' ? PRE_SNIPPETS : POST_SNIPPETS).map(snippet => (
                  <button key={snippet.label} onClick={() => insertSnippet(snippet.code)}
                    style={{ background: '#252525', border: '1px solid #2d2d2d', borderRadius: '4px', padding: '4px 10px', color: '#aaa', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6C37'; e.currentTarget.style.color = '#FF6C37'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d2d2d'; e.currentTarget.style.color = '#aaa'; }}
                  >{snippet.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ color: '#777', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Request Settings</div>
            {[
              { key: 'followRedirects', label: 'Follow redirects', desc: 'Automatically follow HTTP redirects', type: 'toggle' },
              { key: 'sendNoCacheHeader', label: 'Send no-cache header', desc: 'Sends Cache-Control: no-cache with the request', type: 'toggle' },
              { key: 'sslVerification', label: 'SSL certificate verification', desc: 'Verify SSL/TLS certificates for HTTPS requests', type: 'toggle' },
              { key: 'autoEncodeURL', label: 'Automatically encode URL', desc: 'Percent-encode special characters in the URL', type: 'toggle' },
              { key: 'sendPostieToken', label: 'Send Postie Token header', desc: 'Enables sending a Postie-Token header with every request', type: 'toggle' },
              { key: 'stripAuthOnRedirect', label: 'Strip auth header on redirect', desc: 'Remove Authorization header when following redirects to a different host', type: 'toggle' },
            ].map(s => (
              <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: '#252525', borderRadius: '6px', border: '1px solid #2d2d2d' }}>
                <div>
                  <div style={{ color: '#e0e0e0', fontSize: '12px', marginBottom: '1px' }}>{s.label}</div>
                  <div style={{ color: '#666', fontSize: '11px' }}>{s.desc}</div>
                </div>
                <div onClick={() => setReqSettings(p => ({ ...p, [s.key]: !p[s.key] }))}
                  style={{ width: '34px', height: '18px', borderRadius: '9px', background: reqSettings[s.key] ? '#FF6C37' : '#3d3d3d', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: reqSettings[s.key] ? '19px' : '3px', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}

            <div style={{ color: '#777', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '8px', marginBottom: '4px' }}>Timeouts</div>
            {[
              { key: 'requestTimeout', label: 'Request timeout (ms)', desc: '0 = no timeout', unit: 'ms' },
              { key: 'maxResponseSize', label: 'Max response size (MB)', desc: 'Truncate responses larger than this', unit: 'MB' },
            ].map(s => (
              <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: '#252525', borderRadius: '6px', border: '1px solid #2d2d2d' }}>
                <div>
                  <div style={{ color: '#e0e0e0', fontSize: '12px', marginBottom: '1px' }}>{s.label}</div>
                  <div style={{ color: '#666', fontSize: '11px' }}>{s.desc}</div>
                </div>
                <input value={reqSettings[s.key]} onChange={e => setReqSettings(p => ({ ...p, [s.key]: e.target.value }))}
                  style={{ width: '70px', background: '#1e1e1e', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '4px 8px', color: '#e0e0e0', fontSize: '12px', outline: 'none', textAlign: 'right', fontFamily: 'inherit' }}
                  onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#3d3d3d'; }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── FORM-DATA TABLE ─────────────────────────────────────────── */
const FormDataTable = ({ rows, onAdd, onRemove, onUpdate }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
      <span style={{ color: '#777', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Form Data</span>
      <button onClick={onAdd} style={{ background: 'none', border: 'none', color: '#FF6C37', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
        <Plus size={12} /> Add
      </button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 1.5fr 28px', gap: '4px', marginBottom: '4px' }}>
      <div /><div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key</div>
      <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</div>
      <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div><div />
    </div>
    {rows.map((row, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 1.5fr 28px', gap: '4px', marginBottom: '5px', alignItems: 'center' }}>
        <input type="checkbox" checked={row.enabled} onChange={e => onUpdate(i, 'enabled', e.target.checked)} style={{ accentColor: '#FF6C37', width: '14px', height: '14px', margin: '0 auto', cursor: 'pointer' }} />
        <div style={{ display: 'flex', background: '#2a2a2a', border: '1px solid #333', borderRadius: '3px', overflow: 'hidden', alignItems: 'center' }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = '#FF6C37'; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = '#333'; }}>
          <button onClick={() => onUpdate(i, 'fieldType', (row.fieldType || 'text') === 'text' ? 'file' : 'text')}
            style={{ background: (row.fieldType || 'text') === 'file' ? '#1e3a5f' : '#1e2d1e', border: 'none', borderRight: '1px solid #333', padding: '4px 7px', color: (row.fieldType || 'text') === 'file' ? '#6bc5f8' : '#49cc90', fontSize: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', flexShrink: 0, transition: 'all .15s' }}>
            {(row.fieldType || 'text') === 'text' ? 'TEXT' : 'FILE'}
          </button>
          <input value={row.key} onChange={e => onUpdate(i, 'key', e.target.value)} placeholder="Key"
            style={{ flex: 1, background: 'none', border: 'none', padding: '5px 8px', color: row.enabled ? '#e0e0e0' : '#666', fontSize: '12px', outline: 'none', fontFamily: '"Fira Code", monospace', minWidth: 0 }} />
        </div>
        {(row.fieldType || 'text') === 'file' ? (
          <div style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '3px', padding: '3px 6px', display: 'flex', alignItems: 'center' }}>
            <input type="file" style={{ color: '#ccc', fontSize: '11px', width: '100%', cursor: 'pointer' }} />
          </div>
        ) : (
          <input value={row.value} onChange={e => onUpdate(i, 'value', e.target.value)} placeholder="Value"
            style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '3px', padding: '5px 8px', color: row.enabled ? '#e0e0e0' : '#666', fontSize: '12px', outline: 'none', fontFamily: '"Fira Code", monospace', width: '100%', boxSizing: 'border-box' }}
            onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#333'; }} />
        )}
        <input value={row.description || ''} onChange={e => onUpdate(i, 'description', e.target.value)} placeholder="Description"
          style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '3px', padding: '5px 8px', color: '#e0e0e0', fontSize: '12px', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
          onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#333'; }} />
        <button onClick={() => onRemove(i)}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '3px', transition: 'color 0.1s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f93e3e'; }} onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
        ><Trash2 size={12} /></button>
      </div>
    ))}
    {rows.length === 0 && <div style={{ textAlign: 'center', padding: '16px', color: '#444', fontSize: '12px' }}>No form data added yet.</div>}
  </div>
);

/* ─── KEY-VALUE TABLE ─────────────────────────────────────────── */
const KeyValueTable = ({ rows, onAdd, onRemove, onUpdate, keyPlaceholder, valuePlaceholder, title }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
      <span style={{ color: '#777', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
      <button onClick={onAdd} style={{ background: 'none', border: 'none', color: '#FF6C37', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
        <Plus size={12} /> Add
      </button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 1.5fr 28px', gap: '4px', marginBottom: '4px' }}>
      <div /><div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key</div>
      <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</div>
      <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div><div />
    </div>
    {rows.map((row, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 1.5fr 28px', gap: '4px', marginBottom: '4px', alignItems: 'center' }}>
        <input type="checkbox" checked={row.enabled} onChange={e => onUpdate(i, 'enabled', e.target.checked)} style={{ accentColor: '#FF6C37', width: '14px', height: '14px', margin: '0 auto', cursor: 'pointer' }} />
        <input value={row.key} onChange={e => onUpdate(i, 'key', e.target.value)} placeholder={keyPlaceholder}
          style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '3px', padding: '5px 8px', color: row.enabled ? '#e0e0e0' : '#666', fontSize: '12px', outline: 'none', fontFamily: '"Fira Code", monospace', width: '100%', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#333'; }} />
        <input value={row.value} onChange={e => onUpdate(i, 'value', e.target.value)} placeholder={valuePlaceholder}
          style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '3px', padding: '5px 8px', color: row.enabled ? '#e0e0e0' : '#666', fontSize: '12px', outline: 'none', fontFamily: '"Fira Code", monospace', width: '100%', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#333'; }} />
        <input value={row.description || ''} onChange={e => onUpdate(i, 'description', e.target.value)} placeholder="Description"
          style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '3px', padding: '5px 8px', color: '#e0e0e0', fontSize: '12px', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
          onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#333'; }} />
        <button onClick={() => onRemove(i)}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '3px', transition: 'color 0.1s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f93e3e'; }} onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
        ><Trash2 size={12} /></button>
      </div>
    ))}
    {rows.length === 0 && <div style={{ textAlign: 'center', padding: '16px', color: '#444', fontSize: '12px' }}>No {title.toLowerCase()} added yet.</div>}
  </div>
);

export default RequestPanel;
