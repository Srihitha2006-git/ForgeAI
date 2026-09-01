import React, { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';

export default function MyOrdersPage({ navigateTo, onShowToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
      year: 'numeric'
    });
  };

  // 1. LOADING SKELETON STATE
  if (loading) {
    return (
      <div className="container" style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
        <h1 style={{ color: 'white', marginBottom: '2rem', fontSize: '2rem', fontWeight: 800 }}>My Orders</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[1, 2].map((i) => (
            <div key={i} className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div className="skeleton-line" style={{ height: '1.25rem', width: '30%' }}></div>
                <div className="skeleton-line" style={{ height: '1.25rem', width: '15%' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div className="skeleton-line" style={{ height: '1rem', width: '60%' }}></div>
                <div className="skeleton-line" style={{ height: '1rem', width: '40%' }}></div>
              </div>
              <div className="skeleton-line" style={{ height: '2.5rem', width: '120px', borderRadius: '8px' }}></div>
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
        <div className="error-state" style={{ padding: '5rem 2rem' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Unable to load orders</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '2rem' }}>Please verify your network connection and try again.</p>
          <button className="btn" onClick={fetchOrders} style={{ padding: '0.8rem 2.5rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (orders.length === 0) {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="empty-state" style={{ padding: '6rem 2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          </div>
          <h3>No Orders Yet</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>Your completed purchases will appear here.</p>
          <button className="btn" onClick={() => navigateTo('/')} style={{ padding: '0.8rem 2.2rem' }}>
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  // 4. MAIN LIST RENDERING
  return (
    <div className="container" style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
      <h1 style={{ color: 'white', marginBottom: '2rem', fontSize: '2rem', fontWeight: 800 }}>My Orders</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {orders.map((order) => (
          <div 
            key={order.id} 
            className="glass-panel" 
            style={{ 
              padding: '1.75rem', 
              borderRadius: '16px', 
              border: '1px solid var(--card-border)',
              background: 'rgba(255, 255, 255, 0.01)',
              transition: 'transform 0.2s, border-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.35)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--card-border)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            {/* CARD HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                  Order #{order.orderNumber}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Placed on: {formatDate(order.createdAt)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>
                  {formatPrice(order.totalAmount)}
                </span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 800, 
                  color: '#10b981', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid rgba(16, 185, 129, 0.25)', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                  {order.status}
                </span>
              </div>
            </div>

            {/* CARD ITEMS PREVIEW */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {order.orderItems.length} {order.orderItems.length === 1 ? 'Item' : 'Items'}
              </div>
              {order.orderItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'white', fontWeight: 600 }}>{item.quantity}×</span>
                    {item.name}
                  </span>
                  <span style={{ color: 'white', fontWeight: 500 }}>
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* ACTIONS */}
            <button 
              className="btn btn-outline"
              onClick={() => navigateTo(`/orders/${order.id}`)}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c7d2fe', fontWeight: 600 }}
            >
              View Order
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
