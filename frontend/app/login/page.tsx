'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #020208; font-family: 'Inter', sans-serif; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 10px #00e5ff60; }
          50% { text-shadow: 0 0 25px #00e5ffaa, 0 0 40px #00e5ff40; }
        }
        .login-card {
          animation: fadeInUp 0.5s ease forwards;
          background: #07070f;
          border: 1px solid #15152a;
          border-radius: 16px;
          padding: 40px;
          width: 100%;
          max-width: 420px;
        }
        .input-field {
          width: 100%;
          background: #04040c;
          border: 1px solid #15152a;
          border-radius: 8px;
          padding: 12px 16px;
          color: #e8eaf0;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: #00e5ff40;
          box-shadow: 0 0 15px #00e5ff15;
        }
        .input-field::placeholder { color: #3a3a5a; }
        .submit-btn {
          width: 100%;
          background: transparent;
          border: 1px solid #00e5ff;
          color: #00e5ff;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          padding: 13px;
          border-radius: 8px;
          cursor: pointer;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: all 0.25s;
          text-shadow: 0 0 10px #00e5ff80;
        }
        .submit-btn:hover {
          background: #00e5ff18;
          box-shadow: 0 0 25px #00e5ff40;
          letter-spacing: 2px;
        }
        .submit-btn:disabled {
          border-color: #1a3a4a;
          color: #2a5a6a;
          cursor: not-allowed;
          box-shadow: none;
          text-shadow: none;
          letter-spacing: 1px;
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#020208', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: '24px', color: '#00e5ff', animation: 'glowPulse 3s ease-in-out infinite' }}>
            ☁ CloudAlarm
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#2a5a6a', marginTop: '6px', letterSpacing: '2px' }}>
            INFRASTRUCTURE DRIFT DETECTION
          </div>
        </div>

        <div className="login-card">
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ fontSize: '13px', color: '#4a4a7a', marginBottom: '28px' }}>Sign in to your CloudAlarm account</p>

          {error && (
            <div style={{ background: '#1f0d0d', border: '1px solid #ff446630', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#ff6688', fontSize: '13px', fontFamily: 'JetBrains Mono' }}>
              ✗ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#4a4a7a', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>EMAIL</label>
              <input
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#4a4a7a', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a4a7a', fontSize: '16px', padding: '4px' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '⟳ SIGNING IN...' : '⚡ SIGN IN'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#3a3a5a' }}>
            Don't have an account?{' '}
            <a href="/signup" style={{ color: '#00e5ff', textDecoration: 'none', fontWeight: 600 }}>Sign up</a>
          </p>
        </div>
      </div>
    </>
  );
}