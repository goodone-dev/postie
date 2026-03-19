import React, { useState } from 'react';
import { Copy, Download } from 'lucide-react';

const STATUS_COLORS = {
  2: '#3ecf8e',
  3: '#fca130',
  4: '#f93e3e',
  5: '#f93e3e',
};

const getStatusColor = (status) => {
  if (!status) return '#888';
  const firstDigit = Math.floor(status / 100);
  return STATUS_COLORS[firstDigit] || '#888';
};

const formatJSON = (str) => {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch (e) {
    return str;
  }
};

const syntaxHighlight = (json) => {
  if (!json) return '';
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(
    /(\"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\\"])*\"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'color: #ae81ff;';
      if (/^\"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'color: #f92672;';
        } else {
          cls = 'color: #a6e22e;';
        }
      } else if (/true|false/.test(match)) {
        cls = 'color: #66d9ef;';
      } else if (/null/.test(match)) {
        cls = 'color: #75715e;';
      }
      return `<span style="${cls}">${match}</span>`;
    }
  );
};

const ResponsePanel = ({ response, isSending, onSaveAsSample }) => {
  const [activeTab, setActiveTab] = useState('body');
  const [savedFlash, setSavedFlash] = useState(false);

  const handleSaveAsSample = () => {
    onSaveAsSample();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };
  const [viewMode, setViewMode] = useState('pretty');
  const [copied, setCopied] = useState(false);

  const tabs = ['Body', 'Cookies', 'Headers', 'Test Results'];

  const handleCopy = () => {
    if (response?.body) {
      navigator.clipboard.writeText(response.body).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDownload = () => {
    if (response?.body) {
      const blob = new Blob([response.body], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'response.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formattedBody = response?.body ? formatJSON(response.body) : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e', borderTop: '3px solid #2d2d2d', height: '100%', overflow: 'hidden' }}>
      {/* Response Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid #2d2d2d', backgroundColor: '#252525', gap: '12px', flexShrink: 0 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', flex: 1 }}>
          {tabs.map(tab => {
            const tabKey = tab.toLowerCase().replace(' ', '_');
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tabKey)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tabKey ? '2px solid #FF6C37' : '2px solid transparent',
                  padding: '9px 14px',
                  color: activeTab === tabKey ? '#FF6C37' : '#aaa',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={e => { if (activeTab !== tabKey) e.currentTarget.style.color = '#e0e0e0'; }}
                onMouseLeave={e => { if (activeTab !== tabKey) e.currentTarget.style.color = '#aaa'; }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Response Status Info */}
        {response && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px' }}>
              <span style={{ color: '#666' }}>Status: </span>
              <span data-testid="response-status" style={{ color: getStatusColor(response.status), fontWeight: '700' }}>
                {response.status} {response.statusText}
              </span>
            </span>
            <span style={{ fontSize: '12px' }}>
              <span style={{ color: '#666' }}>Time: </span>
              <span style={{ color: '#3ecf8e', fontWeight: '600' }}>{response.time}ms</span>
            </span>
            <span style={{ fontSize: '12px' }}>
              <span style={{ color: '#666' }}>Size: </span>
              <span style={{ color: '#6bc5f8', fontWeight: '600' }}>{response.size}</span>
            </span>
            {/* Save as Sample */}
            {onSaveAsSample && (
              <button data-testid="save-as-example-btn"
                onClick={handleSaveAsSample}
                style={{ background: savedFlash ? 'rgba(62,207,142,0.15)' : 'none', border: `1px solid ${savedFlash ? '#3ecf8e' : '#3d3d3d'}`, borderRadius: '4px', padding: '3px 10px', color: savedFlash ? '#3ecf8e' : '#aaa', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { if (!savedFlash) { e.currentTarget.style.borderColor = '#FF6C37'; e.currentTarget.style.color = '#FF6C37'; } }}
                onMouseLeave={e => { if (!savedFlash) { e.currentTarget.style.borderColor = '#3d3d3d'; e.currentTarget.style.color = '#aaa'; } }}
              >
                {savedFlash
                  ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Saved!</>
                  : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save as Example</>
                }
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body Content */}
      {activeTab === 'body' && (
        <>
          {!response && !isSending && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', color: '#444' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#252525', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', border: '1px solid #333' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <p style={{ fontSize: '14px', marginBottom: '6px', color: '#666' }}>Hit Send to get a response</p>
              <p style={{ fontSize: '12px', color: '#444' }}>Responses will appear here</p>
            </div>
          )}

          {isSending && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #333', borderTopColor: '#FF6C37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: '#777', fontSize: '13px' }}>Sending Request...</p>
            </div>
          )}

          {response && !isSending && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* View Mode Switcher */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid #252525', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '0', background: '#2a2a2a', borderRadius: '4px', overflow: 'hidden', border: '1px solid #333' }}>
                  {['pretty', 'raw', 'preview'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      style={{
                        background: viewMode === mode ? '#3d3d3d' : 'none',
                        border: 'none',
                        padding: '4px 10px',
                        color: viewMode === mode ? '#e0e0e0' : '#777',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.1s',
                        fontFamily: 'inherit'
                      }}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={handleCopy}
                    style={{ background: 'none', border: 'none', color: copied ? '#3ecf8e' : '#777', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px', borderRadius: '3px', transition: 'color 0.15s', fontFamily: 'inherit' }}
                    onMouseEnter={e => { if (!copied) e.currentTarget.style.color = '#e0e0e0'; }}
                    onMouseLeave={e => { if (!copied) e.currentTarget.style.color = '#777'; }}
                  >
                    <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px', borderRadius: '3px', transition: 'color 0.15s', fontFamily: 'inherit' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#e0e0e0'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#777'; }}
                  >
                    <Download size={12} /> Save
                  </button>
                </div>
              </div>

              {/* Response Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                {viewMode === 'pretty' && (
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: '"Fira Code", "Consolas", monospace',
                      fontSize: '12px',
                      lineHeight: '1.7',
                      color: '#e0e0e0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                    dangerouslySetInnerHTML={{ __html: syntaxHighlight(formattedBody) }}
                  />
                )}
                {viewMode === 'raw' && (
                  <pre style={{ margin: 0, fontFamily: '"Fira Code", monospace', fontSize: '12px', lineHeight: '1.7', color: '#ccc', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {response.body}
                  </pre>
                )}
                {viewMode === 'preview' && (
                  <iframe
                    srcDoc={response.body}
                    style={{ width: '100%', height: '200px', border: 'none', background: '#fff', borderRadius: '4px' }}
                    title="Preview"
                    sandbox="allow-scripts"
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Headers Tab */}
      {activeTab === 'headers' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {!response ? (
            <div style={{ color: '#444', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>Send a request to see response headers</div>
          ) : Object.keys(response.headers || {}).length === 0 ? (
            <div style={{ color: '#555', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>No response headers</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #2d2d2d', width: '40%' }}>Key</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #2d2d2d' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(response.headers).map(([key, value], i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid #252525' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#252525'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '6px 10px', color: '#f92672', fontSize: '12px', fontFamily: '"Fira Code", monospace', verticalAlign: 'top' }}>{key}</td>
                    <td style={{ padding: '6px 10px', color: '#a6e22e', fontSize: '12px', fontFamily: '"Fira Code", monospace', wordBreak: 'break-all' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Cookies Tab */}
      {activeTab === 'cookies' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#444', fontSize: '12px' }}>No cookies in this response</p>
        </div>
      )}

      {/* Test Results Tab */}
      {activeTab === 'test_results' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
          <p style={{ color: '#555', fontSize: '13px' }}>No tests were run</p>
          <p style={{ color: '#444', fontSize: '11px' }}>Add tests in the Scripts tab and send the request</p>
        </div>
      )}
    </div>
  );
};

export default ResponsePanel;
