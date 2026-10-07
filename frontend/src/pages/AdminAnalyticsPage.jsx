import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../services/adminService';

export default function AdminAnalyticsPage({ user: propUser, token: propToken, navigateTo, onShowToast }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState(null);

  // Resolve user and token from props, falling back to localStorage
  const user = propUser || JSON.parse(localStorage.getItem('user')) || null;
  const token = propToken || localStorage.getItem('token') || null;

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
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

      // 2. Fetch full consolidated analytics summary
      const data = await adminService.getAnalyticsSummary(token);
      setAnalyticsData(data);
      setLastUpdated(new Date());

      if (isRefresh && onShowToast) {
        onShowToast('Analytics data refreshed successfully');
      }
    } catch (err) {
      console.error('Failed to fetch admin analytics data:', err);
      if (err.response?.status === 403) {
        setError('FORBIDDEN');
      } else if (err.response?.status === 401) {
        setError('UNAUTHORIZED');
      } else {
        setError(err.response?.data?.message || err.message || 'Unable to load analytics data from backend server.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, onShowToast]);

  useEffect(() => {
    if (token) {
      if (user && user.role !== 'ADMIN') {
        setLoading(false);
        setError('FORBIDDEN');
        return;
      }
      fetchAnalytics();
    } else {
      setLoading(false);
      setError('UNAUTHORIZED');
    }
  }, [token, user?.role, fetchAnalytics]);

  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(amount));
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Status visual mapping
  const STATUS_META = {
    PENDING: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
    CONFIRMED: { label: 'Confirmed', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)' },
    PACKED: { label: 'Packed', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' },
    PROCESSING: { label: 'Processing', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.3)' },
    SHIPPED: { label: 'Shipped', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)' },
    DELIVERED: { label: 'Delivered', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
    CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' }
  };

  // Authorization check: User must be logged in with role ADMIN
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
            You must be logged in with an Administrator account to access ForgeAI Admin Analytics.
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
          <h2 style={{ color: 'white', marginBottom: '0.75rem', fontWeight: 700 }}>403 Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
            Access to the Admin Analytics module is restricted to platform administrators only.
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

  // Calculate SVG Chart coordinates for Sales Trend
  const trendPoints = analyticsData?.dailySalesTrend || [];
  const maxRevenue = Math.max(...trendPoints.map(p => Number(p.revenue) || 0), 100);

  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 45;
  const paddingY = 30;

  const points = trendPoints.map((pt, idx) => {
    const x = trendPoints.length > 1
      ? paddingX + (idx / (trendPoints.length - 1)) * (chartWidth - paddingX * 2)
      : chartWidth / 2;
    const rev = Number(pt.revenue) || 0;
    const y = chartHeight - paddingY - (rev / maxRevenue) * (chartHeight - paddingY * 2);
    return { x, y, ...pt };
  });

  const svgPathD = points.length > 0
    ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
    : '';

  const svgAreaD = points.length > 0
    ? `${svgPathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  // Order status distribution calculations - Focused on active fulfillment pipeline
  const orderStatusData = analyticsData?.orderStatus || {};
  const totalOrdersCount = Number(orderStatusData.total) || 0;
  const statusEntries = [
    { key: 'PROCESSING', label: 'Processing', count: Number(orderStatusData.processing || 0) },
    { key: 'SHIPPED', label: 'Shipped', count: Number(orderStatusData.shipped || 0) },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', count: Number(orderStatusData.outForDelivery || 0) },
    { key: 'DELIVERED', label: 'Delivered', count: Number(orderStatusData.delivered || 0) },
    { key: 'CANCELLED', label: 'Cancelled', count: Number(orderStatusData.cancelled || 0) }
  ];
  const displayedTotal = statusEntries.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="admin-layout container">
      {/* 1. SIDEBAR NAVIGATION */}
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
            className="admin-nav-item" 
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
            className="admin-nav-item active" 
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
                <span>Verified Admin</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="admin-main" style={{ flexGrow: 1, minWidth: 0 }}>
        {/* HEADER BAR */}
        <div className="admin-header glass-panel" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', margin: 0 }}>
                Platform Analytics
              </h1>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                Real-time MySQL Data
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Business metrics across sales, order pipelines, product catalog, inventory, and registered users.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button 
              className="btn btn-secondary"
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing || loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1.5rem', animation: 'spin 0.8s linear infinite' }}></div>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Computing Platform Analytics</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Querying database aggregates for orders, inventory, catalog, and revenue...</p>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && error !== 'UNAUTHORIZED' && error !== 'FORBIDDEN' && (
          <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Failed to Load Analytics</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
            <button className="btn" onClick={() => fetchAnalytics(false)} style={{ background: 'var(--primary)' }}>
              Try Again
            </button>
          </div>
        )}

        {/* ANALYTICS CONTENT */}
        {!loading && !error && analyticsData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. SUMMARY KPI CARDS (6 Key Metrics) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {/* Total Orders */}
              <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>
                  {formatNumber(analyticsData.totalOrders)}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>Lifetime customer orders</span>
              </div>

              {/* Total Revenue */}
              <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399' }}>
                  {formatCurrency(analyticsData.totalRevenue)}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Active non-cancelled sales</span>
              </div>

              {/* Total Products */}
              <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Products</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>
                  {formatNumber(analyticsData.totalProducts)}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Catalog SKU items</span>
              </div>

              {/* Total Customers */}
              <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customers</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>
                  {formatNumber(analyticsData.totalCustomers)}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#c084fc' }}>Registered buyers</span>
              </div>

              {/* Pending / Processing Orders */}
              <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending / Processing</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24' }}>
                  {formatNumber(analyticsData.pendingOrders || (Number(orderStatusData.processing || 0) + Number(orderStatusData.pending || 0) + Number(orderStatusData.placed || 0)))}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>In fulfillment pipeline</span>
              </div>

              {/* Delivered Orders */}
              <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivered</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399' }}>
                  {formatNumber(analyticsData.deliveredOrders)}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Completed fulfillments</span>
              </div>
            </div>

            {/* 2. SALES ANALYTICS & REVENUE BREAKDOWN */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Sales & Revenue Performance
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Computed strictly from valid non-cancelled orders with verified transaction amounts.
                  </p>
                </div>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', color: '#a5b4fc', maxWidth: '400px' }}>
                  <strong>Revenue Rule:</strong> {analyticsData.sales?.revenueCalculationRule || 'Non-cancelled orders only.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Sales Revenue</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399', margin: '0.35rem 0' }}>
                    {formatCurrency(analyticsData.sales?.totalRevenue)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    From {analyticsData.sales?.nonCancelledOrdersCount || 0} active orders
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Delivered Revenue</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#60a5fa', margin: '0.35rem 0' }}>
                    {formatCurrency(analyticsData.sales?.deliveredRevenue)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    From {analyticsData.sales?.completedOrdersCount || 0} delivered orders
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Average Order Value (AOV)</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f59e0b', margin: '0.35rem 0' }}>
                    {formatCurrency(analyticsData.sales?.averageOrderValue)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Per completed / active order
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Cancelled Orders Excluded</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f87171', margin: '0.35rem 0' }}>
                    {formatNumber(analyticsData.sales?.cancelledOrdersCount)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                    Zero revenue counted for cancelled
                  </div>
                </div>
              </div>
            </div>

            {/* 3. SALES TREND CHART */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#818cf8' }}>
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                      <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                    Daily Revenue Trend
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Temporal revenue distribution based on actual order transaction timestamps.
                  </p>
                </div>
                {hoveredTrendPoint && (
                  <div style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#c7d2fe' }}>
                    <span style={{ fontWeight: 600 }}>{formatShortDate(hoveredTrendPoint.date)}:</span> {formatCurrency(hoveredTrendPoint.revenue)} ({hoveredTrendPoint.orderCount} {hoveredTrendPoint.orderCount === 1 ? 'order' : 'orders'})
                  </div>
                )}
              </div>

              {trendPoints.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '8px', border: '1px dashed var(--card-border)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>No sales trend data available yet.</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>As customers complete orders, daily timeline charts will automatically appear here.</span>
                </div>
              ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <svg 
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                    style={{ width: '100%', minWidth: '550px', height: '220px', overflow: 'visible' }}
                  >
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
                    <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
                    <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="rgba(255, 255, 255, 0.1)" />

                    {/* Max Y Label */}
                    <text x={paddingX - 8} y={paddingY + 4} fill="#64748b" fontSize="10" textAnchor="end">{formatCurrency(maxRevenue)}</text>
                    <text x={paddingX - 8} y={chartHeight - paddingY + 3} fill="#64748b" fontSize="10" textAnchor="end">₹0</text>

                    {/* Gradient Area Fill */}
                    {svgAreaD && <path d={svgAreaD} fill="url(#trendGradient)" />}

                    {/* Main Trend Line */}
                    {svgPathD && (
                      <path 
                        d={svgPathD} 
                        fill="none" 
                        stroke="#818cf8" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    )}

                    {/* Data Points */}
                    {points.map((pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredTrendPoint?.date === pt.date ? 6 : 4}
                          fill={hoveredTrendPoint?.date === pt.date ? '#a5b4fc' : '#6366f1'}
                          stroke="#07090e"
                          strokeWidth="2"
                          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                          onMouseEnter={() => setHoveredTrendPoint(pt)}
                          onMouseLeave={() => setHoveredTrendPoint(null)}
                        />
                        {/* X-axis date label */}
                        <text 
                          x={pt.x} 
                          y={chartHeight - paddingY + 16} 
                          fill="#94a3b8" 
                          fontSize="10" 
                          textAnchor="middle"
                        >
                          {formatShortDate(pt.date)}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              )}
            </div>

            {/* 4. ORDER STATUS PIPELINE ANALYTICS */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Order Lifecycle & Fulfillment Status
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Complete pipeline distribution across all order fulfillment stages.
                </p>
              </div>

              {displayedTotal === 0 && totalOrdersCount === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No orders recorded in the platform yet.
                </div>
              ) : (
                <>
                  {/* Status Progress Bar */}
                  <div style={{ width: '100%', height: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', overflow: 'hidden', display: 'flex', marginBottom: '1.5rem' }}>
                    {statusEntries.map(s => {
                      if (s.count === 0) return null;
                      const pct = displayedTotal > 0 ? ((s.count / displayedTotal) * 100).toFixed(1) : 0;
                      const meta = STATUS_META[s.key] || { color: '#6366f1' };
                      return (
                        <div
                          key={s.key}
                          title={`${s.label}: ${s.count} (${pct}%)`}
                          style={{ width: `${pct}%`, background: meta.color, height: '100%', transition: 'width 0.3s ease' }}
                        />
                      );
                    })}
                  </div>

                  {/* Status Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    {statusEntries.map(s => {
                      const meta = STATUS_META[s.key] || { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.2)' };
                      const pct = displayedTotal > 0 ? ((s.count / displayedTotal) * 100).toFixed(0) : 0;
                      return (
                        <div
                          key={s.key}
                          style={{
                            background: meta.bg,
                            border: `1px solid ${meta.border}`,
                            padding: '0.85rem 0.75rem',
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ color: meta.color, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {s.label}
                          </div>
                          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'white', margin: '0.2rem 0' }}>
                            {s.count}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {pct}% of orders
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* 5. PRODUCT & INVENTORY OVERVIEW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Product Catalog Statistics */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#38bdf8' }}>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                  Product Catalog Metrics
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                  Catalog availability and active product visibility.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>ACTIVE PRODUCTS</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981' }}>
                      {formatNumber(analyticsData.products?.activeProducts)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>INACTIVE PRODUCTS</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f87171' }}>
                      {formatNumber(analyticsData.products?.inactiveProducts)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>LOW STOCK ITEMS</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fbbf24' }}>
                      {formatNumber(analyticsData.products?.lowStockProductsCount)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>OUT OF STOCK</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444' }}>
                      {formatNumber(analyticsData.products?.outOfStockProductsCount)}
                    </div>
                  </div>
                </div>

                {/* Category Breakdown */}
                {analyticsData.products?.categoryBreakdown && Object.keys(analyticsData.products.categoryBreakdown).length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Category Distribution
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {Object.entries(analyticsData.products.categoryBreakdown).map(([cat, count]) => (
                        <span 
                          key={cat} 
                          style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#a5b4fc', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
                        >
                          {cat.replace(/_/g, ' ')}: <strong>{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Inventory Stock Levels (Phase 4A & 4D Data) */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  Inventory Stock Metrics
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                  Real-time warehouse units from Phase 4A inventory records.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Available Stock</span>
                    </div>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white' }}>
                      {formatNumber(analyticsData.inventory?.totalAvailableStock)} units
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reserved in Active Orders</span>
                    </div>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fbbf24' }}>
                      {formatNumber(analyticsData.inventory?.totalReservedStock)} units
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa' }}></span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sold / Fulfilled Stock</span>
                    </div>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#60a5fa' }}>
                      {formatNumber(analyticsData.inventory?.totalSoldStock)} units
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', padding: '0.6rem 0.75rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', fontSize: '0.75rem', color: '#6ee7b7' }}>
                  Analytics queries are strictly <strong>READ-ONLY</strong> and preserve current inventory counts.
                </div>
              </div>
            </div>

            {/* 6. CUSTOMER & USER METRICS */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#c084fc' }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Customer & User Account Analytics
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Registered platform account distribution across security roles.
                  </p>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', color: '#6ee7b7' }}>
                  Privacy Compliant: Zero password hashes, JWTs, or billing secrets exposed.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Registered Customers</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c084fc', margin: '0.35rem 0' }}>
                    {formatNumber(analyticsData.customers?.totalCustomers)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ROLE: CUSTOMER buyers</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Administrator Accounts</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8', margin: '0.35rem 0' }}>
                    {formatNumber(analyticsData.customers?.totalAdmins)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ROLE: ADMIN operators</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Platform Accounts</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: '0.35rem 0' }}>
                    {formatNumber(analyticsData.customers?.totalUsers)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>All registered credentials</div>
                </div>
              </div>
            </div>

            {/* 7. TOP SELLING PRODUCTS TABLE */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fbbf24' }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Top Selling Products
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Aggregated from completed non-cancelled order line items.
                </p>
              </div>

              {(!analyticsData.topProducts || analyticsData.topProducts.length === 0) ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '8px', border: '1px dashed var(--card-border)' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>No top-selling product data available yet.</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Products will rank here automatically as customer orders are recorded.</span>
                </div>
              ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Rank</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Product</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Units Sold</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topProducts.map((p) => (
                        <tr 
                          key={p.productId} 
                          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              background: p.rank === 1 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : (p.rank === 2 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : (p.rank === 3 ? 'linear-gradient(135deg, #b45309, #78350f)' : 'rgba(255, 255, 255, 0.06)')),
                              color: 'white'
                            }}>
                              #{p.rank}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {p.imageUrl ? (
                                <img 
                                  src={p.imageUrl} 
                                  alt={p.productName} 
                                  style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px', background: '#1e293b' }} 
                                />
                              ) : (
                                <div style={{ width: '38px', height: '38px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                                </div>
                              )}
                              <div style={{ fontWeight: 600, color: 'white' }}>
                                {p.productName}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {(p.category || 'N/A').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700, color: 'white' }}>
                            {formatNumber(p.quantitySold)}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                            {formatCurrency(p.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
