import React, { useState } from 'react';
import axios from 'axios';

export default function AuthModal({ isOpen, onClose, onSuccess, apiUrl }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post(`${apiUrl}/api/auth/login`, {
          email: email.trim(),
          password
        });
        if (response.data && response.data.token) {
          const userData = {
            id: response.data.id,
            name: response.data.name,
            email: response.data.email
          };
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(userData));
          onSuccess(userData, response.data.token);
          onClose();
        } else {
          setError('Unexpected response from server.');
        }
      } else {
        const response = await axios.post(`${apiUrl}/api/auth/register`, {
          name: name.trim(),
          email: email.trim(),
          password
        });
        if (response.data && response.data.token) {
          const userData = {
            id: response.data.id,
            name: response.data.name,
            email: response.data.email
          };
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(userData));
          onSuccess(userData, response.data.token);
          onClose();
        } else {
          setError('Unexpected response from server.');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'An error occurred. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', position: 'relative' }}>
        <button className="auth-close-btn" onClick={onClose} aria-label="Close authentication modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h2 style={{ color: 'white', marginBottom: '0.5rem', fontWeight: 700, fontSize: '1.75rem', textAlign: 'center' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="subtitle" style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
          {isLogin ? 'Access your ForgeAI workspace and cart' : 'Join the premier AI-integrated marketplace'}
        </p>

        {error && (
          <div className="error-alert" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="auth-name" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Full Name</label>
              <input
                id="auth-name"
                type="text"
                className="search-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem 1rem' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="auth-email" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Email Address</label>
            <input
              id="auth-email"
              type="email"
              className="search-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem 1rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="auth-password" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Password</label>
            <input
              id="auth-password"
              type="password"
              className="search-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem 1rem' }}
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {loading ? (
              <span className="spinner" style={{ borderLeftColor: 'transparent', width: '20px', height: '20px' }}></span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#8b5cf6',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              marginLeft: '4px'
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
