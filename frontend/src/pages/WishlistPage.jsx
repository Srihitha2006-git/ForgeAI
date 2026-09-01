import React, { useState, useEffect } from 'react';
import { wishlistService } from '../services/wishlistService';
import { cartService } from '../services/cartService';

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #4f46e5, #06b6d4)', // Indigo to Cyan
  'linear-gradient(135deg, #ec4899, #8b5cf6)', // Pink to Purple
  'linear-gradient(135deg, #10b981, #3b82f6)', // Emerald to Blue
  'linear-gradient(135deg, #f59e0b, #ec4899)', // Amber to Pink
  'linear-gradient(135deg, #6366f1, #a855f7)'  // Indigo to Purple
];

export default function WishlistPage({ onBack, onProductClick, onCartCountChange, onShowToast, onWishlistCountChange }) {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingItemId, setAddingItemId] = useState(null);

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wishlistService.getWishlist();
      setWishlist(data);
      updateTotalWishlistCount(data);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError('Unable to load your wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateTotalWishlistCount = (wishlistData) => {
    if (onWishlistCountChange) {
      onWishlistCountChange(wishlistData?.items?.length || 0);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveItem = async (itemId) => {
    try {
      const data = await wishlistService.removeFromWishlist(itemId);
      setWishlist(data);
      updateTotalWishlistCount(data);
      if (onShowToast) {
        onShowToast('Removed from wishlist');
      }
    } catch (err) {
      console.error('Error removing wishlist item:', err);
      alert('Failed to remove item. Please try again.');
    }
  };

  const handleAddToCart = async (product) => {
    if (product.stockQuantity <= 0) return;

    setAddingItemId(product.id);
    try {
      const data = await cartService.addToCart(product.id, 1);
      if (onCartCountChange) {
        const totalCount = data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        onCartCountChange(totalCount);
      }
      if (onShowToast) {
        onShowToast('Added to cart');
      }
    } catch (err) {
      console.error('Error adding to cart from wishlist:', err);
      const errMsg = err.response?.data?.error || 'Failed to add item to cart.';
      alert(errMsg);
    } finally {
      setAddingItemId(null);
    }
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value || 0);
  };

  const formatCategory = (cat) => {
    if (!cat) return 'Uncategorized';
    switch (cat.toUpperCase()) {
      case 'KITCHEN_UTENSILS':
        return 'Kitchen';
      case 'FURNITURE':
        return 'Furniture';
      case 'OFFICE_ENTERPRISE':
        return 'Enterprise';
      default:
        return cat;
    }
  };

  // 1. LOADING SKELETON STATE
  if (loading && !wishlist) {
    return (
      <div className="container" style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
        <h1 style={{ color: 'white', marginBottom: '2rem', fontSize: '2rem' }}>My Wishlist</h1>
        <div className="product-catalog-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-line skeleton-line-title"></div>
                <div className="skeleton-line skeleton-line-text"></div>
                <div className="skeleton-footer">
                  <div className="skeleton-line-price"></div>
                  <div className="skeleton-circle"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (error) {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="error-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Unable to load your wishlist</h2>
          <p>{error}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="details-back-link" onClick={onBack} style={{ marginBottom: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Go to Marketplace
            </button>
            <button className="search-btn" onClick={fetchWishlist} style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = wishlist?.items || [];
  const isEmpty = items.length === 0;

  // 3. EMPTY STATE
  if (isEmpty) {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem', opacity: 0.8 }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <h3>Your wishlist is empty</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>Save products you love and find them here later.</p>
          <button className="btn" onClick={onBack} style={{ padding: '0.8rem 2rem' }}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // 4. MAIN WISHLIST GRID VIEW
  return (
    <div className="container" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '2rem', fontWeight: 800 }}>My Wishlist</h1>
        <button 
          onClick={onBack} 
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
          className="details-back-link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Marketplace
        </button>
      </div>

      <div className="product-catalog-grid">
        {items.map((item) => {
          const { id: productId, name, description, price, stockQuantity, category, brand, sku, imageUrl } = item.product;
          const fallbackGradient = FALLBACK_GRADIENTS[(productId || name.length) % FALLBACK_GRADIENTS.length];
          const isOutOfStock = stockQuantity <= 0;
          const isLowStock = stockQuantity > 0 && stockQuantity <= 10;
          const isAdding = addingItemId === productId;

          return (
            <div key={item.id} className="redesign-card">
              {/* Product Image */}
              <div className="card-img-container" onClick={() => onProductClick(productId)} style={{ cursor: 'pointer' }}>
                <div className="card-badge-overlay">
                  <span className="card-category-badge">
                    {formatCategory(category)}
                  </span>
                </div>
                
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={name} 
                    className="card-img-element" 
                    onError={(e) => { e.target.src = ''; e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div 
                    className="card-gradient-placeholder" 
                    style={{ background: fallbackGradient }}
                  >
                    {name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="card-body">
                {brand && <span className="card-brand">{brand}</span>}
                <h3 className="card-title" title={name} onClick={() => onProductClick(productId)} style={{ cursor: 'pointer' }}>
                  {name}
                </h3>
                <p className="card-description">{description || 'No description provided.'}</p>
                
                {sku && (
                  <span className="status-desc" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace', display: 'block', marginBottom: '0.75rem' }}>
                    SKU: {sku}
                  </span>
                )}

                {/* Footer Controls */}
                <div className="card-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
                  
                  {/* Price & Stock info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span className="card-price-value">{formatPrice(price)}</span>
                    <span className={`card-stock-status ${isOutOfStock ? 'out' : isLowStock ? 'low' : ''}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                      {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${stockQuantity} left` : 'In Stock'}
                    </span>
                  </div>

                  {/* Actions Grid */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn"
                      disabled={isOutOfStock || isAdding}
                      onClick={() => handleAddToCart(item.product)}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.5rem',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        borderRadius: '8px'
                      }}
                    >
                      {isAdding ? (
                        <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '1.5px' }}></span>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                          Add to Cart
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="clear-cart-hover-btn"
                      style={{
                        padding: '0.6rem 0.75rem',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '8px',
                        color: '#f87171',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="Remove from Wishlist"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
