import React, { useState, useEffect } from 'react';
import { createSecret, getSecrets, deleteSecret } from '../services/api';
import toast from 'react-hot-toast';

const SecretsManager = ({ organizationId, userRole, setStats }) => {
  const [secrets, setSecrets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingSecret, setViewingSecret] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (setStats) setStats(prev => ({ ...prev, secrets: secrets.length }));
  }, [secrets, setStats]);

  useEffect(() => {
    if (organizationId) loadSecrets();
  }, [organizationId]);

  const loadSecrets = async () => {
    setLoading(true);
    try {
      const response = await getSecrets(organizationId);
      setSecrets(response.data.secrets);
    } catch {
      toast.error('Failed to load secrets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createSecret(organizationId, newKeyName, newValue);
      toast.success('Secret stored securely');
      setShowCreateModal(false);
      setNewKeyName('');
      setNewValue('');
      loadSecrets();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create secret');
    }
  };

  const handleView = async (secretId, keyName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/${organizationId}/secrets/${secretId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setViewingSecret({ id: secretId, value: data.secret.value, key_name: keyName });
    } catch {
      toast.error('Failed to retrieve secret');
    }
  };

  const handleDelete = async (secretId) => {
    try {
      await deleteSecret(organizationId, secretId);
      toast.success('Secret deleted');
      setDeleteConfirm(null);
      loadSecrets();
    } catch {
      toast.error('Failed to delete secret');
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const canCreate = userRole === 'admin' || userRole === 'developer';
  const canDelete = userRole === 'admin';

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
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--accent-green)" strokeWidth="1.5"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--accent-green)" strokeWidth="1.5"/>
          </svg>
          Secrets Vault
          <span className="badge badge-green" style={{ fontSize: 11 }}>{secrets.length}</span>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Secret
          </button>
        )}
      </div>

      {/* Role banner */}
      {userRole === 'viewer' && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(255,215,0,0.05)',
          borderBottom: '1px solid rgba(255,215,0,0.15)',
          fontSize: 12, color: 'var(--accent-yellow)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          View-only access — contact an admin to manage secrets
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Decrypting vault...</p>
        </div>
      ) : secrets.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>Vault is empty</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Add your first API key or credential to get started</p>
          {canCreate && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ marginTop: 16 }}>
              Add First Secret
            </button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Key Name', 'Created', 'Actions'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 20px',
                    textAlign: i === 2 ? 'right' : 'left',
                    fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-tertiary)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {secrets.map((secret, idx) => (
                <tr
                  key={secret.id}
                  style={{
                    borderBottom: idx < secrets.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: 'var(--accent-green-dim)',
                        border: '1px solid rgba(0,208,132,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--accent-green)" strokeWidth="1.5"/>
                          <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--accent-green)" strokeWidth="1.5"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {secret.key_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          ••••••••••••••••
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(secret.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        onClick={() => handleView(secret.id, secret.key_name)}
                        className="btn btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        title="View secret"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        View
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setDeleteConfirm(secret.id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          title="Delete secret"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Secret Modal */}
      {viewingSecret && (
        <div className="modal-backdrop" onClick={() => setViewingSecret(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--accent-green-dim)', border: '1px solid rgba(0,208,132,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--accent-green)" strokeWidth="1.5"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--accent-green)" strokeWidth="1.5"/>
                  </svg>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>Secret Value</h2>
              </div>
              <span className="badge badge-green" style={{ fontSize: 11 }}>{viewingSecret.key_name}</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="label">Decrypted Value</label>
              <div className="code-block" style={{ position: 'relative' }}>
                <code style={{ wordBreak: 'break-all', fontSize: 12, lineHeight: 1.6 }}>
                  {viewingSecret.value}
                </code>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleCopy(viewingSecret.value, viewingSecret.id)}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {copiedId === viewingSecret.id ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy</>
                )}
              </button>
              <button
                onClick={() => setViewingSecret(null)}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Close
              </button>
            </div>

            <div style={{
              marginTop: 16, padding: '8px 12px',
              background: 'rgba(255,68,68,0.05)',
              border: '1px solid rgba(255,68,68,0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: 11, color: 'var(--accent-red)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              This value will be hidden when you close this dialog
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'var(--accent-red-dim)', border: '1px solid rgba(255,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="1.5">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Delete Secret?</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>This action cannot be undone. The secret will be permanently removed.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Secret Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Add Secret
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Values are encrypted with AES-256 before storage
              </p>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  className="input"
                  placeholder="OPENAI_API_KEY"
                  required
                  autoFocus
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Auto-formatted as ENV variable</p>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="label">Secret Value</label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="input"
                  placeholder="Paste your secret value here..."
                  rows={4}
                  required
                  style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                />
              </div>
              <div style={{
                padding: '10px 12px', marginBottom: 16,
                background: 'var(--accent-green-dim)',
                border: '1px solid rgba(0,208,132,0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: 11, color: 'var(--accent-green)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6V12C4 15.31 7.58 19.5 12 22C16.42 19.5 20 15.31 20 12V6L12 2Z" stroke="var(--accent-green)" strokeWidth="1.5"/>
                  <path d="M9 12L11 14L15 10" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Will be encrypted with AES-256 before storing
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Store Secret
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretsManager;
