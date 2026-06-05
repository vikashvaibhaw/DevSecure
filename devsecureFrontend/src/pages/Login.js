import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await login(email, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Access granted');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }} className="grid-bg noise scanline">

      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '300px',
        background: 'radial-gradient(ellipse, rgba(0,208,132,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        animation: 'fadeInUp 0.5s ease forwards',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            background: 'var(--accent-green-dim)',
            border: '1px solid rgba(0,208,132,0.3)',
            borderRadius: '12px',
            marginBottom: '16px',
            boxShadow: 'var(--glow-green)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6V12C4 15.31 7.58 19.5 12 22C16.42 19.5 20 15.31 20 12V6L12 2Z" fill="rgba(0,208,132,0.2)" stroke="var(--accent-green)" strokeWidth="1.5"/>
              <path d="M9 12L11 14L15 10" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}>DevSecure AI</h1>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>Enterprise Security Platform</p>
        </div>

        {/* Terminal prompt header */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          {/* Terminal bar */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              auth.devsecure.sh — authenticate
            </span>
          </div>

          <div style={{ padding: '28px 24px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--accent-green)',
              marginBottom: 20,
            }}>
              <span style={{ color: 'var(--text-muted)' }}>$ </span>
              <span>authenticate --user</span>
              <span className="cursor" />
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@company.com"
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="••••••••••••"
                    required
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: '2px',
                    }}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16 }} />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}>
              No account?{' '}
              <button
                onClick={() => navigate('/register')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--accent-green)', fontFamily: 'var(--font-mono)',
                  fontSize: 12, textDecoration: 'none',
                }}
                onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                onMouseLeave={e => e.target.style.textDecoration = 'none'}
              >
                Create account →
              </button>
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '24px',
          flexWrap: 'wrap',
        }}>
          {[
            { icon: '🔐', label: 'AES-256' },
            { icon: '🛡️', label: 'JWT Auth' },
            { icon: '🔒', label: 'bcrypt' },
          ].map(b => (
            <div key={b.label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 99, padding: '4px 12px',
            }}>
              <span>{b.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
