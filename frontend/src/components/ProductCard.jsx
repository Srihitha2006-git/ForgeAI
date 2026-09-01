import React, { useState } from 'react';
import { cartService } from '../services/cartService';
import { wishlistService } from '../services/wishlistService';

// Fallback abstract gradients if image fails to load
const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #4f46e5, #06b6d4)', // Indigo to Cyan
  'linear-gradient(135deg, #ec4899, #8b5cf6)', // Pink to Purple
  'linear-gradient(135deg, #10b981, #3b82f6)', // Emerald to Blue
  'linear-gradient(135deg, #f59e0b, #ec4899)', // Amber to Pink
  'linear-gradient(135deg, #6366f1, #a855f7)'  // Indigo to Purple
];

export default function ProductCard({ product, onProductClick, token, onAuthTrigger, onCartCountChange, onShowToast, wishlistItems, onWishlistCountChange, onWishlistItemsChange }) {
  const { id, name, description, price, stockQuantity, category, brand, sku, imageUrl } = product;
  const [imageError, setImageError] = useState(false);
  const [adding, setAdding] = useState(false);

  const wishlistItem = wishlistItems?.find(it => it.product.id === id);
  const isWishlisted = !!wishlistItem;

  // Helper to format currency in INR style
  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value || 0);
  };

  // Helper to format category for human display
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

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    if (!token) {
      onAuthTrigger();
      return;
    }

    try {
      if (isWishlisted) {
        const data = await wishlistService.removeFromWishlist(wishlistItem.id);
        if (onWishlistItemsChange) onWishlistItemsChange(data.items || []);
        if (onWishlistCountChange) onWishlistCountChange(data.items?.length || 0);
        if (onShowToast) onShowToast('Removed from wishlist');
      } else {
        const data = await wishlistService.addToWishlist(id);
        if (onWishlistItemsChange) onWishlistItemsChange(data.items || []);
        if (onWishlistCountChange) onWishlistCountChange(data.items?.length || 0);
        if (onShowToast) onShowToast('Added to wishlist');
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      alert('Failed to update wishlist. Please try again.');
    }
  };

  const handleAddToCart = async () => {
    if (!token) {
      onAuthTrigger();
      return;
    }

    setAdding(true);
    try {
      const data = await cartService.addToCart(id, 1);
      if (onCartCountChange) {
        const totalCount = data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        onCartCountChange(totalCount);
      }
      if (onShowToast) {
        onShowToast('Added to cart');
      }
    } catch (err) {
      console.error('Error adding item to cart from card:', err);
      const errMsg = err.response?.data?.error || 'Failed to add item. Check stock and try again.';
      alert(errMsg);
    } finally {
      setAdding(false);
    }
  };

  const handleCardClick = (e) => {
    // If the user clicked the add-to-cart button or inside it, do not trigger card navigation
    if (e.target.closest('.card-cart-btn')) {
      return;
    }
    if (onProductClick) {
      onProductClick(id);
    }
  };

  // Determine fallback gradient to use in case of image load error
  const fallbackGradient = (() => {
    const index = (id || name.length) % FALLBACK_GRADIENTS.length;
    return FALLBACK_GRADIENTS[index];
  })();

  const isOutOfStock = stockQuantity <= 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;

  return (
    <div className="redesign-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      {/* Product Image Wrapper */}
      <div className="card-img-container">
        {/* Category Badge overlay on top-right */}
        <div className="card-badge-overlay">
          <span className="card-category-badge">
            {formatCategory(category)}
          </span>
        </div>

        {/* Wishlist Heart Icon overlay on top-left */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
          <button 
            className="card-heart-btn"
            onClick={handleWishlistToggle}
            style={{
              background: 'rgba(7, 9, 14, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: isWishlisted ? '#ef4444' : 'var(--text-secondary)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={isWishlisted ? '#ef4444' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
        
        {imageUrl && !imageError ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="card-img-element" 
            loading="lazy"
            onError={() => setImageError(true)}
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

      {/* Product Information Body */}
      <div className="card-body">
        {brand && <span className="card-brand">{brand}</span>}
        <h3 className="card-title" title={name}>{name}</h3>
        <p className="card-description">{description || 'No description provided for this product.'}</p>
        
        {sku && (
          <span className="status-desc" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace', display: 'block', marginBottom: '0.75rem' }}>
            SKU: {sku}
          </span>
        )}

        <div className="card-footer">
          <div className="card-price-info">
            <span className="card-price-value">{formatPrice(price)}</span>
            
            {/* Stock status indicator */}
            <span className={`card-stock-status ${isOutOfStock ? 'out' : isLowStock ? 'low' : ''}`}>
              {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${stockQuantity} left` : `In Stock (${stockQuantity})`}
            </span>
          </div>
          
          <button 
            className="card-cart-btn" 
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            aria-label={`Add ${name} to cart`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
