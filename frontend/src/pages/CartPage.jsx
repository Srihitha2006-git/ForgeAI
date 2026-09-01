import React, { useState, useEffect } from 'react';
import { cartService } from '../services/cartService';

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #4f46e5, #06b6d4)', // Indigo to Cyan
  'linear-gradient(135deg, #ec4899, #8b5cf6)', // Pink to Purple
  'linear-gradient(135deg, #10b981, #3b82f6)', // Emerald to Blue
  'linear-gradient(135deg, #f59e0b, #ec4899)', // Amber to Pink
  'linear-gradient(135deg, #6366f1, #a855f7)'  // Indigo to Purple
];

export default function CartPage({ onBack, onProductClick, onCartCountChange, onManageAddresses, onCheckout }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cartService.getCart();
      setCart(data);
      updateTotalCartCount(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Unable to load your cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateTotalCartCount = (cartData) => {
    if (onCartCountChange) {
      const totalCount = cartData?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      onCartCountChange(totalCount);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > item.product.stockQuantity) {
      alert(`Only ${item.product.stockQuantity} units are currently available.`);
      return;
    }

    setUpdatingItemId(item.id);

    // Save previous quantity for Optimistic UI rollback
    const prevCart = { ...cart };
    const prevItems = cart.items.map(it => ({ ...it }));
    
    // Optimistically update React State
    const updatedItems = cart.items.map(it => {
      if (it.id === item.id) {
        const itemSubtotal = item.product.price * newQuantity;
        return { ...it, quantity: newQuantity, subtotal: itemSubtotal };
      }
      return it;
    });

    const newSubtotal = updatedItems.reduce((sum, it) => sum + it.subtotal, 0);

    setCart({
      ...cart,
      items: updatedItems,
      subtotal: newSubtotal,
      total: newSubtotal
    });
    if (onCartCountChange) {
      const newCount = updatedItems.reduce((sum, it) => sum + it.quantity, 0);
      onCartCountChange(newCount);
    }

    try {
      const data = await cartService.updateCartItem(item.id, newQuantity);
      setCart(data);
      updateTotalCartCount(data);
    } catch (err) {
      console.error('Error updating quantity:', err);
      const errMsg = err.response?.data?.error || 'Failed to update item quantity.';
      alert(errMsg);
      
      // Rollback to previous state
      setCart({
        ...prevCart,
        items: prevItems
      });
      if (onCartCountChange) {
        const prevCount = prevItems.reduce((sum, it) => sum + it.quantity, 0);
        onCartCountChange(prevCount);
      }
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    const confirmRemove = window.confirm('Are you sure you want to remove this item?');
    if (!confirmRemove) return;

    setLoading(true);
    try {
      const data = await cartService.removeFromCart(itemId);
      setCart(data);
      updateTotalCartCount(data);
    } catch (err) {
      console.error('Error removing item:', err);
      alert('Failed to remove item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = async () => {
    const confirmClear = window.confirm('Are you sure you want to empty your cart?');
    if (!confirmClear) return;

    setLoading(true);
    try {
      const data = await cartService.clearCart();
      setCart(data);
      updateTotalCartCount(data);
    } catch (err) {
      console.error('Error clearing cart:', err);
      alert('Failed to clear cart. Please try again.');
    } finally {
      setLoading(false);
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
        return 'Kitchen & Utensils';
      case 'FURNITURE':
        return 'Furniture';
      case 'OFFICE_ENTERPRISE':
        return 'Office & Enterprise';
      default:
        return cat;
    }
  };

  // 1. LOADING SKELETON STATE
  if (loading && !cart) {
    return (
      <div className="container" style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
        <h1 style={{ color: 'white', marginBottom: '2rem', fontSize: '2rem' }}>Shopping Cart</h1>
        <div className="cart-layout">
          <div className="cart-items-container">
            {[1, 2].map((i) => (
              <div key={i} className="cart-item-card" style={{ gridTemplateColumns: '100px 2.5fr 1.5fr 1fr' }}>
                <div className="skeleton-image" style={{ width: '100px', height: '100px', borderRadius: '12px' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="skeleton-line" style={{ height: '1rem', width: '60%' }}></div>
                  <div className="skeleton-line" style={{ height: '0.75rem', width: '30%' }}></div>
                </div>
                <div className="skeleton-line" style={{ height: '2rem', width: '100px', borderRadius: '8px' }}></div>
                <div className="skeleton-line" style={{ height: '1.25rem', width: '80px', marginLeft: 'auto' }}></div>
              </div>
            ))}
          </div>
          <div className="cart-summary-card" style={{ height: '250px' }}>
            <div className="skeleton-line" style={{ height: '1.5rem', width: '50%', marginBottom: '1.5rem' }}></div>
            <div className="skeleton-line" style={{ height: '1rem', width: '80%', marginBottom: '1rem' }}></div>
            <div className="skeleton-line" style={{ height: '1.5rem', width: '100%', marginTop: '2rem', borderRadius: '8px' }}></div>
          </div>
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
          <h2>Unable to load your cart</h2>
          <p>{error}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="details-back-link" onClick={onBack} style={{ marginBottom: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Go to Marketplace
            </button>
            <button className="search-btn" onClick={fetchCart} style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  // 3. EMPTY STATE
  if (isEmpty) {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem', opacity: 0.8 }}>
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <h3>Your cart is empty</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>Add some products to get started.</p>
          <button className="btn" onClick={onBack} style={{ padding: '0.8rem 2rem' }}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // 4. MAIN CART PAGE VIEW
  return (
    <div className="container" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '2rem', fontWeight: 800 }}>Shopping Cart</h1>
        <button 
          onClick={handleClearCart} 
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            transition: 'background-color 0.2s'
          }}
          className="clear-cart-hover-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Clear Cart
        </button>
      </div>

      <div className="cart-layout">
        {/* Left Column: Cart Items list */}
        <div className="cart-items-container">
          {items.map((item) => {
            const fallbackGradient = FALLBACK_GRADIENTS[(item.product.id || item.product.name.length) % FALLBACK_GRADIENTS.length];
            const isUpdating = updatingItemId === item.id;

            return (
              <div key={item.id} className="cart-item-card">
                {/* Product Image */}
                <div className="cart-item-image">
                  {item.product.imageUrl ? (
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      className="cart-item-img-element"
                      onError={(e) => { e.target.src = ''; e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div 
                      className="card-gradient-placeholder" 
                      style={{ background: fallbackGradient, height: '100%', borderRadius: '12px' }}
                    >
                      {item.product.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="cart-item-details">
                  <span className="cart-item-category">{formatCategory(item.product.category)}</span>
                  <h3 className="cart-item-name" onClick={() => onProductClick(item.product.id)}>
                    {item.product.name}
                  </h3>
                  <span className="cart-item-price">{formatPrice(item.product.price)}</span>
                </div>

                {/* Quantity Controls */}
                <div className="cart-item-controls">
                  <div className="quantity-btn-group">
                    <button 
                      className="quantity-adjust-btn"
                      onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                      disabled={item.quantity <= 1 || isUpdating}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="quantity-display-value">
                      {isUpdating ? '...' : item.quantity}
                    </span>
                    <button 
                      className="quantity-adjust-btn"
                      onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stockQuantity || isUpdating}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button 
                    className="cart-item-remove-btn"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label="Remove item"
                    disabled={isUpdating}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>

                {/* Subtotal */}
                <div className="cart-item-subtotal">
                  {formatPrice(item.subtotal)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Cart Summary */}
        <div className="cart-summary-card">
          <h2 className="cart-summary-title">Cart Summary</h2>
          
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(cart?.subtotal)}</span>
          </div>
          
          <div className="cart-summary-row" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>

          <div className="cart-summary-total-row">
            <span>Total</span>
            <span className="cart-summary-total-value">{formatPrice(cart?.total)}</span>
          </div>

          <div className="cart-summary-btn-group">
            <button 
              className="btn" 
              style={{ width: '100%', padding: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              onClick={onCheckout}
            >
              Proceed to Checkout
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            
            {onManageAddresses && (
              <button 
                className="details-back-link" 
                style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '0.85rem', marginBottom: 0, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={onManageAddresses}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" style={{ display: 'none' }} />
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Manage Addresses
              </button>
            )}

            <button 
              className="details-back-link" 
              style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '0.85rem', marginBottom: 0, marginTop: '0.5rem' }}
              onClick={onBack}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
