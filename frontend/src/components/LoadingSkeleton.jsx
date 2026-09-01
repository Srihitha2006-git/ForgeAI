import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="container" style={{ width: '100%' }}>
      <div className="product-catalog-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="shimmer"></div>
            <div className="skeleton-image"></div>
            
            <div className="skeleton-content">
              {/* Category / Brand lines */}
              <div className="skeleton-line" style={{ height: '0.6rem', width: '30%', marginBottom: '0.25rem' }}></div>
              
              {/* Product Title */}
              <div className="skeleton-line skeleton-line-title"></div>
              
              {/* Description */}
              <div className="skeleton-line skeleton-line-text" style={{ marginTop: '0.5rem' }}></div>
              <div className="skeleton-line skeleton-line-text-short"></div>
              
              {/* Footer */}
              <div className="skeleton-footer">
                <div className="skeleton-line skeleton-line-price"></div>
                <div className="skeleton-circle"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
