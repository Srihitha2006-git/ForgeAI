import React, { useState, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { addressService } from '../services/addressService';
import { checkoutService } from '../services/checkoutService';
import { paymentService } from '../services/paymentService';

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #4f46e5, #06b6d4)', // Indigo to Cyan
  'linear-gradient(135deg, #ec4899, #8b5cf6)', // Pink to Purple
  'linear-gradient(135deg, #10b981, #3b82f6)', // Emerald to Blue
  'linear-gradient(135deg, #f59e0b, #ec4899)', // Amber to Pink
  'linear-gradient(135deg, #6366f1, #a855f7)'  // Indigo to Purple
];

export default function CheckoutPage({ onBack, onShowToast, navigateTo }) {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [stockError, setStockError] = useState(null);
  const [inactiveError, setInactiveError] = useState(null);
  const [priceChangeAlert, setPriceChangeAlert] = useState(false);
  
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const [successData, setSuccessData] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!selectedAddress) {
      onShowToast("Please select a delivery address.");
      return;
    }

    setPaying(true);
    setPaymentError(null);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Unable to load Razorpay payment SDK.");
      }

      const orderData = await paymentService.createOrder(selectedAddress.id);
      const user = JSON.parse(localStorage.getItem('user')) || {};

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ForgeAI",
        description: "ForgeAI Order Payment",
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: user.name || "",
          email: user.email || "",
          contact: selectedAddress.phone || ""
        },
        theme: {
          color: "#8b5cf6"
        },
        handler: async function (response) {
          setValidating(true);
          try {
            const verifyResult = await paymentService.verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            setSuccessData({
              orderReference: verifyResult.orderReference || response.razorpay_order_id,
              amount: orderData.amount / 100,
              paymentId: response.razorpay_payment_id
            });
            onShowToast("Payment verified successfully!");
          } catch (err) {
            console.error("Verification failed:", err);
            setPaymentError(err.response?.data?.error || "Payment verification failed.");
          } finally {
            setValidating(false);
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            onShowToast("Payment was not completed.");
            setPaying(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment setup failed:", err);
      setPaymentError(err.response?.data?.error || err.message || "Payment was not completed.");
      setPaying(false);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    setStockError(null);
    setInactiveError(null);
    setPriceChangeAlert(false);
    
    try {
      // 1. Fetch Cart
      const cartData = await cartService.getCart();
      setCart(cartData);
      
      if (!cartData.items || cartData.items.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Fetch Addresses
      const addressList = await addressService.getAddresses();
      setAddresses(addressList);

      if (addressList.length > 0) {
        // Prefer default address initially
        const defaultAddr = addressList.find(a => a.isDefault) || addressList[0];
        setSelectedAddress(defaultAddr);
        
        // 3. Run validation for the selected address
        await runCheckoutValidation(defaultAddr.id, cartData);
      }
    } catch (err) {
      console.error('Error fetching initial checkout data:', err);
      setError('Unable to prepare checkout.');
    } finally {
      setLoading(false);
    }
  };

  const runCheckoutValidation = async (addressId, currentCart) => {
    setValidating(true);
    setStockError(null);
    setInactiveError(null);
    setPriceChangeAlert(false);
    
    try {
      const result = await checkoutService.validateCheckout(addressId);
      setCheckoutData(result);

      // Check if price changed between cart items and validated items
      if (currentCart && currentCart.items) {
        let priceChanged = false;
        currentCart.items.forEach(cartItem => {
          const validatedItem = result.items.find(ci => ci.productId === cartItem.product.id);
          if (validatedItem && Number(cartItem.product.price) !== Number(validatedItem.unitPrice)) {
            priceChanged = true;
          }
        });
        if (priceChanged) {
          setPriceChangeAlert(true);
        }
      }
    } catch (err) {
      console.error('Error validating checkout:', err);
      const errMsg = err.response?.data?.error || '';
      
      if (errMsg.toLowerCase().includes('stock')) {
        setStockError(errMsg);
      } else if (errMsg.toLowerCase().includes('unavailable') || errMsg.toLowerCase().includes('inactive')) {
        setInactiveError(errMsg);
      } else {
        setError(errMsg || 'Unable to prepare checkout.');
      }
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleAddressSelect = async (address) => {
    setSelectedAddress(address);
    setShowAddressPicker(false);
    await runCheckoutValidation(address.id, cart);
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value || 0);
  };

  // 1. LOADING STATE
  if (loading) {
    return (
      <div className="container" style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
        <h1 style={{ color: 'white', marginBottom: '2rem', fontSize: '2rem', fontWeight: 800 }}>Checkout</h1>
        <div className="cart-layout">
          <div className="cart-items-container">
            {/* Address Skeleton */}
            <div className="glass-panel" style={{ height: '140px', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="skeleton-line" style={{ height: '1.25rem', width: '30%' }}></div>
              <div className="skeleton-line" style={{ height: '1rem', width: '50%' }}></div>
              <div className="skeleton-line" style={{ height: '1rem', width: '70%' }}></div>
            </div>
            {/* Items Skeleton */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="skeleton-line" style={{ height: '1.25rem', width: '40%' }}></div>
              {[1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <div className="skeleton-image" style={{ width: '60px', height: '60px', borderRadius: '8px' }}></div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div className="skeleton-line" style={{ height: '1rem', width: '60%' }}></div>
                    <div className="skeleton-line" style={{ height: '0.75rem', width: '20%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="cart-summary-card" style={{ height: '220px' }}>
            <div className="skeleton-line" style={{ height: '1.5rem', width: '50%', marginBottom: '1.5rem' }}></div>
            <div className="skeleton-line" style={{ height: '1rem', width: '80%', marginBottom: '1rem' }}></div>
            <div className="skeleton-line" style={{ height: '1.5rem', width: '100%', marginTop: '1.5rem', borderRadius: '8px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // 2. EMPTY CART STATE
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="empty-state" style={{ padding: '5rem 2rem' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem', opacity: 0.8 }}>
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <h3>Your cart is empty</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>Add some products to proceed with checkout.</p>
          <button className="btn" onClick={() => navigateTo('/')} style={{ padding: '0.8rem 2rem' }}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // 3. NO ADDRESS STATE
  if (addresses.length === 0) {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="empty-state" style={{ padding: '5rem 2rem' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h3>No delivery address found.</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>Please add a delivery address to complete your checkout.</p>
          <button className="btn" onClick={() => navigateTo('/addresses')} style={{ padding: '0.8rem 2rem' }}>
            + Add New Address
          </button>
        </div>
      </div>
    );
  }

  // 4. API ERROR STATE
  if (error && !validating) {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="error-state" style={{ padding: '4rem 2rem' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Unable to prepare checkout.</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button className="details-back-link" onClick={onBack} style={{ marginBottom: 0 }}>
              Return to Cart
            </button>
            <button className="search-btn" onClick={fetchInitialData} style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. STOCK ERROR STATE
  if (stockError && !validating) {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="error-state" style={{ padding: '4rem 2rem', borderColor: 'rgba(251, 191, 36, 0.3)', background: 'rgba(251, 191, 36, 0.02)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
            <polygon points="12 2 22 22 2 22" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h2 style={{ color: '#ffffff' }}>Stock changed</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '450px', margin: '0.5rem auto 1.5rem auto' }}>
            {stockError}
          </p>
          <button className="btn" onClick={onBack} style={{ padding: '0.75rem 2rem' }}>
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  // 6. INACTIVE PRODUCT ERROR STATE
  if (inactiveError && !validating) {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="error-state" style={{ padding: '4rem 2rem' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <h2>Unavailable item</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '450px', margin: '0.5rem auto 1.5rem auto' }}>
            {inactiveError}
          </p>
          <button className="btn" onClick={onBack} style={{ padding: '0.75rem 2rem' }}>
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="container" style={{ width: '100%', maxWidth: '600px', margin: '4rem auto', animation: 'fadeIn 0.4s ease' }}>
        <div className="glass-panel" style={{ padding: '3rem 2rem', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.25)', background: 'rgba(10, 15, 30, 0.8)', textAlign: 'center', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto', border: '2px solid rgba(16, 185, 129, 0.3)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Payment Successful</h2>
          <p style={{ color: '#10b981', fontSize: '0.95rem', fontWeight: 500, marginBottom: '2rem' }}>Your payment has been verified successfully.</p>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Order Reference:</span>
              <span style={{ color: 'white', fontWeight: 700, fontFamily: 'monospace' }}>{successData.orderReference}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment ID:</span>
              <span style={{ color: 'white', fontWeight: 700, fontFamily: 'monospace' }}>{successData.paymentId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Amount Paid:</span>
              <span style={{ color: '#a5b4fc', fontWeight: 800 }}>{formatPrice(successData.amount)}</span>
            </div>
          </div>

          <button className="btn" onClick={() => navigateTo('/')} style={{ width: '100%', padding: '0.95rem', fontWeight: 600 }}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const items = checkoutData?.items || [];
  const subtotal = checkoutData?.subtotal || 0;
  const shipping = checkoutData?.shipping || 0;
  const total = checkoutData?.total || 0;

  return (
    <div className="container" style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button className="details-back-link" onClick={onBack} style={{ margin: '0 0 0.25rem 0' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Return to Cart
          </button>
          <h1 style={{ color: 'white', margin: 0, fontSize: '2rem', fontWeight: 800 }}>Checkout</h1>
        </div>
      </div>

      {paymentError && (
        <div className="error-alert" style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', gap: '0.75rem', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
            <polygon points="12 2 2 22 22 22" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div style={{ fontSize: '0.9rem' }}>
            <strong style={{ display: 'block', fontWeight: 700, marginBottom: '0.1rem' }}>Payment was not completed</strong>
            {paymentError}
          </div>
        </div>
      )}

      {priceChangeAlert && (
        <div className="error-alert" style={{ marginBottom: '1.5rem', background: 'rgba(251, 191, 36, 0.08)', borderColor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', display: 'flex', gap: '0.75rem', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
            <polygon points="12 2 22 22 2 22" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div style={{ fontSize: '0.9rem' }}>
            <strong style={{ display: 'block', fontWeight: 700, marginBottom: '0.1rem' }}>Price updated</strong>
            The price of one or more products in your cart has changed. Please review the updated order summary.
          </div>
        </div>
      )}

      {/* TWO COLUMN GRID */}
      <div className="cart-layout">
        {/* LEFT COLUMN */}
        <div className="cart-items-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* SECTION 1: DELIVERY ADDRESS CARD */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Delivery Address
              </h2>
              <button 
                onClick={() => setShowAddressPicker(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8b5cf6',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: 0
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                Change Address
              </button>
            </div>

            {selectedAddress && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>{selectedAddress.fullName}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--card-border)', fontWeight: 600 }}>
                    {selectedAddress.addressType}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{selectedAddress.phone}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  <div>{selectedAddress.addressLine1}</div>
                  {selectedAddress.addressLine2 && <div>{selectedAddress.addressLine2}</div>}
                  <div>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}</div>
                  <div>{selectedAddress.country}</div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: ORDER ITEMS */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              Order Items ({items.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {items.map((item) => {
                const fallbackGradient = FALLBACK_GRADIENTS[(item.productId || item.name.length) % FALLBACK_GRADIENTS.length];
                
                return (
                  <div key={item.productId} style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '1.25rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--card-border)' }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = ''; e.target.style.display = 'none'; }} />
                      ) : (
                        <div style={{ background: fallbackGradient, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                          {item.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>{item.name}</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatPrice(item.unitPrice)} × {item.quantity}
                      </div>
                    </div>

                    <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginLeft: '1rem' }}>
                      {formatPrice(item.subtotal)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PRICE SUMMARY */}
        <div className="cart-summary-card" style={{ border: '1px solid var(--card-border)' }}>
          <h2 className="cart-summary-title">Price Summary</h2>
          
          <div className="cart-summary-row" style={{ color: 'var(--text-secondary)' }}>
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          <div className="cart-summary-row" style={{ color: 'var(--text-secondary)' }}>
            <span>Shipping</span>
            {shipping === 0 ? (
              <span style={{ color: '#10b981', fontWeight: 600 }}>Free Shipping</span>
            ) : (
              <span>{formatPrice(shipping)}</span>
            )}
          </div>

          <div className="cart-summary-total-row" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.25rem' }}>
            <span>Total</span>
            <span className="cart-summary-total-value" style={{ color: '#a5b4fc', fontSize: '1.5rem', fontWeight: 800 }}>
              {formatPrice(total)}
            </span>
          </div>

          <div className="cart-summary-btn-group" style={{ marginTop: '1rem' }}>
            <button 
              className="btn" 
              style={{ width: '100%', padding: '0.95rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              onClick={handlePayment}
              disabled={validating || paying}
            >
              {validating || paying ? (
                <span className="spinner" style={{ borderLeftColor: 'transparent', width: '18px', height: '18px' }}></span>
              ) : (
                'Continue to Payment'
              )}
              {!validating && !paying && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          ADDRESS SELECTION DRAWER/MODAL
         ================================================== */}
      {showAddressPicker && (
        <div className="auth-overlay" onClick={() => setShowAddressPicker(false)}>
          <div 
            className="auth-modal glass-panel" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              width: '100%', 
              maxWidth: '520px', 
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '2rem', 
              position: 'relative',
              borderRadius: '20px',
              animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <button className="auth-close-btn" onClick={() => setShowAddressPicker(false)} aria-label="Close address picker">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h2 style={{ color: 'white', marginBottom: '0.25rem', fontWeight: 800, fontSize: '1.5rem' }}>
              Select Address
            </h2>
            <p className="subtitle" style={{ marginBottom: '1.75rem', fontSize: '0.85rem' }}>
              Choose a delivery location for this order.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {addresses.map((address) => (
                <div 
                  key={address.id} 
                  onClick={() => handleAddressSelect(address)}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: selectedAddress?.id === address.id ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid var(--card-border)',
                    background: selectedAddress?.id === address.id ? 'rgba(99, 102, 241, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = selectedAddress?.id === address.id ? 'rgba(99, 102, 241, 0.45)' : 'var(--card-border)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>{address.fullName}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.05)', padding: '0.15rem 0.35rem', borderRadius: '4px', border: '1px solid var(--card-border)', fontWeight: 600 }}>
                        {address.addressType}
                      </span>
                    </div>
                    {address.isDefault && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.15)', padding: '0.15rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    <div>{address.phone}</div>
                    <div style={{ marginTop: '0.25rem' }}>{address.addressLine1}, {address.city}, {address.state} - {address.postalCode}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                className="details-back-link" 
                onClick={() => navigateTo('/addresses')}
                style={{ marginBottom: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Manage / Add Address
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
