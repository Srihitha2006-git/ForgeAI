import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../services/adminService';

const CATEGORY_MAP = {
  OFFICE_ENTERPRISE: 'Office & Enterprise',
  KITCHEN_UTENSILS: 'Kitchen Utensils',
  FURNITURE: 'Furniture'
};

const CATEGORIES = [
  { value: 'OFFICE_ENTERPRISE', label: 'Office & Enterprise' },
  { value: 'KITCHEN_UTENSILS', label: 'Kitchen Utensils' },
  { value: 'FURNITURE', label: 'Furniture' }
];

export default function AdminProductsPage({ user: propUser, token: propToken, navigateTo, onShowToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State (used for both Add and Edit)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    category: 'OFFICE_ENTERPRISE',
    brand: '',
    sku: '',
    imageUrl: '',
    active: true
  });

  // Resolve user and token
  const user = propUser || JSON.parse(localStorage.getItem('user')) || null;
  const token = propToken || localStorage.getItem('token') || null;

  const fetchProducts = useCallback(async (isRefresh = false) => {
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

      // 2. Fetch all products
      const data = await adminService.getAdminProducts(token);
      setProducts(data || []);
      if (isRefresh && onShowToast) {
        onShowToast('Product catalog refreshed successfully');
      }
    } catch (err) {
      console.error('Failed to fetch admin products:', err);
      if (err.response?.status === 403) {
        setError('FORBIDDEN');
      } else if (err.response?.status === 401) {
        setError('UNAUTHORIZED');
      } else {
        setError(err.response?.data?.message || err.message || 'Unable to load products from server.');
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
      fetchProducts();
    } else {
      setLoading(false);
      setError('UNAUTHORIZED');
    }
  }, [token, user?.role, fetchProducts]);

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
            You must be logged in with an Administrator account to access the ForgeAI Admin Products Management.
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

  // Format Currency
  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  // Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search filter (Name, SKU, Category, Brand)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesSku = p.sku?.toLowerCase().includes(query);
        const matchesCategory = p.category?.toLowerCase().includes(query) ||
          CATEGORY_MAP[p.category]?.toLowerCase().includes(query);
        const matchesBrand = p.brand?.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesCategory && !matchesBrand) {
          return false;
        }
      }

      // 2. Category filter
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) {
        return false;
      }

      // 3. Status filter
      if (statusFilter === 'ACTIVE' && !p.active) return false;
      if (statusFilter === 'INACTIVE' && p.active) return false;

      // 4. Stock filter
      if (stockFilter === 'IN_STOCK' && (p.stockQuantity === null || p.stockQuantity <= 10)) return false;
      if (stockFilter === 'LOW_STOCK' && (p.stockQuantity === null || p.stockQuantity <= 0 || p.stockQuantity > 10)) return false;
      if (stockFilter === 'OUT_OF_STOCK' && p.stockQuantity > 0) return false;

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'price_asc':
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case 'price_desc':
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case 'stock_asc':
          return (a.stockQuantity || 0) - (b.stockQuantity || 0);
        case 'stock_desc':
          return (b.stockQuantity || 0) - (a.stockQuantity || 0);
        case 'oldest':
          return a.id - b.id;
        case 'newest':
        default:
          return b.id - a.id;
      }
    });
  }, [products, searchTerm, categoryFilter, statusFilter, stockFilter, sortBy]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.active).length;
    const lowStock = products.filter(p => p.stockQuantity !== null && p.stockQuantity > 0 && p.stockQuantity <= 10).length;
    const outOfStock = products.filter(p => p.stockQuantity === null || p.stockQuantity <= 0).length;
    return { total, active, lowStock, outOfStock };
  }, [products]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stockQuantity: '',
      category: 'OFFICE_ENTERPRISE',
      brand: '',
      sku: '',
      imageUrl: '',
      active: true
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price !== null && product.price !== undefined ? product.price.toString() : '',
      stockQuantity: product.stockQuantity !== null && product.stockQuantity !== undefined ? product.stockQuantity.toString() : '',
      category: product.category || 'OFFICE_ENTERPRISE',
      brand: product.brand || '',
      sku: product.sku || '',
      imageUrl: product.imageUrl || '',
      active: product.active !== undefined ? product.active : true
    });
    setFormError('');
  };

  // Save Add Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    const numPrice = parseFloat(formData.price);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError('Price must be a valid non-negative number.');
      return;
    }
    const numStock = parseInt(formData.stockQuantity, 10);
    if (isNaN(numStock) || numStock < 0) {
      setFormError('Stock quantity must be a valid non-negative integer.');
      return;
    }
    if (!formData.category) {
      setFormError('Please select a valid category.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: numPrice,
        stockQuantity: numStock,
        category: formData.category,
        brand: formData.brand.trim() || null,
        sku: formData.sku.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        active: formData.active
      };

      const created = await adminService.createProduct(payload, token);
      setProducts(prev => [created, ...prev]);
      setIsAddModalOpen(false);
      if (onShowToast) {
        onShowToast(`Product "${created.name}" created successfully`);
      }
    } catch (err) {
      console.error('Failed to create product:', err);
      setFormError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create product.');
    } finally {
      setFormLoading(false);
    }
  };

  // Save Edit Product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setFormError('');

    // Validation
    if (!formData.name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    const numPrice = parseFloat(formData.price);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError('Price must be a valid non-negative number.');
      return;
    }
    const numStock = parseInt(formData.stockQuantity, 10);
    if (isNaN(numStock) || numStock < 0) {
      setFormError('Stock quantity must be a valid non-negative integer.');
      return;
    }
    if (!formData.category) {
      setFormError('Please select a valid category.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: numPrice,
        stockQuantity: numStock,
        category: formData.category,
        brand: formData.brand.trim() || null,
        sku: formData.sku.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        active: formData.active
      };

      const updated = await adminService.updateProduct(editingProduct.id, payload, token);
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingProduct(null);
      if (onShowToast) {
        onShowToast(`Product "${updated.name}" updated successfully`);
      }
    } catch (err) {
      console.error('Failed to update product:', err);
      setFormError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update product.');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (product) => {
    const newStatus = !product.active;
    try {
      const updated = await adminService.updateProductStatus(product.id, newStatus, token);
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      if (onShowToast) {
        onShowToast(`Product "${product.name}" ${newStatus ? 'activated' : 'deactivated'}`);
      }
    } catch (err) {
      console.error('Failed to toggle product status:', err);
      if (onShowToast) {
        onShowToast(err.response?.data?.error || 'Failed to update product status');
      }
    }
  };

  // Safe Delete Product
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setFormLoading(true);
    try {
      const result = await adminService.deleteProduct(deletingProduct.id, token);
      
      if (result.deactivated) {
        // Soft-deactivated to preserve orders
        setProducts(prev => prev.map(p => p.id === deletingProduct.id ? { ...p, active: false } : p));
        if (onShowToast) {
          onShowToast(result.message || 'Product has order history and was safely deactivated.');
        }
      } else {
        // Permanently deleted
        setProducts(prev => prev.filter(p => p.id !== deletingProduct.id));
        if (onShowToast) {
          onShowToast(result.message || 'Product deleted successfully.');
        }
      }
      setDeletingProduct(null);
    } catch (err) {
      console.error('Failed to delete product:', err);
      if (onShowToast) {
        onShowToast(err.response?.data?.error || err.response?.data?.message || 'Failed to delete product.');
      }
    } finally {
      setFormLoading(false);
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
            className="admin-nav-item active" 
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
        {/* Top Header */}
        <header className="glass-panel admin-header" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', margin: 0 }}>
                Products Management
              </h1>
              <span className="admin-pill-badge active" style={{ fontSize: '0.75rem' }}>Phase 4D</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Search, filter, create, edit, and safely manage product catalog items backed by MySQL database.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="admin-refresh-btn"
              onClick={() => fetchProducts(true)}
              disabled={refreshing || loading}
              title="Refresh Products"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
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

            <button
              id="admin-add-product-btn"
              className="btn"
              onClick={handleOpenAddModal}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Product</span>
            </button>
          </div>
        </header>

        {/* KPI Summary Cards */}
        <section className="admin-grid-4-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Products</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>{stats.total}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Products</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{stats.active}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Low Stock (≤10)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{stats.lowStock}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Out of Stock</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>{stats.outOfStock}</div>
          </div>
        </section>

        {/* Controls Bar: Search, Filters & Sorting */}
        <section className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
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
              id="admin-product-search-input"
              type="text"
              className="search-input"
              placeholder="Search by name, SKU, category, brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem', height: '42px', fontSize: '0.875rem' }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Category Filter */}
            <select
              id="admin-filter-category"
              className="search-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ height: '42px', padding: '0 0.85rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--card-bg)' }}
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              id="admin-filter-status"
              className="search-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: '42px', padding: '0 0.85rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--card-bg)' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Stock Filter */}
            <select
              id="admin-filter-stock"
              className="search-input"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              style={{ height: '42px', padding: '0 0.85rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--card-bg)' }}
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN_STOCK">In Stock (&gt;10)</option>
              <option value="LOW_STOCK">Low Stock (1-10)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            </select>

            {/* Sort Dropdown */}
            <select
              id="admin-sort-products"
              className="search-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ height: '42px', padding: '0 0.85rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--card-bg)' }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
            </select>
          </div>
        </section>

        {/* Product List Content */}
        {loading ? (
          <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', borderRadius: '12px' }}>
            <div className="spinner" style={{ margin: '0 auto 1.25rem', width: '36px', height: '36px' }}></div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading ForgeAI products from MySQL database...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '12px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontWeight: 600 }}>No products found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || stockFilter !== 'ALL'
                ? 'No products match your current search and filter criteria. Try resetting filters.'
                : 'There are currently no products in the catalog. Click "Add Product" to create one.'}
            </p>
            {(searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || stockFilter !== 'ALL') ? (
              <button
                className="btn"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('ALL');
                  setStatusFilter('ALL');
                  setStockFilter('ALL');
                }}
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                Reset Filters
              </button>
            ) : (
              <button className="btn" onClick={handleOpenAddModal}>
                Create First Product
              </button>
            )}
          </div>
        ) : (
          <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>SKU</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Price</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Stock</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Updated</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isLowStock = p.stockQuantity !== null && p.stockQuantity > 0 && p.stockQuantity <= 10;
                    const isOutOfStock = p.stockQuantity === null || p.stockQuantity <= 0;

                    return (
                      <tr 
                        key={p.id} 
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Product Info */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--card-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                              ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                  <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.2rem' }}>{p.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                                <span>ID: #{p.id}</span>
                                {p.brand && <span>• {p.brand}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.825rem' }}>
                          {p.sku || '—'}
                        </td>

                        {/* Category */}
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: 500 }}>
                            {CATEGORY_MAP[p.category] || p.category || 'General'}
                          </span>
                        </td>

                        {/* Price */}
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'white' }}>
                          {formatCurrency(p.price)}
                        </td>

                        {/* Stock */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{
                              display: 'inline-block',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : '#10b981'
                            }}></span>
                            <span style={{ fontWeight: 600, color: isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : 'white' }}>
                              {p.stockQuantity ?? 0}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {isOutOfStock ? '(Out)' : isLowStock ? '(Low)' : 'units'}
                            </span>
                          </div>
                        </td>

                        {/* Status Toggle & Badge */}
                        <td style={{ padding: '1rem' }}>
                          <button
                            onClick={() => handleToggleStatus(p)}
                            title={p.active ? 'Click to deactivate' : 'Click to activate'}
                            style={{
                              border: 'none',
                              background: p.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: p.active ? '#34d399' : '#f87171',
                              border: `1px solid ${p.active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              padding: '0.25rem 0.65rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.active ? '#34d399' : '#f87171' }}></span>
                            <span>{p.active ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>

                        {/* Date */}
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {formatDate(p.updatedAt || p.createdAt)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              title="Edit product"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--card-border)',
                                borderRadius: '6px',
                                padding: '0.35rem 0.6rem',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.8rem',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => setDeletingProduct(p)}
                              title="Delete product"
                              style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '6px',
                                padding: '0.35rem 0.6rem',
                                color: '#f87171',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.8rem',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Count */}
            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Showing {filteredProducts.length} of {products.length} products</span>
              <span>Protected by ForgeAI ADMIN RBAC</span>
            </div>
          </div>
        )}
      </main>

      {/* 3. ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Add New Product</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Create a product record in MySQL and initialize inventory stock.</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', padding: '0.25rem' }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.875rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Product Name */}
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                    Product Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="admin-form-name"
                    type="text"
                    className="search-input"
                    placeholder="e.g. Ergonomic Executive Workstation Desk"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%', height: '42px' }}
                  />
                </div>

                {/* Category & Brand Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      Category <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      id="admin-form-category"
                      className="search-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', background: 'var(--card-bg)' }}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      Brand
                    </label>
                    <input
                      id="admin-form-brand"
                      type="text"
                      className="search-input"
                      placeholder="e.g. ForgeAI Workspace"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>
                </div>

                {/* Price, Stock & SKU Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      Price (₹) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="admin-form-price"
                      type="number"
                      step="0.01"
                      min="0"
                      className="search-input"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      Stock Quantity <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="admin-form-stock"
                      type="number"
                      min="0"
                      step="1"
                      className="search-input"
                      placeholder="10"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      SKU
                    </label>
                    <input
                      id="admin-form-sku"
                      type="text"
                      className="search-input"
                      placeholder="e.g. PRD-OFF-01"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                    Image URL
                  </label>
                  <input
                    id="admin-form-image"
                    type="url"
                    className="search-input"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    style={{ width: '100%', height: '42px' }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                    Description
                  </label>
                  <textarea
                    id="admin-form-description"
                    className="search-input"
                    rows="3"
                    placeholder="Enter detailed description of the product..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', resize: 'vertical' }}
                  ></textarea>
                </div>

                {/* Active Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input
                    id="admin-form-active"
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="admin-form-active" style={{ color: 'white', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>
                    Active (visible to customers in marketplace)
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={formLoading}
                  style={{ background: 'transparent', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.65rem 1.25rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  id="admin-submit-create-product"
                  type="submit"
                  className="btn"
                  disabled={formLoading}
                  style={{ padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {formLoading && <span className="spinner" style={{ width: '16px', height: '16px' }}></span>}
                  <span>{formLoading ? 'Creating...' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Edit Product #{editingProduct.id}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Update existing record values in MySQL without creating duplicates.</p>
              </div>
              <button 
                onClick={() => setEditingProduct(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', padding: '0.25rem' }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.875rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateProduct}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Product Name */}
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                    Product Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="admin-edit-form-name"
                    type="text"
                    className="search-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%', height: '42px' }}
                  />
                </div>

                {/* Category & Brand Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      Category <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      id="admin-edit-form-category"
                      className="search-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', background: 'var(--card-bg)' }}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      Brand
                    </label>
                    <input
                      id="admin-edit-form-brand"
                      type="text"
                      className="search-input"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>
                </div>

                {/* Price, Stock & SKU Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      Price (₹) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="admin-edit-form-price"
                      type="number"
                      step="0.01"
                      min="0"
                      className="search-input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      Stock Quantity <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="admin-edit-form-stock"
                      type="number"
                      min="0"
                      step="1"
                      className="search-input"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      SKU
                    </label>
                    <input
                      id="admin-edit-form-sku"
                      type="text"
                      className="search-input"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      style={{ width: '100%', height: '42px' }}
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                    Image URL
                  </label>
                  <input
                    id="admin-edit-form-image"
                    type="url"
                    className="search-input"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    style={{ width: '100%', height: '42px' }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                    Description
                  </label>
                  <textarea
                    id="admin-edit-form-description"
                    className="search-input"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', resize: 'vertical' }}
                  ></textarea>
                </div>

                {/* Active Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input
                    id="admin-edit-form-active"
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="admin-edit-form-active" style={{ color: 'white', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>
                    Active (visible to customers in marketplace)
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  disabled={formLoading}
                  style={{ background: 'transparent', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.65rem 1.25rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  id="admin-submit-edit-product"
                  type="submit"
                  className="btn"
                  disabled={formLoading}
                  style={{ padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {formLoading && <span className="spinner" style={{ width: '16px', height: '16px' }}></span>}
                  <span>{formLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. SAFE DELETE CONFIRMATION MODAL */}
      {deletingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#ef4444' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>

            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
              Delete Product "{deletingProduct.name}"?
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1rem' }}>
              <strong>Safe Deletion Architecture:</strong> If this product has historical orders, it will be <em>safely deactivated</em> to protect customer order history and foreign-key constraints. If unreferenced, it will be permanently deleted.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={formLoading}
                style={{ background: 'transparent', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.65rem 1.25rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                id="admin-confirm-delete-btn"
                type="button"
                onClick={handleConfirmDelete}
                disabled={formLoading}
                style={{ background: '#ef4444', border: 'none', borderRadius: '8px', padding: '0.65rem 1.5rem', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {formLoading && <span className="spinner" style={{ width: '16px', height: '16px' }}></span>}
                <span>{formLoading ? 'Processing...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
