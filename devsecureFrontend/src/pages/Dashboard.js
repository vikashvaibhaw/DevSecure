import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrganizations, createOrganization, switchOrganization, getActiveOrganization } from '../services/api';
import SecretsManager from '../components/SecretsManager';
import GitHubScanner from '../components/GitHubScanner';
import toast from 'react-hot-toast';
import '../index.css'


const Dashboard = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ secrets: 0, alerts: 0 });
  const [activeTab, setActiveTab] = useState('secrets');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadOrganizations = useCallback(async () => {
    try {
      const [orgsRes, activeRes] = await Promise.all([
        getOrganizations(),
        getActiveOrganization(),
      ]);
      setOrganizations(orgsRes.data.organizations);
      setActiveOrg(activeRes.data.organization);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return;
  }
  loadOrganizations();
}, [loadOrganizations, navigate]);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      await createOrganization(newOrgName);
      toast.success('Organization created');
      setShowCreateOrg(false);
      setNewOrgName('');
      loadOrganizations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create');
    }
  };

  const handleSwitch = async (orgId) => {
    try {
      await switchOrganization(orgId);
      await loadOrganizations();
      setSidebarOpen(false);
      toast.success('Organization switched');
    } catch {
      toast.error('Failed to switch');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    toast.success('Signed out');
  };

  const securityScore = stats.alerts === 0 ? 100 : Math.max(0, 100 - (stats.alerts * 5));

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }} className="grid-bg">
        <div style={{
          width: 48, height: 48,
          border: '2px solid var(--border)',
          borderTop: '2px solid var(--accent-green)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          Initializing secure session...
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}
      className="grid-bg noise scanline">

      {/* Top Navbar */}
      <nav style={{
        background: 'rgba(13,17,23,0.95)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 20px',
        height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-ghost"
            style={{ padding: '6px', display: 'none' }}
            id="mobile-menu-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              background: 'var(--accent-green-dim)',
              border: '1px solid rgba(0,208,132,0.3)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6V12C4 15.31 7.58 19.5 12 22C16.42 19.5 20 15.31 20 12V6L12 2Z"
                  fill="rgba(0,208,132,0.2)" stroke="var(--accent-green)" strokeWidth="1.5"/>
                <path d="M9 12L11 14L15 10" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>
              DevSecure AI
            </span>
          </div>

          {/* Active org pill */}
          {activeOrg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: 99, padding: '3px 10px 3px 6px',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{activeOrg.name}</span>
              <span className="badge badge-purple" style={{ padding: '1px 6px', fontSize: 10 }}>{activeOrg.role}</span>
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowCreateOrg(true)}
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="hide-mobile">New Org</span>
          </button>

          {/* User avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, color: 'var(--accent-green)',
            cursor: 'default',
          }} title={user.email}>
            {(user.full_name || user.email || 'U')[0].toUpperCase()}
          </div>

          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="hide-mobile">Logout</span>
          </button>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width: '240px', minWidth: '240px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          padding: '16px',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: 'var(--text-muted)',
            padding: '4px 8px', marginBottom: 4,
          }}>
            Organizations
          </div>

          {organizations.length === 0 ? (
            <div style={{
              padding: '24px 8px', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: 12,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🏢</div>
              No organizations yet
            </div>
          ) : (
            organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '8px 10px', borderRadius: 'var(--radius-md)',
                  border: '1px solid transparent',
                  background: activeOrg?.id === org.id ? 'var(--accent-green-dim)' : 'transparent',
                  borderColor: activeOrg?.id === org.id ? 'rgba(0,208,132,0.2)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
                onMouseEnter={e => { if (activeOrg?.id !== org.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (activeOrg?.id !== org.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: activeOrg?.id === org.id ? 'var(--accent-green)' : 'var(--border-bright)',
                  }} />
                  <span style={{
                    fontSize: 13,
                    color: activeOrg?.id === org.id ? 'var(--accent-green)' : 'var(--text-primary)',
                    fontWeight: activeOrg?.id === org.id ? 600 : 400,
                  }}>{org.name}</span>
                </div>
                <span style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: activeOrg?.id === org.id ? 'var(--accent-green)' : 'var(--text-muted)',
                }}>{org.role}</span>
              </button>
            ))
          )}

          <button
            onClick={() => setShowCreateOrg(true)}
            style={{
              marginTop: 8, width: '100%', padding: '8px 10px',
              background: 'transparent', border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.color = 'var(--accent-green)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Organization
          </button>

          {/* Sidebar stats */}
          {activeOrg && (
            <div style={{
              marginTop: 'auto', paddingTop: 16,
              borderTop: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 10 }}>
                Quick Stats
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Secrets</span>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{stats.secrets}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Alerts</span>
                  <span style={{ color: stats.alerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 600 }}>{stats.alerts}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Score</span>
                  <span style={{ color: securityScore >= 90 ? 'var(--accent-green)' : securityScore >= 70 ? 'var(--accent-orange)' : 'var(--accent-red)', fontWeight: 600 }}>{securityScore}%</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {!activeOrg ? (
            /* No org selected */
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 16, minHeight: '400px',
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
              }}>🏢</div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                  No Organization Selected
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Create or select an organization from the sidebar to get started
                </p>
              </div>
              <button onClick={() => setShowCreateOrg(true)} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Create Organization
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeInUp 0.4s ease' }}>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {/* Secrets stat */}
                <div className="stat-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="stat-label">Secrets Stored</span>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'var(--accent-green-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="var(--accent-green)" strokeWidth="1.5"/>
                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--accent-green)" strokeWidth="1.5"/>
                      </svg>
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.secrets}</div>
                  <div className="stat-label">AES-256 Encrypted</div>
                </div>

                {/* Alerts stat */}
                <div className="stat-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="stat-label">Security Alerts</span>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: stats.alerts > 0 ? 'var(--accent-red-dim)' : 'var(--accent-green-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={stats.alerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} strokeWidth="1.5"/>
                        <line x1="12" y1="9" x2="12" y2="13" stroke={stats.alerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} strokeWidth="1.5"/>
                        <line x1="12" y1="17" x2="12.01" y2="17" stroke={stats.alerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: stats.alerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                    {stats.alerts}
                  </div>
                  <div className="stat-label">{stats.alerts > 0 ? 'Needs attention' : 'All clear'}</div>
                </div>

                {/* Score stat */}
                <div className="stat-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="stat-label">Security Score</span>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: securityScore >= 90 ? 'var(--accent-green-dim)' : 'var(--accent-orange-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L4 6V12C4 15.31 7.58 19.5 12 22C16.42 19.5 20 15.31 20 12V6L12 2Z"
                          stroke={securityScore >= 90 ? 'var(--accent-green)' : 'var(--accent-orange)'} strokeWidth="1.5"/>
                        <path d="M9 12L11 14L15 10" stroke={securityScore >= 90 ? 'var(--accent-green)' : 'var(--accent-orange)'} strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: securityScore >= 90 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                    {securityScore}%
                  </div>
                  <div className="stat-label">
                    {/* Score bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${securityScore}%`,
                          background: securityScore >= 90 ? 'var(--accent-green)' : 'var(--accent-orange)',
                          borderRadius: 2, transition: 'width 1s ease',
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Welcome banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0,208,132,0.08) 0%, rgba(0,180,216,0.05) 100%)',
                border: '1px solid rgba(0,208,132,0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                    Welcome back{user.full_name ? `, ${user.full_name}` : ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Workspace:</span>{' '}
                    <span style={{ color: 'var(--accent-green)' }}>{activeOrg.name}</span>
                    <span style={{ margin: '0 8px', color: 'var(--border-bright)' }}>·</span>
                    <span style={{ color: 'var(--text-muted)' }}>Role:</span>{' '}
                    <span style={{ color: 'var(--accent-purple)' }}>{activeOrg.role}</span>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11, color: 'var(--accent-green)',
                  background: 'var(--accent-green-dim)',
                  border: '1px solid rgba(0,208,132,0.2)',
                  borderRadius: 99, padding: '4px 12px',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse-glow 2s infinite' }} />
                  Secure Session
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 4, width: 'fit-content' }}>
                {[
                  { key: 'secrets', label: 'Secrets Vault', icon: '🔒' },
                  { key: 'scanner', label: 'GitHub Scanner', icon: '🔍' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 500,
                      transition: 'var(--transition)',
                      background: activeTab === tab.key ? 'var(--bg-tertiary)' : 'transparent',
                      color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', gap: 6,
                      boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: activeTab === tab.key ? 'var(--border)' : 'transparent',
                    }}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'secrets' ? (
                <SecretsManager organizationId={activeOrg.id} userRole={activeOrg.role} setStats={setStats} />
              ) : (
                <GitHubScanner organizationId={activeOrg.id} setStats={setStats} />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Create Org Modal */}
      {showCreateOrg && (
        <div className="modal-backdrop" onClick={() => setShowCreateOrg(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                New Organization
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Create an isolated workspace for your team
              </p>
            </div>
            <form onSubmit={handleCreateOrg}>
              <div style={{ marginBottom: 20 }}>
                <label className="label">Organization Name</label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="input"
                  placeholder="e.g., Acme Corp"
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateOrg(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
