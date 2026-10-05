import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';

export default function AdminDashboardPage({ user: propUser, token: propToken, navigateTo, onShowToast }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Resolve user and token from props, falling back to localStorage
  const user = propUser || JSON.parse(localStorage.getItem('user')) || null;
  const token = propToken || localStorage.getItem('token') || null;

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
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
      // 1. Verify admin session with backend GET /api/admin/me
      const profile = await adminService.getAdminMe(token);
      setAdminProfile(profile);

      // 2. Fetch dashboard statistics
      const data = await adminService.getDashboardSummary(token);
      setDashboardData(data);
      setLastUpdated(new Date());
      if (isRefresh && onShowToast) {
        onShowToast('Dashboard statistics updated successfully');
      }
    } catch (err) {
      console.error('Failed to fetch admin dashboard data:', err);
      if (err.response?.status === 403) {
        setError('FORBIDDEN');
      } else if (err.response?.status === 401) {
        setError('UNAUTHORIZED');
      } else {
        setError(err.response?.data?.message || err.message || 'Unable to load dashboard data from backend server.');
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
      fetchDashboardData();
    } else {
      setLoading(false);
      setError('UNAUTHORIZED');
    }
  }, [token, user?.role, fetchDashboardData]);

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
            You must be logged in with an Administrator account to access the ForgeAI Admin Dashboard.
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
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#ef4444' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
          </div>
          <h2 style={{ color: 'white', marginBottom: '0.75rem', fontWeight: 700 }}>403 — Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
            You do not have administrative privileges to view this portal. The Admin Dashboard is restricted exclusively to authorized administrators.
          </p>
          <div style={{ display: 'inline-block', padding: '0.35rem 0.85rem', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.75rem' }}>
            Current Account Role: <strong style={{ color: '#94a3b8' }}>{user?.role || 'CUSTOMER'}</strong>
          </div>
          <div>
            <button className="btn btn-primary" onClick={() => navigateTo('/')}>
              Return to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

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
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
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
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => navigateTo ? navigateTo('/admin/products') : setActiveTab('products')}
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
            title="Inventory adjustment APIs are active from Phase 4A; dashboard overview is shown below"
            disabled
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <span>Inventory</span>
            <span className="admin-nav-tag future">Phase 4A</span>
          </button>

          <button 
            className="admin-nav-item disabled" 
            title="Order management UI will be available in Phase 4E"
            disabled
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span>Orders</span>
            <span className="admin-nav-tag future">Phase 4E</span>
          </button>

          <button 
            className="admin-nav-item disabled" 
            title="Customer management UI will be available in Phase 4F"
            disabled
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Customers</span>
            <span className="admin-nav-tag future">Phase 4F</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button 
            className="admin-back-btn" 
            onClick={() => navigateTo('/')}
            title="Return to ForgeAI Customer Marketplace"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Store</span>
          </button>

          <div className="admin-user-card">
            <div className="admin-avatar">
              {(adminProfile?.name || user?.name) ? (adminProfile?.name || user?.name).charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="admin-user-info">
              <div className="admin-user-name">{adminProfile?.name || user?.name || 'Administrator'}</div>
              <div className="admin-user-email">{adminProfile?.email || user?.email || 'admin@forgeai.com'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="admin-content">
        {/* Top Header */}
        <header className="admin-header glass-panel">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">
              Real-time database statistics for products, inventory, orders, and customer activity.
            </p>
          </div>

          <div className="admin-header-actions">
            {lastUpdated && (
              <span className="admin-last-sync">
                Synced at {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button 
              className={`btn admin-refresh-btn ${refreshing ? 'spinning' : ''}`}
              onClick={() => fetchDashboardData(true)}
              disabled={loading || refreshing}
              title="Refresh database statistics"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'spin-icon' : ''}>
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        {/* Error State */}
        {error && error !== 'FORBIDDEN' && error !== 'UNAUTHORIZED' && (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: '1.5rem' }}>
            <div style={{ color: '#ef4444', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Unable to load dashboard</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </p>
            <button className="btn btn-primary" onClick={() => fetchDashboardData(false)}>
              Retry
            </button>
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading && (
          <div className="admin-dashboard-loading">
            {/* 5 Skeleton Metric Cards */}
            <div className="admin-summary-grid">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="glass-panel admin-metric-card skeleton-card">
                  <div className="skeleton-line" style={{ width: '40%', height: '14px', marginBottom: '12px' }}></div>
                  <div className="skeleton-line" style={{ width: '70%', height: '32px', marginBottom: '8px' }}></div>
                  <div className="skeleton-line" style={{ width: '55%', height: '12px' }}></div>
                </div>
              ))}
            </div>

            <div className="admin-grid-2-col" style={{ marginTop: '1.5rem' }}>
              <div className="glass-panel skeleton-card" style={{ height: '220px' }}>
                <div className="skeleton-line" style={{ width: '40%', height: '18px', marginBottom: '20px' }}></div>
                <div className="skeleton-line" style={{ width: '90%', height: '28px', marginBottom: '12px' }}></div>
                <div className="skeleton-line" style={{ width: '60%', height: '20px' }}></div>
              </div>
              <div className="glass-panel skeleton-card" style={{ height: '220px' }}>
                <div className="skeleton-line" style={{ width: '40%', height: '18px', marginBottom: '20px' }}></div>
                <div className="skeleton-line" style={{ width: '90%', height: '28px', marginBottom: '12px' }}></div>
                <div className="skeleton-line" style={{ width: '60%', height: '20px' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Loaded Data View */}
        {!loading && dashboardData && (
          <div className="admin-dashboard-content">
            {/* 5 Summary Cards */}
            <section className="admin-summary-grid">
              {/* Card 1: Total Products */}
              <div className="glass-panel admin-metric-card">
                <div className="admin-metric-top">
                  <span className="admin-metric-label">Total Products</span>
                  <div className="admin-metric-icon primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                </div>
                <div className="admin-metric-value">{dashboardData.totalProducts}</div>
                <div className="admin-metric-sub">
                  <span className="pill-dot active"></span>
                  <span>{dashboardData.activeProducts} active</span>
                  {dashboardData.inactiveProducts > 0 && (
                    <span style={{ color: 'var(--text-muted)' }}> • {dashboardData.inactiveProducts} inactive</span>
                  )}
                </div>
              </div>

              {/* Card 2: Total Customers */}
              <div className="glass-panel admin-metric-card">
                <div className="admin-metric-top">
                  <span className="admin-metric-label">Total Customers</span>
                  <div className="admin-metric-icon success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                </div>
                <div className="admin-metric-value">{dashboardData.totalCustomers}</div>
                <div className="admin-metric-sub">
                  <span>Registered customer accounts</span>
                </div>
              </div>

              {/* Card 3: Total Orders */}
              <div className="glass-panel admin-metric-card">
                <div className="admin-metric-top">
                  <span className="admin-metric-label">Total Orders</span>
                  <div className="admin-metric-icon indigo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </div>
                </div>
                <div className="admin-metric-value">{dashboardData.totalOrders}</div>
                <div className="admin-metric-sub">
                  <span>All-time lifetime orders</span>
                </div>
              </div>

              {/* Card 4: Total Revenue */}
              <div className="glass-panel admin-metric-card">
                <div className="admin-metric-top">
                  <span className="admin-metric-label">Total Revenue</span>
                  <div className="admin-metric-icon green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                </div>
                <div className="admin-metric-value" style={{ color: '#10b981' }}>
                  {formatCurrency(dashboardData.totalRevenue)}
                </div>
                <div className="admin-metric-sub">
                  <span>Valid completed orders</span>
                </div>
              </div>

              {/* Card 5: Low Stock Products */}
              <div className="glass-panel admin-metric-card">
                <div className="admin-metric-top">
                  <span className="admin-metric-label">Low Stock</span>
                  <div className={`admin-metric-icon ${dashboardData.lowStockProducts > 0 ? 'warning' : 'neutral'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                </div>
                <div className="admin-metric-value" style={{ color: dashboardData.lowStockProducts > 0 ? '#f59e0b' : 'white' }}>
                  {dashboardData.lowStockProducts}
                </div>
                <div className="admin-metric-sub">
                  {dashboardData.lowStockProducts > 0 ? (
                    <span style={{ color: '#f59e0b' }}>Requires replenishment</span>
                  ) : (
                    <span style={{ color: '#10b981' }}>Inventory healthy</span>
                  )}
                </div>
              </div>
            </section>

            {/* Inventory Overview & Order Overview Cards */}
            <section className="admin-grid-2-col" style={{ marginTop: '1.5rem' }}>
              {/* Inventory Overview Card */}
              <div className="glass-panel admin-section-card">
                <div className="admin-card-header">
                  <div className="admin-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    <span>Inventory Overview (Phase 4A)</span>
                  </div>
                </div>

                <div className="inventory-stats-row">
                  <div className="inventory-stat-box">
                    <div className="inventory-stat-num" style={{ color: '#10b981' }}>
                      {dashboardData.totalAvailableStock}
                    </div>
                    <div className="inventory-stat-title">Available Stock</div>
                  </div>
                  <div className="inventory-stat-box">
                    <div className="inventory-stat-num" style={{ color: '#6366f1' }}>
                      {dashboardData.totalReservedStock}
                    </div>
                    <div className="inventory-stat-title">Reserved Stock</div>
                  </div>
                  <div className="inventory-stat-box">
                    <div className="inventory-stat-num" style={{ color: '#8b5cf6' }}>
                      {dashboardData.totalSoldStock}
                    </div>
                    <div className="inventory-stat-title">Sold Stock</div>
                  </div>
                </div>

                <div className="inventory-bar-container">
                  <div className="inventory-bar-labels">
                    <span>Stock Distribution</span>
                    <span>
                      {dashboardData.totalAvailableStock + dashboardData.totalReservedStock + dashboardData.totalSoldStock} total units tracked
                    </span>
                  </div>
                  <div className="inventory-progress-bar">
                    <div 
                      className="inv-bar-segment available"
                      style={{ 
                        width: `${((dashboardData.totalAvailableStock || 0) / Math.max(1, (dashboardData.totalAvailableStock || 0) + (dashboardData.totalReservedStock || 0) + (dashboardData.totalSoldStock || 0))) * 100}%` 
                      }}
                      title={`Available: ${dashboardData.totalAvailableStock}`}
                    ></div>
                    <div 
                      className="inv-bar-segment reserved"
                      style={{ 
                        width: `${((dashboardData.totalReservedStock || 0) / Math.max(1, (dashboardData.totalAvailableStock || 0) + (dashboardData.totalReservedStock || 0) + (dashboardData.totalSoldStock || 0))) * 100}%` 
                      }}
                      title={`Reserved: ${dashboardData.totalReservedStock}`}
                    ></div>
                    <div 
                      className="inv-bar-segment sold"
                      style={{ 
                        width: `${((dashboardData.totalSoldStock || 0) / Math.max(1, (dashboardData.totalAvailableStock || 0) + (dashboardData.totalReservedStock || 0) + (dashboardData.totalSoldStock || 0))) * 100}%` 
                      }}
                      title={`Sold: ${dashboardData.totalSoldStock}`}
                    ></div>
                  </div>
                  <div className="inventory-legend">
                    <span className="legend-item"><span className="legend-dot available"></span> Available</span>
                    <span className="legend-item"><span className="legend-dot reserved"></span> Reserved</span>
                    <span className="legend-item"><span className="legend-dot sold"></span> Sold</span>
                  </div>
                </div>
              </div>

              {/* Order Status Breakdown Card */}
              <div className="glass-panel admin-section-card">
                <div className="admin-card-header">
                  <div className="admin-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#8b5cf6' }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span>Order Status Overview</span>
                  </div>
                  <span className="admin-card-count">{dashboardData.orderStatusCounts?.total || 0} total</span>
                </div>

                <div className="order-status-grid">
                  <div className="order-status-chip">
                    <span className="status-chip-dot placed"></span>
                    <span className="status-chip-name">Placed</span>
                    <span className="status-chip-val">{dashboardData.orderStatusCounts?.placed || 0}</span>
                  </div>
                  <div className="order-status-chip">
                    <span className="status-chip-dot confirmed"></span>
                    <span className="status-chip-name">Confirmed</span>
                    <span className="status-chip-val">{dashboardData.orderStatusCounts?.confirmed || 0}</span>
                  </div>
                  <div className="order-status-chip">
                    <span className="status-chip-dot processing"></span>
                    <span className="status-chip-name">Processing</span>
                    <span className="status-chip-val">{dashboardData.orderStatusCounts?.processing || 0}</span>
                  </div>
                  <div className="order-status-chip">
                    <span className="status-chip-dot shipped"></span>
                    <span className="status-chip-name">Shipped</span>
                    <span className="status-chip-val">{dashboardData.orderStatusCounts?.shipped || 0}</span>
                  </div>
                  <div className="order-status-chip">
                    <span className="status-chip-dot out-delivery"></span>
                    <span className="status-chip-name">Out for Delivery</span>
                    <span className="status-chip-val">{dashboardData.orderStatusCounts?.outForDelivery || 0}</span>
                  </div>
                  <div className="order-status-chip">
                    <span className="status-chip-dot delivered"></span>
                    <span className="status-chip-name">Delivered</span>
                    <span className="status-chip-val">{dashboardData.orderStatusCounts?.delivered || 0}</span>
                  </div>
                  <div className="order-status-chip">
                    <span className="status-chip-dot cancelled"></span>
                    <span className="status-chip-name">Cancelled</span>
                    <span className="status-chip-val">{dashboardData.orderStatusCounts?.cancelled || 0}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Row: Low Stock Alerts + Recent Activity */}
            <section className="admin-grid-2-col" style={{ marginTop: '1.5rem' }}>
              {/* Low Stock Alerts */}
              <div className="glass-panel admin-section-card">
                <div className="admin-card-header">
                  <div className="admin-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span>Low Stock Alerts</span>
                  </div>
                  {dashboardData.lowStockItems?.length > 0 && (
                    <span className="low-stock-pill-badge">{dashboardData.lowStockItems.length} alerts</span>
                  )}
                </div>

                {(!dashboardData.lowStockItems || dashboardData.lowStockItems.length === 0) ? (
                  <div className="admin-empty-section">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981', margin: '0 auto 0.75rem' }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No low-stock products.</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>All inventory levels are above their configured replenishment thresholds.</p>
                  </div>
                ) : (
                  <div className="low-stock-list">
                    {dashboardData.lowStockItems.map((item) => (
                      <div key={item.productId} className="low-stock-item">
                        <div className="low-stock-info">
                          <div className="low-stock-name">{item.productName}</div>
                          <div className="low-stock-meta">
                            {item.sku && <span>SKU: {item.sku}</span>}
                            {item.category && <span>• {item.category}</span>}
                          </div>
                        </div>
                        <div className="low-stock-count-badge">
                          <span className="count-num" style={{ color: item.availableStock <= 0 ? '#ef4444' : '#f59e0b' }}>
                            {item.availableStock}
                          </span>
                          <span className="count-threshold">/ {item.lowStockThreshold} threshold</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity Feed */}
              <div className="glass-panel admin-section-card">
                <div className="admin-card-header">
                  <div className="admin-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <span>Recent Activity</span>
                  </div>
                  <span className="admin-card-count">Latest {dashboardData.recentActivity?.length || 0} events</span>
                </div>

                {(!dashboardData.recentActivity || dashboardData.recentActivity.length === 0) ? (
                  <div className="admin-empty-section">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p style={{ color: 'var(--text-secondary)' }}>No recent activity recorded.</p>
                  </div>
                ) : (
                  <div className="admin-activity-list">
                    {dashboardData.recentActivity.map((act) => (
                      <div key={act.id} className="admin-activity-item">
                        <div className={`activity-type-badge ${act.badgeType?.toLowerCase() || 'primary'}`}>
                          {act.type}
                        </div>
                        <div className="activity-details">
                          <div className="activity-title">{act.title}</div>
                          <div className="activity-desc">{act.description}</div>
                        </div>
                        <div className="activity-time">
                          {formatDateTime(act.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
