import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../services/adminService';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
  PLACED: { label: 'Placed', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
  CONFIRMED: { label: 'Confirmed', bg: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', border: 'rgba(14, 165, 233, 0.3)' },
  PACKED: { label: 'Packed', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
  PROCESSING: { label: 'Processing', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
  SHIPPED: { label: 'Shipped', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
  DELIVERED: { label: 'Delivered', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
  CANCELLED: { label: 'Cancelled', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' }
};

const NEXT_VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
};

export default function AdminOrdersPage({ user: propUser, token: propToken, initialOrderId, navigateTo, onShowToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Order for Details View
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Status Update State
  const [targetStatus, setTargetStatus] = useState('');
  const [statusDescription, setStatusDescription] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState(null);

  const user = propUser || JSON.parse(localStorage.getItem('user')) || null;
  const token = propToken || localStorage.getItem('token') || null;

  // Fetch Orders
  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!token) {
      setLoading(false);
      setError('UNAUTHORIZED');
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // 1. Verify admin session
      const profile = await adminService.getAdminMe(token);
      setAdminProfile(profile);

      // 2. Fetch orders
      const data = await adminService.getAdminOrders({ search, status: statusFilter }, token);
      setOrders(data || []);
      if (isRefresh && onShowToast) {
        onShowToast('Orders refreshed successfully');
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
      if (err.response?.status === 403) {
        setError('FORBIDDEN');
      } else if (err.response?.status === 401) {
        setError('UNAUTHORIZED');
      } else {
        setError(err.response?.data?.message || err.message || 'Unable to load orders from server.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, search, statusFilter, onShowToast]);

  useEffect(() => {
    if (token) {
      if (user && user.role !== 'ADMIN') {
        setLoading(false);
        setError('FORBIDDEN');
        return;
      }
      fetchOrders();
    } else {
      setLoading(false);
      setError('UNAUTHORIZED');
    }
  }, [token, user?.role, fetchOrders]);

  // Load initial order if specified by URL (e.g. /admin/orders/123)
  useEffect(() => {
    if (initialOrderId && token) {
      handleOpenOrderDetails(initialOrderId);
    }
  }, [initialOrderId, token]);

  // Open Order Details Modal
  const handleOpenOrderDetails = async (orderId) => {
    setDetailsLoading(true);
    setDetailsError(null);
    setTargetStatus('');
    setStatusDescription('');
    setStatusUpdateError(null);

    try {
      const details = await adminService.getAdminOrderById(orderId, token);
      setSelectedOrder(details);
      // Pre-select first allowed next status if available
      const allowed = NEXT_VALID_TRANSITIONS[details.status] || [];
      if (allowed.length > 0) {
        setTargetStatus(allowed[0]);
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
      setDetailsError(err.response?.data?.error || err.response?.data?.message || 'Failed to load order details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Close Order Details Modal
  const handleCloseOrderDetails = () => {
    setSelectedOrder(null);
    setDetailsError(null);
    if (initialOrderId && navigateTo) {
      navigateTo('/admin/orders');
    }
  };

  // Handle Order Status Update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !targetStatus) return;

    setStatusUpdateLoading(true);
    setStatusUpdateError(null);

    try {
      const updated = await adminService.updateAdminOrderStatus(
        selectedOrder.id,
        {
          status: targetStatus,
          description: statusDescription.trim() || `Status updated to ${targetStatus}`
        },
        token
      );

      setSelectedOrder(updated);
      setStatusDescription('');
      
      const newAllowed = NEXT_VALID_TRANSITIONS[updated.status] || [];
      setTargetStatus(newAllowed.length > 0 ? newAllowed[0] : '');

      // Update in order list state
      setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o));

      if (onShowToast) {
        onShowToast(`Order #${updated.orderNumber} status changed to ${updated.status}`);
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      setStatusUpdateError(err.response?.data?.error || err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Format Currency (INR)
  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  // Format Date & Time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'PLACED').length;
    const inTransit = orders.filter(o => o.status === 'SHIPPED' || o.status === 'OUT_FOR_DELIVERY').length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;
    const totalRevenue = orders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    return { total, pending, inTransit, delivered, totalRevenue };
  }, [orders]);

  // Authorization Guards
  if (!token || error === 'UNAUTHORIZED') {
    return (
      <div className="container" style={{ padding: '3rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#ef4444' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 style={{ color: 'white', marginBottom: '0.75rem', fontWeight: 700 }}>Authentication Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
            You must be logged in with an Administrator account to access the ForgeAI Admin Orders Management.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn" onClick={() => navigateTo('/')} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              Return to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'ADMIN' || error === 'FORBIDDEN') {
    return (
      <div className="container" style={{ padding: '3rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#ef4444' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2 style={{ color: 'white', marginBottom: '0.75rem', fontWeight: 700 }}>Access Denied (403)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
            Administrative privileges are required to access this resource. Your account ({user?.email || 'Customer'}) does not possess the ADMIN role.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn" onClick={() => navigateTo('/')} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              Return to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout container">
      {/* 1. SIDEBAR */}
      <aside className="admin-sidebar glass-panel">
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'white' }}>ForgeAI Admin</span>
          </div>
          <span className="admin-badge">PORTAL</span>
        </div>

        <nav className="admin-nav">
          <button 
            className="admin-nav-item"
            onClick={() => navigateTo('/admin/dashboard')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
            <span className="admin-nav-tag live">LIVE</span>
          </button>

          <button 
            className="admin-nav-item" 
            onClick={() => navigateTo('/admin/products')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <span>Products</span>
            <span className="admin-nav-tag live">LIVE</span>
          </button>

          <button 
            className="admin-nav-item disabled" 
            title="Inventory adjustment APIs are active from Phase 4A; dashboard overview is shown on Dashboard"
            disabled
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <span>Inventory</span>
            <span className="admin-nav-tag future">Phase 4A</span>
          </button>

          <button 
            className="admin-nav-item active" 
            onClick={() => navigateTo('/admin/orders')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span>Orders</span>
            <span className="admin-nav-tag live">LIVE</span>
          </button>

          <button 
            className="admin-nav-item" 
            onClick={() => navigateTo('/admin/analytics')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Analytics</span>
            <span className="admin-nav-tag live" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}>PHASE 4F</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button 
            className="admin-back-btn"
            onClick={() => navigateTo('/')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Marketplace</span>
          </button>

          <div className="admin-user-card">
            <div className="admin-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="admin-user-meta" style={{ overflow: 'hidden' }}>
              <div className="admin-user-name" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.name || adminProfile?.name || 'Administrator'}
              </div>
              <div className="admin-user-role">
                <span className="admin-online-dot"></span>
                <span>{user?.role || 'ADMIN'} Active</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="admin-content" style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <header className="glass-panel admin-header" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', margin: 0 }}>
                Orders Management
              </h1>
              <span className="admin-pill-badge active" style={{ fontSize: '0.75rem' }}>Phase 4E</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Track customer orders, inspect line items & shipping details, and execute sequential status transitions.
            </p>
          </div>

          <button
            className="admin-refresh-btn"
            onClick={() => fetchOrders(true)}
            disabled={refreshing || loading}
            title="Refresh Orders"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.15rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={refreshing ? 'spinning' : ''}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </header>

        {/* KPI Cards */}
        <section className="admin-grid-4-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Orders</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>{stats.total}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pending Action</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa' }}>{stats.pending}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>In Transit</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>{stats.inTransit}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Delivered</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{stats.delivered}</div>
          </div>
        </section>

        {/* Search & Filter Controls */}
        <section className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              id="admin-order-search-input"
              type="text"
              className="search-input"
              placeholder="Search by order ID, order number, customer name/email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem', height: '42px', fontSize: '0.875rem' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              id="admin-filter-order-status"
              className="search-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: '42px', padding: '0 0.85rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--card-bg)' }}
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PENDING">Pending / Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PACKED">Packed / Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </section>

        {/* Orders Table */}
        {loading ? (
          <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', borderRadius: '12px' }}>
            <div className="spinner" style={{ margin: '0 auto 1.25rem', width: '36px', height: '36px' }}></div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading ForgeAI customer orders from MySQL...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '12px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }}>
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontWeight: 600 }}>No orders found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              {search || statusFilter !== 'ALL'
                ? 'No customer orders match your current search and filter criteria.'
                : 'There are currently no customer orders in the database.'}
            </p>
            {(search || statusFilter !== 'ALL') && (
              <button
                className="btn"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                }}
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Order ID / Number</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Items</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Total Amount</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Payment</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const cfg = STATUS_CONFIG[o.status] || { label: o.status, bg: 'rgba(255,255,255,0.1)', color: '#fff', border: 'rgba(255,255,255,0.2)' };

                    return (
                      <tr
                        key={o.id}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Order ID & Number */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.2rem' }}>
                            #{o.id}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {o.orderNumber}
                          </div>
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 500, color: 'white', marginBottom: '0.2rem' }}>
                            {o.customerName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {o.customerEmail}
                          </div>
                        </td>

                        {/* Date */}
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {formatDateTime(o.createdAt)}
                        </td>

                        {/* Items */}
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.8rem' }}>
                            {o.itemCount} item{o.itemCount !== 1 ? 's' : ''}
                          </span>
                        </td>

                        {/* Total Amount */}
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'white' }}>
                          {formatCurrency(o.totalAmount)}
                        </td>

                        {/* Payment */}
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
                            {o.paymentStatus || 'PAID'}
                          </span>
                        </td>

                        {/* Order Status */}
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '12px',
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            fontWeight: 600
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color }}></span>
                            <span>{cfg.label}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <button
                            id={`admin-view-order-${o.id}`}
                            onClick={() => handleOpenOrderDetails(o.id)}
                            style={{
                              background: 'rgba(99, 102, 241, 0.1)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              borderRadius: '6px',
                              padding: '0.4rem 0.75rem',
                              color: '#a5b4fc',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'; e.currentTarget.style.color = '#c7d2fe'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; e.currentTarget.style.color = '#a5b4fc'; }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Showing {orders.length} orders</span>
              <span>Protected by ForgeAI ADMIN RBAC</span>
            </div>
          </div>
        )}
      </main>

      {/* 3. ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '92vh', overflowY: 'auto', padding: '2rem', borderRadius: '16px', position: 'relative' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
                    Order #{selectedOrder.id}
                  </h2>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '12px',
                    background: STATUS_CONFIG[selectedOrder.status]?.bg || 'rgba(255,255,255,0.1)',
                    color: STATUS_CONFIG[selectedOrder.status]?.color || '#fff',
                    border: `1px solid ${STATUS_CONFIG[selectedOrder.status]?.border || 'rgba(255,255,255,0.2)'}`,
                    fontWeight: 600
                  }}>
                    {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '0.75rem' }}>
                  <span>Order Number: <strong style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{selectedOrder.orderNumber}</strong></span>
                  <span>•</span>
                  <span>Placed: {formatDateTime(selectedOrder.createdAt)}</span>
                </div>
              </div>

              <button
                onClick={handleCloseOrderDetails}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', padding: '0.25rem' }}
              >
                ✕
              </button>
            </div>

            {/* STATUS UPDATE CONTROL PANEL */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: 600 }}>Order Status Workflow</h3>
              </div>

              {statusUpdateError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1rem', color: '#f87171', fontSize: '0.85rem' }}>
                  {statusUpdateError}
                </div>
              )}

              {(selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'CANCELLED') ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedOrder.status === 'DELIVERED' ? '#10b981' : '#ef4444' }}></span>
                  <span>This order has reached its terminal state (<strong>{selectedOrder.status}</strong>) and cannot be modified further.</span>
                </div>
              ) : (
                <form onSubmit={handleStatusUpdate} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Next Valid Status
                    </label>
                    <select
                      id="admin-order-status-select"
                      className="search-input"
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value)}
                      required
                      style={{ width: '100%', height: '40px', background: 'var(--card-bg)', fontSize: '0.875rem' }}
                    >
                      {(NEXT_VALID_TRANSITIONS[selectedOrder.status] || []).map((st) => (
                        <option key={st} value={st}>
                          {st === 'CANCELLED' ? `⚠️ CANCEL ORDER (Restock Items)` : `Advance to ${STATUS_CONFIG[st]?.label || st}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: '2 1 280px' }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Status Notes / Description
                    </label>
                    <input
                      id="admin-order-status-description"
                      type="text"
                      className="search-input"
                      placeholder="e.g. Dispatched with BlueDart Tracking #12345"
                      value={statusDescription}
                      onChange={(e) => setStatusDescription(e.target.value)}
                      style={{ width: '100%', height: '40px', fontSize: '0.875rem' }}
                    />
                  </div>

                  <button
                    id="admin-update-status-submit-btn"
                    type="submit"
                    className="btn"
                    disabled={statusUpdateLoading || !targetStatus}
                    style={{ height: '40px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                  >
                    {statusUpdateLoading && <span className="spinner" style={{ width: '14px', height: '14px' }}></span>}
                    <span>{statusUpdateLoading ? 'Updating...' : 'Update Status'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* TWO-COLUMN DETAILS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {/* Customer Information */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Customer Details</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
                  <div><strong style={{ color: 'white' }}>{selectedOrder.customerName}</strong></div>
                  <div style={{ color: 'var(--text-secondary)' }}>Email: {selectedOrder.customerEmail}</div>
                  {selectedOrder.customerPhone && (
                    <div style={{ color: 'var(--text-secondary)' }}>Phone: {selectedOrder.customerPhone}</div>
                  )}
                  {selectedOrder.customerId && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>User ID: #{selectedOrder.customerId}</div>
                  )}
                </div>
              </div>

              {/* Shipping / Delivery Information */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>Delivery Address</span>
                </h3>
                {selectedOrder.deliveryAddress ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <div style={{ fontWeight: 600, color: 'white' }}>{selectedOrder.deliveryAddress.fullName} ({selectedOrder.deliveryAddress.addressType})</div>
                    <div>{selectedOrder.deliveryAddress.addressLine1}</div>
                    {selectedOrder.deliveryAddress.addressLine2 && <div>{selectedOrder.deliveryAddress.addressLine2}</div>}
                    <div>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} - {selectedOrder.deliveryAddress.postalCode}</div>
                    <div>{selectedOrder.deliveryAddress.country}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Contact: {selectedOrder.deliveryAddress.phone}</div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No delivery address recorded.</p>
                )}
              </div>
            </div>

            {/* ORDER ITEMS TABLE */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                <span>Ordered Items ({selectedOrder.orderItems?.length || 0})</span>
              </h3>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '0.5rem', fontWeight: 600 }}>Unit Price</th>
                    <th style={{ padding: '0.5rem', fontWeight: 600 }}>Quantity</th>
                    <th style={{ padding: '0.5rem 0', fontWeight: 600, textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.orderItems || []).map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              </svg>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'white' }}>{item.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Product ID: #{item.productId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'white', fontWeight: 600 }}>
                        x{item.quantity}
                      </td>
                      <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 700, color: 'white' }}>
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ padding: '1rem 0 0 0', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>
                      Grand Total:
                    </td>
                    <td style={{ padding: '1rem 0 0 0', fontWeight: 800, color: 'white', fontSize: '1.1rem', textAlign: 'right' }}>
                      {formatCurrency(selectedOrder.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* PAYMENT INFORMATION */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <span>Payment Information</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Payment Method</div>
                  <div style={{ fontWeight: 600, color: 'white', marginTop: '0.2rem' }}>{selectedOrder.paymentMethod}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Payment Status</div>
                  <div style={{ fontWeight: 600, color: '#34d399', marginTop: '0.2rem' }}>{selectedOrder.paymentStatus}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Gateway Payment ID</div>
                  <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{selectedOrder.razorpayPaymentId || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Gateway Order ID</div>
                  <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{selectedOrder.razorpayOrderId || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* ORDER STATUS HISTORY / TIMELINE */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Audit & Status History Timeline</span>
              </h3>

              {(!selectedOrder.statusHistory || selectedOrder.statusHistory.length === 0) ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No status events recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1.5rem' }}>
                  {/* Vertical line indicator */}
                  <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'rgba(255, 255, 255, 0.1)' }}></div>

                  {selectedOrder.statusHistory.map((event, idx) => {
                    const cfg = STATUS_CONFIG[event.status] || { label: event.status, bg: 'rgba(255,255,255,0.1)', color: '#fff', border: 'rgba(255,255,255,0.2)' };

                    return (
                      <div key={idx} style={{ position: 'relative' }}>
                        {/* Dot indicator */}
                        <div style={{
                          position: 'absolute',
                          left: '-1.5rem',
                          top: '4px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: cfg.color,
                          border: '2px solid var(--background)'
                        }}></div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '10px',
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            fontWeight: 600
                          }}>
                            {cfg.label}
                          </span>
                          {event.previousStatus && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              (from {event.previousStatus})
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {formatDateTime(event.timestamp)}
                          </span>
                        </div>

                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {event.description}
                        </div>
                        {event.changedBy && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                            Recorded by: {event.changedBy}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
              <button
                type="button"
                className="btn"
                onClick={handleCloseOrderDetails}
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '0.65rem 1.5rem' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
