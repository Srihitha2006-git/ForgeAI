import React, { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #4f46e5, #06b6d4)', // Indigo to Cyan
  'linear-gradient(135deg, #ec4899, #8b5cf6)', // Pink to Purple
  'linear-gradient(135deg, #10b981, #3b82f6)', // Emerald to Blue
  'linear-gradient(135deg, #f59e0b, #ec4899)', // Amber to Pink
  'linear-gradient(135deg, #6366f1, #a855f7)'  // Indigo to Purple
];

const STATUS_METADATA = {
  PLACED: {
    label: 'Order Placed',
    defaultDesc: 'Your order has been placed successfully.',
  },
  CONFIRMED: {
    label: 'Payment Confirmed',
    defaultDesc: 'Payment successfully verified.',
  },
  PROCESSING: {
    label: 'Processing',
    defaultDesc: 'Your order is being prepared.',
  },
  SHIPPED: {
    label: 'Shipped',
    defaultDesc: 'Your order has been handed over to our courier partner.',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    defaultDesc: 'Our delivery agent is on the way to your location.',
  },
  DELIVERED: {
    label: 'Delivered',
    defaultDesc: 'Order was successfully delivered.',
  },
  CANCELLED: {
    label: 'Order Cancelled',
    defaultDesc: 'This order has been cancelled.',
  }
};

export default function OrderDetailsPage({ orderId, navigateTo, onShowToast }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('items'); // 'items' or 'tracking'
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrderDetails(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      const status = err.response?.status;
      if (status === 404) {
        setError('ORDER_NOT_FOUND');
      } else if (status === 403) {
        setError('FORBIDDEN');
      } else {
        setError('GENERAL_ERROR');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const loadTracking = async () => {
    setTrackingLoading(true);
    setTrackingError(null);
    try {
      const data = await orderService.getOrderTracking(orderId);
      setTrackingData(data);
    } catch (err) {
      console.error('Error fetching tracking:', err);
      setTrackingError('Unable to load tracking information');
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tracking') {
      loadTracking();
    }
  }, [activeTab, orderId]);

  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 1. LOADING STATE SKELETON
  if (loading) {
    return (
      <div className="container" style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
        <div className="skeleton-line" style={{ height: '1.25rem', width: '120px', marginBottom: '1.5rem' }}></div>
        <div className="cart-layout">
          <div className="cart-items-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ height: '150px', padding: '1.5rem', borderRadius: '16px' }}>
              <div className="skeleton-line" style={{ height: '1.25rem', width: '30%', marginBottom: '1rem' }}></div>
              <div className="skeleton-line" style={{ height: '1rem', width: '60%' }}></div>
            </div>
            <div className="glass-panel" style={{ height: '220px', padding: '1.5rem', borderRadius: '16px' }}>
              <div className="skeleton-line" style={{ height: '1.25rem', width: '40%', marginBottom: '1rem' }}></div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div className="skeleton-image" style={{ width: '60px', height: '60px', borderRadius: '8px' }}></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="skeleton-line" style={{ height: '1rem', width: '50%' }}></div>
                  <div className="skeleton-line" style={{ height: '0.8rem', width: '20%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="cart-summary-card" style={{ height: '200px' }}>
            <div className="skeleton-line" style={{ height: '1.25rem', width: '60%', marginBottom: '1rem' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR: FORBIDDEN ACCESS
  if (error === 'FORBIDDEN') {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="error-state" style={{ padding: '5rem 2rem' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h3>Access Denied</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '2rem' }}>You do not have permission to view this order.</p>
          <button className="btn" onClick={() => navigateTo('/orders')} style={{ padding: '0.8rem 2.2rem' }}>
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // 3. ERROR: ORDER NOT FOUND
  if (error === 'ORDER_NOT_FOUND') {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="error-state" style={{ padding: '5rem 2rem' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Order not found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '2rem' }}>The requested order ID does not exist.</p>
          <button className="btn" onClick={() => navigateTo('/orders')} style={{ padding: '0.8rem 2.2rem' }}>
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // 4. ERROR: GENERAL API ERROR
  if (error) {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="error-state" style={{ padding: '5rem 2rem' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Unable to load order</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '2rem' }}>Something went wrong. Please try again.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button className="details-back-link" onClick={() => navigateTo('/orders')} style={{ marginBottom: 0 }}>
              Back to Orders
            </button>
            <button className="search-btn" onClick={fetchOrderDetails} style={{ padding: '0.6rem 1.5rem' }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const addr = order.deliveryAddress || {};

  return (
    <div className="container" style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
      {/* HEADER SECTION */}
      <div style={{ marginBottom: '2rem' }}>
        <button className="details-back-link" onClick={() => navigateTo('/orders')} style={{ margin: '0 0 0.5rem 0' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Orders
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: '2rem', fontWeight: 800 }}>
              Order #{order.orderNumber}
            </h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Placed on {formatDate(order.createdAt)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {activeTab !== 'tracking' && (
              <button 
                onClick={() => {
                  setActiveTab('tracking');
                  setTimeout(() => {
                    const target = document.getElementById('details-tab-container');
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 50);
                }}
                className="btn btn-outline"
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  margin: 0,
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#c7d2fe',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Track Order
              </button>
            )}
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 800, 
              color: order.status === 'CANCELLED' ? '#ef4444' : '#10b981', 
              background: order.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
              border: order.status === 'CANCELLED' ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)', 
              padding: '0.35rem 0.75rem', 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: order.status === 'CANCELLED' ? '#ef4444' : '#10b981' 
              }}></span>
              {order.status === 'PLACED' ? 'Order Placed' :
               order.status === 'CONFIRMED' ? 'Order Confirmed' :
               order.status === 'PROCESSING' ? 'Processing' :
               order.status === 'SHIPPED' ? 'Shipped' :
               order.status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' :
               order.status === 'DELIVERED' ? 'Delivered' :
               order.status === 'CANCELLED' ? 'Cancelled' : order.status}
            </span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN CONTENT LAYOUT */}
      <div className="cart-layout">
        {/* LEFT COLUMN */}
        <div className="cart-items-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* SECTION 1: DELIVERY ADDRESS */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Delivery Address
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>{addr.fullName}</span>
                {addr.addressType && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.05)', padding: '0.15rem 0.35rem', borderRadius: '4px', border: '1px solid var(--card-border)', fontWeight: 600 }}>
                    {addr.addressType}
                  </span>
                )}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{addr.phone}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                <div>{addr.addressLine1}</div>
                {addr.addressLine2 && <div>{addr.addressLine2}</div>}
                <div>{addr.city}, {addr.state} - {addr.postalCode}</div>
                <div>{addr.country}</div>
              </div>
            </div>
          </div>

          {/* SECTION 2: SWITCHABLE VIEW CONTAINER */}
          <div id="details-tab-container" className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
            
            {/* TABS SELECTOR */}
            <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setActiveTab('items')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'items' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  paddingBottom: '0.5rem',
                  borderBottom: activeTab === 'items' ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                Items in Order
              </button>
              <button 
                onClick={() => setActiveTab('tracking')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'tracking' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  paddingBottom: '0.5rem',
                  borderBottom: activeTab === 'tracking' ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Track Order
              </button>
            </div>

            {activeTab === 'items' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {order.orderItems.map((item) => {
                  const fallbackGradient = FALLBACK_GRADIENTS[(item.productId || item.name.length) % FALLBACK_GRADIENTS.length];
                  
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '1.25rem' }}>
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
            ) : (
              /* TRACKING TIMELINE VIEW */
              <div>
                {trackingLoading && (
                  <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} style={{ display: 'flex', gap: '1.25rem' }}>
                        <div className="skeleton-image" style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0 }}></div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div className="skeleton-line" style={{ height: '1rem', width: '35%' }}></div>
                          <div className="skeleton-line" style={{ height: '0.8rem', width: '50%' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {trackingError && (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{trackingError}</p>
                    <button className="btn btn-outline" onClick={loadTracking} style={{ padding: '0.4rem 1.5rem', fontSize: '0.8rem' }}>
                      Retry
                    </button>
                  </div>
                )}

                {!trackingLoading && !trackingError && trackingData && (
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 0' }}>
                    {(() => {
                      const standardMilestones = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                      const milestonesToRender = [];
                      let cancelledInjected = false;

                      for (let i = 0; i < standardMilestones.length; i++) {
                        const m = standardMilestones[i];
                        const event = trackingData.tracking.find(e => e.status === m);
                        if (event) {
                          milestonesToRender.push(m);
                        } else {
                          if (trackingData.currentStatus === 'CANCELLED' && !cancelledInjected) {
                            milestonesToRender.push('CANCELLED');
                            cancelledInjected = true;
                          }
                          milestonesToRender.push(m);
                        }
                      }

                      if (trackingData.currentStatus === 'CANCELLED' && !cancelledInjected) {
                        milestonesToRender.push('CANCELLED');
                      }

                      return milestonesToRender.map((m, idx) => {
                        const metadata = STATUS_METADATA[m] || {};
                        const event = trackingData.tracking.find(e => e.status === m);
                        
                        const lifecycleOrder = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                        const currentIdx = lifecycleOrder.indexOf(trackingData.currentStatus);
                        const milestoneIdx = lifecycleOrder.indexOf(m);

                        let type = 'upcoming'; // 'completed', 'current', 'upcoming', 'disabled'
                        if (event) {
                          if (trackingData.currentStatus === m) {
                            type = 'current';
                          } else {
                            type = 'completed';
                          }
                        } else if (trackingData.currentStatus === m) {
                          type = 'current';
                        } else if (milestoneIdx !== -1 && currentIdx !== -1 && milestoneIdx < currentIdx) {
                          type = 'completed';
                        } else if (trackingData.currentStatus === 'CANCELLED') {
                          type = 'disabled';
                        }

                        const displayDescription = event
                          ? event.description
                          : (type === 'current' || type === 'completed')
                          ? metadata.defaultDesc
                          : (type === 'disabled' ? 'Pending (Cancelled)' : 'Pending');

                        const displayTimestamp = event
                          ? formatDate(event.timestamp)
                          : (type === 'current' || (type === 'completed' && m === 'PLACED'))
                          ? formatDate(order.createdAt)
                          : null;

                        const isLast = idx === milestonesToRender.length - 1;

                        return (
                          <div key={m} style={{ display: 'flex', gap: '1.5rem', position: 'relative', minHeight: '80px' }}>
                            
                            {/* CONNECTOR LINE */}
                            {!isLast && (
                              <div 
                                style={{
                                  position: 'absolute',
                                  left: '12px',
                                  top: '26px',
                                  bottom: '-14px',
                                  width: '2px',
                                  background: type === 'completed' 
                                    ? '#10b981'
                                    : type === 'current'
                                    ? 'linear-gradient(to bottom, #8b5cf6, rgba(255, 255, 255, 0.15))'
                                    : 'rgba(255, 255, 255, 0.1)',
                                  zIndex: 1
                                }}
                              />
                            )}

                            {/* TIMELINE ICON */}
                            {type === 'completed' ? (
                              <div 
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  zIndex: 2,
                                  background: '#10b981',
                                  color: '#ffffff',
                                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.35)'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            ) : type === 'current' ? (
                              <div 
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  zIndex: 2,
                                  background: m === 'CANCELLED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                                  border: m === 'CANCELLED' ? '2px solid #ef4444' : '2px solid #8b5cf6',
                                  animation: 'pulse 2s infinite',
                                  boxShadow: m === 'CANCELLED' ? '0 0 12px rgba(239, 68, 68, 0.5)' : '0 0 12px rgba(139, 92, 246, 0.5)'
                                }}
                              >
                                <span style={{ 
                                  width: '10px', 
                                  height: '10px', 
                                  borderRadius: '50%', 
                                  background: m === 'CANCELLED' ? '#ef4444' : '#8b5cf6' 
                                }}></span>
                              </div>
                            ) : (
                              <div 
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  zIndex: 2,
                                  background: 'transparent',
                                  border: '2px solid rgba(255, 255, 255, 0.2)'
                                }}
                              >
                                <span style={{ 
                                  width: '8px', 
                                  height: '8px', 
                                  borderRadius: '50%', 
                                  border: '1.5px solid rgba(255, 255, 255, 0.35)',
                                  background: 'transparent'
                                }}></span>
                              </div>
                            )}

                            {/* DETAILS CONTENT */}
                            <div style={{ flex: 1, paddingBottom: '1.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h4 
                                  style={{ 
                                    color: type === 'disabled' ? 'var(--text-muted)' : 'white', 
                                    fontSize: '0.95rem', 
                                    fontWeight: 700, 
                                    margin: 0 
                                  }}
                                >
                                  {metadata.label}
                                </h4>
                                {displayTimestamp && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                    {displayTimestamp}
                                  </span>
                                )}
                              </div>
                              <p 
                                style={{ 
                                  color: type === 'current' 
                                    ? '#c7d2fe' 
                                    : type === 'disabled' 
                                    ? 'rgba(255, 255, 255, 0.2)' 
                                    : 'var(--text-secondary)', 
                                  fontSize: '0.85rem', 
                                  margin: '0.25rem 0 0 0',
                                  lineHeight: 1.4
                                }}
                              >
                                {displayDescription}
                              </p>
                            </div>

                          </div>
                        );
                      });
                    })()}

                    <style>{`
                      @keyframes pulse {
                        0% {
                          box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
                        }
                        70% {
                          box-shadow: 0 0 0 8px rgba(139, 92, 246, 0);
                        }
                        100% {
                          box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
                        }
                      }
                    `}</style>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: PRICE SUMMARY & TRANSACTION DETAILS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* PRICE BREAKDOWN CARD */}
          <div className="cart-summary-card" style={{ border: '1px solid var(--card-border)', width: '100%', boxSizing: 'border-box' }}>
            <h2 className="cart-summary-title">Summary</h2>
            
            <div className="cart-summary-row" style={{ color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
            
            <div className="cart-summary-row" style={{ color: 'var(--text-secondary)' }}>
              <span>Shipping</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Free Shipping</span>
            </div>

            <div className="cart-summary-total-row" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.25rem' }}>
              <span>Total</span>
              <span className="cart-summary-total-value" style={{ color: '#a5b4fc', fontSize: '1.5rem', fontWeight: 800 }}>
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* PAYMENT DETAILS CARD */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)', background: 'rgba(255, 255, 255, 0.01)' }}>
            <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Payment Information
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Razorpay Order ID</span>
                <span style={{ color: 'white', fontFamily: 'monospace', fontWeight: 500 }}>{order.razorpayOrderId}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Razorpay Payment ID</span>
                <span style={{ color: 'white', fontFamily: 'monospace', fontWeight: 500 }}>{order.razorpayPaymentId}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
