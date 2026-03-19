import React, { useState } from 'react';
import { X, Bell, Settings, User, Moon, Sun, Globe, Shield, Zap, Database, Key, Palette, ChevronRight, Check, LogOut, CreditCard, HelpCircle } from 'lucide-react';

/* ─── NOTIFICATION PANEL ─────────────────────────────────────────────── */
const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'update', title: 'Postie v11.1 available', body: 'New features: improved API documentation and test runner.', time: '2h ago', read: false },
  { id: 2, type: 'collab', title: 'Team Alpha shared a collection', body: '"Payment Gateway API" has been shared with you.', time: '5h ago', read: false },
  { id: 3, type: 'info', title: 'API usage report ready', body: 'Your monthly API usage report for March is ready to view.', time: '1d ago', read: true },
  { id: 4, type: 'warn', title: 'API key expiring soon', body: 'Your API key "prod-key-789" expires in 7 days.', time: '2d ago', read: true },
  { id: 5, type: 'info', title: 'New monitor alert', body: 'Monitor "Health Check" ran successfully 100 times.', time: '3d ago', read: true },
];

const NOTIF_ICONS = {
  update: { bg: '#1e3a5f', color: '#6bc5f8', label: 'UP' },
  collab: { bg: '#1e3a2f', color: '#3ecf8e', label: 'CO' },
  info: { bg: '#2a2a1e', color: '#fca130', label: 'IN' },
  warn: { bg: '#3a1e1e', color: '#f93e3e', label: 'WN' },
};

export const NotificationPanel = ({ onClose }) => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{
      position: 'fixed', top: 48, right: 0, width: '360px', height: 'calc(100vh - 48px)',
      background: '#1e1e1e', borderLeft: '1px solid #333', zIndex: 500,
      display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
      animation: 'slideInRight 0.2s ease-out'
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #2d2d2d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={15} style={{ color: '#FF6C37' }} />
          <span style={{ color: '#e0e0e0', fontWeight: '600', fontSize: '14px' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ background: '#FF6C37', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '10px', fontWeight: '700' }}>{unreadCount}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#888', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FF6C37'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}
            >Mark all read</button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#333'; e.currentTarget.style.color = '#e0e0e0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#777'; }}
          ><X size={14} /></button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {notifications.map(n => {
          const icon = NOTIF_ICONS[n.type] || NOTIF_ICONS.info;
          return (
            <div key={n.id}
              onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
              style={{
                padding: '12px 16px', borderBottom: '1px solid #252525', cursor: 'pointer',
                background: n.read ? 'transparent' : 'rgba(255,108,55,0.04)',
                display: 'flex', gap: '12px', alignItems: 'flex-start', transition: 'background 0.1s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#252525'; }}
              onMouseLeave={e => { e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(255,108,55,0.04)'; }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: icon.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: icon.color, fontSize: '10px', fontWeight: '700' }}>{icon.label}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <span style={{ color: n.read ? '#ccc' : '#e0e0e0', fontSize: '12px', fontWeight: n.read ? '400' : '600' }}>{n.title}</span>
                  {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6C37', flexShrink: 0 }} />}
                </div>
                <div style={{ color: '#888', fontSize: '11px', lineHeight: '1.4', marginBottom: '4px' }}>{n.body}</div>
                <div style={{ color: '#555', fontSize: '10px' }}>{n.time}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid #2d2d2d', textAlign: 'center' }}>
        <button style={{ background: 'none', border: 'none', color: '#FF6C37', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>View all notifications</button>
      </div>
    </div>
  );
};

/* ─── SETTINGS MODAL ─────────────────────────────────────────────────── */
const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: <Settings size={14} /> },
  { id: 'themes', label: 'Themes', icon: <Palette size={14} /> },
  { id: 'proxy', label: 'Proxy', icon: <Globe size={14} /> },
  { id: 'certificates', label: 'Certificates', icon: <Shield size={14} /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Zap size={14} /> },
  { id: 'data', label: 'Data', icon: <Database size={14} /> },
  { id: 'addons', label: 'Add-ons', icon: <Key size={14} /> },
];

export const SettingsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    followRedirects: true, sendNoCacheHeader: false, sslVerification: true,
    autoEncodeURL: true, language: 'en', requestTimeout: '0', maxResponseSize: '50',
    sendAnonymousData: false, fontSize: 14,
  });

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '760px', maxWidth: '90vw', height: '540px', background: '#1e1e1e', borderRadius: '8px', border: '1px solid #333', display: 'flex', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', position: 'relative' }}>
        {/* Close button — top right corner */}
        <button onClick={onClose}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#333'; e.currentTarget.style.color = '#e0e0e0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#666'; }}
        ><X size={16} /></button>
        {/* Left sidebar */}
        <div style={{ width: '180px', background: '#252525', borderRight: '1px solid #2d2d2d', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #2d2d2d' }}>
            <span style={{ color: '#e0e0e0', fontWeight: '600', fontSize: '13px' }}>Settings</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {SETTINGS_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%', background: activeTab === tab.id ? 'rgba(255,108,55,0.12)' : 'none',
                  border: 'none', borderLeft: activeTab === tab.id ? '2px solid #FF6C37' : '2px solid transparent',
                  padding: '9px 16px', color: activeTab === tab.id ? '#FF6C37' : '#aaa',
                  fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.1s'
                }}
                onMouseEnter={e => { if (activeTab !== tab.id) { e.currentTarget.style.background = '#2d2d2d'; e.currentTarget.style.color = '#e0e0e0'; } }}
                onMouseLeave={e => { if (activeTab !== tab.id) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#aaa'; } }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px' }}>
          {activeTab === 'general' && (
            <div>
              <h3 style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: '600', margin: 0, position: 'sticky', top: 0, background: '#1e1e1e', padding: '20px 0 12px', zIndex: 1, borderBottom: '1px solid #2a2a2a' }}>General Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '12px', paddingBottom: '20px' }}>
                {[
                  { key: 'followRedirects', label: 'Follow redirects', desc: 'Automatically follow HTTP redirects' },
                  { key: 'sendNoCacheHeader', label: 'Send no-cache header', desc: 'Add Cache-Control: no-cache to requests' },
                  { key: 'sslVerification', label: 'SSL certificate verification', desc: 'Verify SSL certificates for HTTPS' },
                  { key: 'autoEncodeURL', label: 'Auto-encode URLs', desc: 'Percent-encode special characters' },
                  { key: 'sendAnonymousData', label: 'Send anonymous usage data', desc: 'Help improve Postie by sending usage data' },
                ].map(item => (
                  <SettingRow key={item.key} label={item.label} desc={item.desc}
                    value={settings[item.key]} onChange={() => toggle(item.key)} />
                ))}
                <div style={{ marginTop: '8px', padding: '12px', background: '#252525', borderRadius: '6px', border: '1px solid #2d2d2d' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Request Timeout (ms) — 0 = no timeout</label>
                  <input value={settings.requestTimeout}
                    onChange={e => setSettings(prev => ({ ...prev, requestTimeout: e.target.value }))}
                    style={{ background: '#1e1e1e', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '6px 10px', color: '#e0e0e0', fontSize: '12px', outline: 'none', width: '120px', fontFamily: 'inherit' }}
                    onFocus={e => { e.target.style.borderColor = '#FF6C37'; }}
                    onBlur={e => { e.target.style.borderColor = '#3d3d3d'; }}
                  />
                </div>
                <div style={{ padding: '12px', background: '#252525', borderRadius: '6px', border: '1px solid #2d2d2d' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Editor Font Size: {settings.fontSize}px</label>
                  <input type="range" min={10} max={20} value={settings.fontSize}
                    onChange={e => setSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                    style={{ accentColor: '#FF6C37', width: '200px' }}
                  />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'themes' && (
            <div>
              <h3 style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: '600', margin: 0, position: 'sticky', top: 0, background: '#1e1e1e', padding: '20px 0 12px', zIndex: 1, borderBottom: '1px solid #2a2a2a', marginBottom: '12px' }}>Themes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { id: 'dark', label: 'Dark', bg: '#1e1e1e', accent: '#FF6C37' },
                  { id: 'light', label: 'Light', bg: '#f5f5f5', accent: '#FF6C37' },
                  { id: 'dark-blue', label: 'Dark Blue', bg: '#0d1117', accent: '#58a6ff' },
                  { id: 'monokai', label: 'Monokai', bg: '#272822', accent: '#a6e22e' },
                ].map(theme => (
                  <div key={theme.id} onClick={() => { }}
                    style={{ padding: '12px', background: theme.bg, borderRadius: '8px', border: theme.id === 'dark' ? '2px solid #FF6C37' : '2px solid #333', cursor: 'pointer', position: 'relative' }}
                  >
                    {theme.id === 'dark' && <Check size={12} style={{ position: 'absolute', top: '8px', right: '8px', color: '#FF6C37' }} />}
                    <div style={{ height: '40px', background: theme.accent, borderRadius: '4px', marginBottom: '8px', opacity: 0.3 }} />
                    <span style={{ color: theme.id === 'dark' ? '#e0e0e0' : '#999', fontSize: '12px' }}>{theme.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'proxy' && (
            <div>
              <h3 style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: '600', margin: 0, position: 'sticky', top: 0, background: '#1e1e1e', padding: '20px 0 12px', zIndex: 1, borderBottom: '1px solid #2a2a2a', marginBottom: '12px' }}>Proxy Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <SettingRow label="Use system proxy" desc="Use your system's proxy configuration" value={false} onChange={() => { }} />
                <SettingRow label="Add custom proxy" desc="Configure a custom proxy server" value={false} onChange={() => { }} />
                <div style={{ padding: '12px', background: '#252525', borderRadius: '6px', border: '1px solid #2d2d2d', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Proxy Server', 'Port', 'Username', 'Password'].map(field => (
                    <div key={field}>
                      <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{field}</label>
                      <input placeholder={field === 'Port' ? '8080' : ''} type={field === 'Password' ? 'password' : 'text'}
                        style={{ width: '100%', background: '#1e1e1e', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '6px 10px', color: '#e0e0e0', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => { e.target.style.borderColor = '#FF6C37'; }}
                        onBlur={e => { e.target.style.borderColor = '#3d3d3d'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {['certificates', 'shortcuts', 'data', 'addons'].includes(activeTab) && (
            <div>
              {activeTab === 'certificates' && (
                <div>
                  <h3 style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: '600', margin: 0, position: 'sticky', top: 0, background: '#1e1e1e', padding: '20px 0 12px', zIndex: 1, borderBottom: '1px solid #2a2a2a', marginBottom: '12px' }}>Client Certificates</h3>
                  <p style={{ color: '#888', fontSize: '12px', marginBottom: '20px', lineHeight: 1.5 }}>Certificates are used to authenticate requests to servers that require mutual TLS.</p>
                  <div style={{ padding: '16px', background: '#252525', borderRadius: '6px', border: '1px solid #2d2d2d', marginBottom: '12px' }}>
                    {[{ label: 'Host', placeholder: 'example.com:443' }, { label: 'PFX / CRT file', placeholder: 'Choose file...' }, { label: 'KEY file', placeholder: 'Choose file (optional)' }, { label: 'Passphrase', placeholder: 'Certificate passphrase (optional)' }].map(f => (
                      <div key={f.label} style={{ marginBottom: '10px' }}>
                        <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                        <input placeholder={f.placeholder} style={{ width: '100%', background: '#1e1e1e', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '6px 10px', color: '#e0e0e0', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                          onFocus={e => { e.target.style.borderColor = '#FF6C37'; }} onBlur={e => { e.target.style.borderColor = '#3d3d3d'; }} />
                      </div>
                    ))}
                    <button style={{ background: '#FF6C37', border: 'none', borderRadius: '4px', padding: '7px 16px', color: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', marginTop: '4px', transition: 'background 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#e55a28'; }} onMouseLeave={e => { e.currentTarget.style.background = '#FF6C37'; }}>Add Certificate</button>
                  </div>
                  <div style={{ color: '#555', fontSize: '12px', padding: '12px', border: '1px dashed #2d2d2d', borderRadius: '6px', textAlign: 'center' }}>No client certificates added</div>
                </div>
              )}
              {activeTab === 'shortcuts' && (
                <div>
                  <h3 style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: '600', margin: 0, position: 'sticky', top: 0, background: '#1e1e1e', padding: '20px 0 12px', zIndex: 1, borderBottom: '1px solid #2a2a2a', marginBottom: '12px' }}>Keyboard Shortcuts</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      ['Send request', 'Ctrl + Enter'], ['Save request', 'Ctrl + S'], ['New tab', 'Ctrl + T'],
                      ['Close tab', 'Ctrl + W'], ['Duplicate tab', 'Ctrl + D'], ['Next tab', 'Ctrl + Tab'],
                      ['Previous tab', 'Ctrl + Shift + Tab'], ['Open search', 'Ctrl + K'],
                      ['New collection', 'Ctrl + Alt + N'], ['Toggle sidebar', 'Ctrl + B'],
                    ].map(([action, shortcut]) => (
                      <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#252525', borderRadius: '4px' }}>
                        <span style={{ color: '#ccc', fontSize: '12px' }}>{action}</span>
                        <span style={{ background: '#1e1e1e', border: '1px solid #3d3d3d', borderRadius: '4px', padding: '2px 8px', color: '#e8a87c', fontSize: '11px', fontFamily: 'monospace' }}>{shortcut}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'data' && (
                <div>
                  <h3 style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: '600', margin: 0, position: 'sticky', top: 0, background: '#1e1e1e', padding: '20px 0 12px', zIndex: 1, borderBottom: '1px solid #2a2a2a', marginBottom: '12px' }}>Import / Export Data</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { title: 'Export Data', desc: 'Download all your collections, environments and globals as a JSON file.', btn: 'Export', btnColor: '#FF6C37' },
                      { title: 'Import Data', desc: 'Restore collections and environments from a previously exported file.', btn: 'Import', btnColor: '#3ecf8e' },
                    ].map(s => (
                      <div key={s.title} style={{ padding: '14px', background: '#252525', borderRadius: '6px', border: '1px solid #2d2d2d' }}>
                        <div style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>{s.title}</div>
                        <div style={{ color: '#888', fontSize: '11px', lineHeight: 1.5, marginBottom: '10px' }}>{s.desc}</div>
                        <button style={{ background: s.btnColor, border: 'none', borderRadius: '4px', padding: '6px 16px', color: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>{s.btn}</button>
                      </div>
                    ))}
                    <div style={{ padding: '12px', background: '#252525', borderRadius: '6px', border: '1px solid #2d2d2d' }}>
                      <div style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>Clear Cache</div>
                      <div style={{ color: '#888', fontSize: '11px', lineHeight: 1.5, marginBottom: '10px' }}>Clear locally cached data. This does not delete your collections.</div>
                      <button style={{ background: 'none', border: '1px solid #f93e3e', borderRadius: '4px', padding: '6px 16px', color: '#f93e3e', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>Clear Cache</button>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'addons' && (
                <div>
                  <h3 style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: '600', margin: 0, position: 'sticky', top: 0, background: '#1e1e1e', padding: '20px 0 12px', zIndex: 1, borderBottom: '1px solid #2a2a2a', marginBottom: '12px' }}>Add-ons</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { name: 'Interceptor', desc: 'Capture browser cookies and requests from websites', installed: true, version: '1.0.4' },
                      { name: 'Newman CLI', desc: 'Run Postie collections from the command line', installed: false, version: '6.1.0' },
                      { name: 'Postie VSCode', desc: 'Use Postie directly inside Visual Studio Code', installed: false, version: '0.1.2' },
                    ].map(addon => (
                      <div key={addon.name} style={{ padding: '12px', background: '#252525', borderRadius: '6px', border: '1px solid #2d2d2d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: '#e0e0e0', fontSize: '12px', fontWeight: '500', marginBottom: '2px' }}>{addon.name} <span style={{ color: '#555', fontSize: '10px' }}>v{addon.version}</span></div>
                          <div style={{ color: '#888', fontSize: '11px' }}>{addon.desc}</div>
                        </div>
                        <button style={{ background: addon.installed ? '#1e3a1e' : '#FF6C37', border: addon.installed ? '1px solid #3ecf8e' : 'none', borderRadius: '4px', padding: '5px 12px', color: addon.installed ? '#3ecf8e' : '#fff', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', flexShrink: 0 }}>
                          {addon.installed ? 'Installed' : 'Install'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SettingRow = ({ label, desc, value, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#252525', borderRadius: '6px', border: '1px solid #2d2d2d' }}>
    <div>
      <div style={{ color: '#e0e0e0', fontSize: '12px', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: '#666', fontSize: '11px' }}>{desc}</div>
    </div>
    <div onClick={onChange}
      style={{ width: '34px', height: '18px', borderRadius: '9px', background: value ? '#FF6C37' : '#3d3d3d', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: value ? '19px' : '3px', transition: 'left 0.2s' }} />
    </div>
  </div>
);

/* ─── USER PROFILE MODAL ────────────────────────────────────────────── */
export const UserModal = ({ onClose }) => {
  const menuItems = [
    { icon: <User size={14} />, label: 'Profile', sub: 'View and edit your profile' },
    { icon: <CreditCard size={14} />, label: 'Upgrade Plan', sub: 'Unlock more features', accent: true },
    { icon: <Shield size={14} />, label: 'Security', sub: 'Manage passwords and 2FA' },
    { icon: <HelpCircle size={14} />, label: 'Help & Support', sub: 'Documentation and forums' },
    { icon: <LogOut size={14} />, label: 'Sign Out', sub: null, danger: true },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 700 }} onClick={onClose}>
      <div style={{ position: 'absolute', top: '48px', right: '8px', width: '280px', background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* User info */}
        <div style={{ padding: '16px', background: '#252525', borderBottom: '1px solid #2d2d2d', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6C37, #ff9966)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>U</span>
          </div>
          <div>
            <div style={{ color: '#e0e0e0', fontWeight: '600', fontSize: '13px' }}>User</div>
            <div style={{ color: '#888', fontSize: '11px' }}>user@example.com</div>
            <div style={{ marginTop: '4px' }}>
              <span style={{ background: '#2d2d2d', border: '1px solid #3d3d3d', color: '#aaa', fontSize: '9px', padding: '1px 6px', borderRadius: '3px', fontWeight: '600', letterSpacing: '0.3px' }}>FREE</span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div style={{ padding: '6px 0' }}>
          {menuItems.map((item, i) => (
            <button key={i}
              style={{
                width: '100%', background: 'none', border: 'none', padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background 0.1s',
                borderTop: item.label === 'Sign Out' ? '1px solid #2d2d2d' : 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#252525'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ color: item.danger ? '#f93e3e' : item.accent ? '#FF6C37' : '#888' }}>{item.icon}</span>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ color: item.danger ? '#f93e3e' : item.accent ? '#FF6C37' : '#e0e0e0', fontSize: '12px', fontWeight: '500' }}>{item.label}</div>
                {item.sub && <div style={{ color: '#666', fontSize: '10px', marginTop: '1px' }}>{item.sub}</div>}
              </div>
              {!item.danger && <ChevronRight size={12} style={{ color: '#555' }} />}
            </button>
          ))}
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid #2d2d2d', background: '#252525' }}>
          <div style={{ color: '#555', fontSize: '10px', textAlign: 'center' }}>Postie v11.0 · <span style={{ cursor: 'pointer', color: '#777' }}>Privacy Policy</span> · <span style={{ cursor: 'pointer', color: '#777' }}>Terms</span></div>
        </div>
      </div>
    </div>
  );
};
