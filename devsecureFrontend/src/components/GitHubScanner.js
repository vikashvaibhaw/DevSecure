import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const GitHubScanner = ({ organizationId, setStats }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
  if (organizationId) {
    fetchAlerts();
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) setGithubToken(savedToken);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [organizationId]);

  useEffect(() => {
    if (setStats) setStats(prev => ({ ...prev, alerts: alerts.filter(a => !a.fixed).length }));
  }, [alerts, setStats]);

  const fetchAlerts = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/scanner/${organizationId}/alerts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!repoUrl) { toast.error('Enter a GitHub repository URL'); return; }
    if (githubToken) localStorage.setItem('github_token', githubToken);
    setScanning(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/scanner/${organizationId}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-GitHub-Token': githubToken,
        },
        body: JSON.stringify({ repoUrl, githubToken }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Scan initiated — results in a few seconds');
        setRepoUrl('');
        setTimeout(() => { fetchAlerts(); toast.success('Scan complete'); }, 4000);
      } else {
        toast.error(data.error || 'Scan failed');
      }
    } catch {
      toast.error('Failed to connect to scanner');
    } finally {
      setScanning(false);
    }
  };

  const handleFix = async (alertId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/scanner/${organizationId}/alerts/${alertId}/fix`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success('Alert resolved');
        fetchAlerts();
      }
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  const severityConfig = {
    critical: { label: 'Critical', color: 'var(--accent-red)', bg: 'var(--accent-red-dim)', border: 'rgba(255,68,68,0.3)', icon: '🔴', order: 0 },
    high: { label: 'High', color: 'var(--accent-orange)', bg: 'var(--accent-orange-dim)', border: 'rgba(255,140,66,0.3)', icon: '🟠', order: 1 },
    medium: { label: 'Medium', color: 'var(--accent-yellow)', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.3)', icon: '🟡', order: 2 },
    low: { label: 'Low', color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)', border: 'rgba(0,180,216,0.3)', icon: '🔵', order: 3 },
  };

  const filteredAlerts = alerts
    .filter(a => filter === 'all' || (filter === 'open' && !a.fixed) || (filter === 'fixed' && a.fixed) || a.severity === filter)
    .sort((a, b) => (severityConfig[a.severity]?.order ?? 9) - (severityConfig[b.severity]?.order ?? 9));

  const openCount = alerts.filter(a => !a.fixed).length;
  const critCount = alerts.filter(a => a.severity === 'critical' && !a.fixed).length;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="var(--accent-cyan)" strokeWidth="1.5"/>
            <path d="M21 21l-4.35-4.35" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          GitHub Security Scanner
          {openCount > 0 && (
            <span className="badge badge-critical" style={{ fontSize: 11 }}>
              {openCount} open
            </span>
          )}
        </div>
        <button
          onClick={() => setShowTokenInput(!showTokenInput)}
          className="btn btn-ghost"
          style={{ padding: '4px 10px', fontSize: 12 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
          {githubToken ? 'Token ✓' : 'Add Token'}
        </button>
      </div>

      {/* Token input (collapsible) */}
      {showTokenInput && (
        <div style={{
          padding: '14px 20px',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <label className="label">GitHub Personal Access Token</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="input"
              placeholder="github_pat_xxxxxxxxxxxxxxxxxxxx"
              style={{ flex: 1 }}
            />
            <button
              onClick={() => {
                if (githubToken) {
                  localStorage.setItem('github_token', githubToken);
                  toast.success('Token saved');
                  setShowTokenInput(false);
                }
              }}
              className="btn btn-primary"
              style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}
            >
              Save
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Increases rate limit from 60 to 5,000 req/hr •{' '}
            <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent-cyan)' }}>
              Create token →
            </a>
          </p>
        </div>
      )}

      {/* Scan form */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Scan repositories for leaked secrets, API keys, and credentials
        </p>
        <form onSubmit={handleScan}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="input"
                placeholder="https://github.com/owner/repository"
                required
                style={{ paddingLeft: '36px' }}
              />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
              </svg>
            </div>
            <button
              type="submit"
              disabled={scanning}
              className="btn btn-primary"
              style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
            >
              {scanning ? (
                <><div className="spinner" style={{ width: 14, height: 14 }} />Scanning...</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>Scan</>
              )}
            </button>
          </div>

          <div style={{ marginTop: 8, fontSize: 11 }}>
            {githubToken ? (
              <span style={{ color: 'var(--accent-green)' }}>✓ Authenticated — 5,000 requests/hour</span>
            ) : (
              <span style={{ color: 'var(--accent-yellow)' }}>⚠ Unauthenticated — 60 requests/hour limit</span>
            )}
          </div>
        </form>
      </div>

      {/* Alert summary bar */}
      {alerts.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 20px',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Filter:
          </span>
          {['all', 'open', 'critical', 'high', 'medium', 'fixed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '3px 10px', borderRadius: 99,
                border: `1px solid ${filter === f ? 'var(--accent-green)' : 'var(--border)'}`,
                background: filter === f ? 'var(--accent-green-dim)' : 'transparent',
                color: filter === f ? 'var(--accent-green)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: 11,
                fontFamily: 'var(--font-mono)', transition: 'var(--transition)',
                textTransform: 'capitalize',
              }}
            >
              {f}
              {f === 'open' && openCount > 0 && <span style={{ marginLeft: 4 }}>({openCount})</span>}
              {f === 'critical' && critCount > 0 && <span style={{ marginLeft: 4, color: 'var(--accent-red)' }}>({critCount})</span>}
            </button>
          ))}
          <button
            onClick={fetchAlerts}
            style={{
              marginLeft: 'auto', padding: '3px 10px',
              border: '1px solid var(--border)', borderRadius: 99,
              background: 'transparent', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      )}

      {/* Alerts section */}
      <div style={{ padding: '16px 20px' }}>
        <button
          onClick={() => setShowAlerts(!showAlerts)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
            fontSize: 14, fontWeight: 600, marginBottom: showAlerts ? 14 : 0,
            padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Security Alerts
          <span className={`badge ${openCount > 0 ? 'badge-critical' : 'badge-green'}`}>{alerts.length}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ marginLeft: 4, transform: showAlerts ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {showAlerts && (
          <div>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fetching security alerts...</p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div style={{
                padding: '40px 24px', textAlign: 'center',
                background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border)',
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>
                  {alerts.length === 0 ? '🛡️' : '🔍'}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>
                  {alerts.length === 0 ? 'No alerts found' : 'No alerts match filter'}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {alerts.length === 0 ? 'Scan a repository to detect leaked secrets' : 'Try changing the filter'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
                {filteredAlerts.map((alert) => {
                  const sev = severityConfig[alert.severity] || severityConfig.low;
                  let details = null;
                  try { details = typeof alert.details === 'string' ? JSON.parse(alert.details) : alert.details; } catch {}
                  return (
                    <div
                      key={alert.id}
                      className="alert-item"
                      style={{ opacity: alert.fixed ? 0.6 : 1 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          {/* Alert header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', borderRadius: 99,
                              background: sev.bg, border: `1px solid ${sev.border}`,
                              color: sev.color, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}>
                              {sev.icon} {sev.label}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {alert.alert_type}
                            </span>
                            {alert.fixed && (
                              <span style={{ fontSize: 11, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                Resolved
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                            {alert.description}
                          </p>

                          {/* Details */}
                          {details && (
                            <div style={{
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '8px 12px',
                              marginBottom: 8,
                            }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
                                {details.file && (
                                  <>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>File:</span>
                                    <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                                      {details.file}:{details.line}
                                    </span>
                                  </>
                                )}
                                {details.matched_value && (
                                  <>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Match:</span>
                                    <span style={{ fontSize: 11, color: sev.color, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                                      {details.matched_value}
                                    </span>
                                  </>
                                )}
                                {details.repo && (
                                  <>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Repo:</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                      {details.repo}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(alert.created_at).toLocaleString()}
                          </div>
                        </div>

                        {/* Fix button */}
                        {!alert.fixed && (
                          <button
                            onClick={() => handleFix(alert.id)}
                            className="btn"
                            style={{
                              padding: '5px 12px', fontSize: 12,
                              background: 'var(--accent-green-dim)',
                              color: 'var(--accent-green)',
                              border: '1px solid rgba(0,208,132,0.3)',
                              flexShrink: 0,
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Patterns legend */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 20px' }}>
        <details>
          <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', userSelect: 'none', listStyle: 'none' }}>
            <span>▸ Detected patterns: OpenAI Keys, AWS Keys, GitHub Tokens, DB URLs, JWT Secrets, MongoDB URIs, Passwords</span>
          </summary>
        </details>
      </div>
    </div>
  );
};

export default GitHubScanner;
