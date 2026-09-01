import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

export default function ProductDetails({ productId, apiUrl, onBack, token, onAuthTrigger, onCartCountChange, onShowToast, wishlistItems, onWishlistCountChange, onWishlistItemsChange }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${apiUrl}/api/products/${productId}`);
      if (response.data) {
        setProduct(response.data);
        setQuantity(response.data.stockQuantity > 0 ? 1 : 0);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      if (err.response && err.response.status === 404) {
        setError('Product not found');
      } else {
        setError('Unable to load product');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId, apiUrl]);

  // Helpers to adjust quantity
  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (product && quantity < product.stockQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!token) {
      onAuthTrigger();
      return;
    }

    setAdding(true);
    try {
      const data = await cartService.addToCart(productId, quantity);
      if (onCartCountChange) {
        const totalCount = data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        onCartCountChange(totalCount);
      }
      if (onShowToast) {
        onShowToast('Added to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      const errMsg = err.response?.data?.error || 'Failed to add item to cart. Please check stock and try again.';
      alert(errMsg);
    } finally {
      setAdding(false);
    }
  };

  const wishlistItem = wishlistItems?.find(it => it.product.id === product?.id);
  const isWishlisted = !!wishlistItem;

  const handleWishlistToggle = async () => {
    if (!product) return;
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
        const data = await wishlistService.addToWishlist(productId);
        if (onWishlistItemsChange) onWishlistItemsChange(data.items || []);
        if (onWishlistCountChange) onWishlistCountChange(data.items?.length || 0);
        if (onShowToast) onShowToast('Added to wishlist');
      }
    } catch (err) {
      console.error('Error toggling wishlist details:', err);
      alert('Failed to update wishlist. Please try again.');
    }
  };

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
        return 'Kitchen & Utensils';
      case 'FURNITURE':
        return 'Furniture';
      case 'OFFICE_ENTERPRISE':
        return 'Office & Enterprise';
      default:
        return cat;
    }
  };

  // 1. LOADING SKELETON
  if (loading) {
    return (
      <div className="container" style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
        {/* Breadcrumb skeleton */}
        <div className="breadcrumbs">
          <div className="skeleton-line" style={{ height: '0.8rem', width: '150px' }}></div>
        </div>
        
        {/* Back link skeleton */}
        <div className="skeleton-line" style={{ height: '0.9rem', width: '120px', marginBottom: '1.5rem' }}></div>
        
        {/* Two column grid skeleton */}
        <div className="details-layout">
          <div className="skeleton-image" style={{ height: '450px', borderRadius: '20px' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton-line" style={{ height: '0.8rem', width: '25%' }}></div>
            <div className="skeleton-line" style={{ height: '2.5rem', width: '70%', marginTop: '0.5rem' }}></div>
            <div className="skeleton-line" style={{ height: '1.25rem', width: '40%', marginTop: '0.5rem' }}></div>
            <div className="skeleton-line" style={{ height: '1px', width: '100%', margin: '1rem 0' }}></div>
            <div className="skeleton-line" style={{ height: '1rem', width: '30%' }}></div>
            <div className="skeleton-line" style={{ height: '5rem', width: '100%', marginTop: '0.5rem' }}></div>
            <div className="skeleton-line" style={{ height: '1.5rem', width: '20%', marginTop: '1rem' }}></div>
            <div className="skeleton-line" style={{ height: '3rem', width: '45%', marginTop: '1.5rem', borderRadius: '12px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR STATE - PRODUCT NOT FOUND
  if (error === 'Product not found') {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="empty-state" style={{ margin: '4rem auto', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Product not found</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>The product you are trying to view does not exist in our database.</p>
          <button className="details-back-link" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  // 3. ERROR STATE - NETWORK ERROR
  if (error) {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="error-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Unable to load product</h2>
          <p>Please check your connection and try again.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="details-back-link" onClick={onBack} style={{ marginBottom: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Products
            </button>
            <button className="search-btn" onClick={fetchProductDetails} style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. MAIN DETAILS PAGE VIEW
  const { name, description, price, stockQuantity, category, brand, sku, imageUrl } = product;

  // Determine fallback image gradient if image is not loaded
  const fallbackGradient = (() => {
    const index = (productId || name.length) % FALLBACK_GRADIENTS.length;
    return FALLBACK_GRADIENTS[index];
  })();

  const isOutOfStock = stockQuantity <= 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 10;

  return (
    <div className="container" style={{ width: '100%' }}>
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <span className="breadcrumb-link" onClick={onBack}>Home</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-link" onClick={onBack}>Products</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active" title={name}>{name}</span>
      </nav>

      {/* Back to products trigger link */}
      <button className="details-back-link" onClick={onBack} aria-label="Go back to products catalog">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Products
      </button>

      {/* Details Layout Box */}
      <div className="details-layout">
        {/* Left Column: Image wrapper */}
        <div className="details-image-container">
          {imageUrl && !imageError ? (
            <img 
              src={imageUrl} 
              alt={name} 
              className="details-img" 
              onError={() => setImageError(true)}
            />
          ) : (
            <div 
              className="card-gradient-placeholder" 
              style={{ background: fallbackGradient, height: '100%', borderRadius: '20px' }}
            >
              {name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Right Column: Information layout */}
        <div className="details-info">
          <span className="details-category">
            {formatCategory(category)}
          </span>
          
          <h1 className="details-title">{name}</h1>
          
          <div className="details-meta-row">
            {brand && (
              <div className="details-meta-item">
                <span className="details-meta-label">Brand:</span>
                <span className="details-meta-value">{brand}</span>
              </div>
            )}
            {sku && (
              <div className="details-meta-item">
                <span className="details-meta-label">SKU:</span>
                <span className="details-meta-value" style={{ fontFamily: 'monospace' }}>{sku}</span>
              </div>
            )}
          </div>

          <div className="details-price-row">
            <span className="details-price-value">{formatPrice(price)}</span>
            
            {/* Stock indicator pill */}
            <span className={`details-stock-status ${isOutOfStock ? 'out' : isLowStock ? 'low' : ''}`}>
              {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${stockQuantity} left` : '✓ In Stock'}
            </span>
          </div>

          <div className="details-divider"></div>

          <div style={{ marginBottom: '2rem' }}>
            <h4 className="details-description-title">Product Overview</h4>
            <p className="details-description-text">
              {description || 'No description provided for this product.'}
            </p>
          </div>

          <div className="details-divider"></div>

          {/* Quantity selector (disabled if out of stock) */}
          <div className="quantity-controller">
            <span className="quantity-label">Quantity</span>
            <div className="quantity-btn-group">
              <button 
                className="quantity-adjust-btn" 
                onClick={handleDecrement}
                disabled={quantity <= 1 || isOutOfStock}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="quantity-display-value">{quantity}</span>
              <button 
                className="quantity-adjust-btn" 
                onClick={handleIncrement}
                disabled={quantity >= stockQuantity || isOutOfStock}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div className="details-actions-group">
            <button 
              className="details-add-cart-btn"
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
              aria-label={`Add ${quantity} of ${name} to cart`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Add to Cart
            </button>

            <button 
              className="clear-cart-hover-btn"
              onClick={handleWishlistToggle}
              style={{
                padding: '0.9rem 1.5rem',
                background: isWishlisted ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: isWishlisted ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--card-border)',
                color: isWishlisted ? '#ef4444' : '#ffffff',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? '#ef4444' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
