import React from 'react';

export default function EmptyState() {
  return (
    <div className="container" style={{ width: '100%' }}>
      <div className="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <h3>No products available</h3>
        <p style={{ marginTop: '0.5rem' }}>Products will appear here once they are added.</p>
      </div>
    </div>
  );
}
