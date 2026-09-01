import React from 'react';

export default function ErrorState({ onRetry }) {
  return (
    <div className="container" style={{ width: '100%' }}>
      <div className="error-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h2>Unable to load products</h2>
        <p>Please check your connection and try again.</p>
        <button 
          className="search-btn" 
          onClick={onRetry}
          style={{ padding: '0.75rem 2rem', fontSize: '0.9rem' }}
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}
