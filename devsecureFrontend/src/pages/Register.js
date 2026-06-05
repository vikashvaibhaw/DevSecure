import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['', 'var(--accent-red)', 'var(--accent-orange)', 'var(--accent-green)'];

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

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '500px',
        height: '300px',
        background: 'radial-gradient(ellipse, rgba(0,180,216,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeInUp 0.5s ease forwards' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px',
            background: 'rgba(0,180,216,0.1)',
            border: '1px solid rgba(0,180,216,0.3)',
            borderRadius: '12px', marginBottom: '16px',
            boxShadow: 'var(--glow-cyan)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="var(--accent-cyan)" strokeWidth="1.5"/>
              <line x1="19" y1="8" x2="19" y2="14" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="22" y1="11" x2="16" y2="11" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px', fontWeight: '800',
            color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px',
          }}>Create Account</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            DevSecure AI — Join the platform
          </p>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          {/* Terminal bar */}
          <div style={{
            background: 'var(--bg-tertiary)', padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: '8px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              register.devsecure.sh — new user
            </span>
          </div>

          <div style={{ padding: '28px 24px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-cyan)', marginBottom: 20 }}>
              <span style={{ color: 'var(--text-muted)' }}>$ </span>
              <span>create-account --secure</span>
              <span className="cursor" style={{ '--cursor-color': 'var(--accent-cyan)' }} />
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  placeholder="John Doe"
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@company.com"
                  required
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
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    }}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {/* Password strength */}
                {password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: i <= strength ? strengthColors[strength] : 'var(--border)',
                          transition: 'background 0.3s',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: strengthColors[strength] }}>
                      {strengthLabels[strength]}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn"
                style={{
                  width: '100%', justifyContent: 'center', padding: '12px',
                  background: 'var(--accent-cyan)', color: '#000',
                  border: '1px solid var(--accent-cyan)', fontWeight: 600,
                }}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 16, height: 16 }} />Creating account...</>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>Create Account</>
                )}
              </button>
            </form>

            <div style={{
              marginTop: '20px', paddingTop: '20px',
              borderTop: '1px solid var(--border)',
              textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
            }}>
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: 12,
                }}
                onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                onMouseLeave={e => e.target.style.textDecoration = 'none'}
              >
                Sign in →
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
          {[{ icon: '🏢', label: 'Multi-Tenant' }, { icon: '👥', label: 'RBAC' }, { icon: '📝', label: 'Audit Logs' }].map(b => (
            <div key={b.label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 99, padding: '4px 12px',
            }}>
              <span>{b.icon}</span>
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Register;
