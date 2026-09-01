import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import ProductCatalog from './components/ProductCatalog';
import ProductDetails from './components/ProductDetails';
import AuthModal from './components/AuthModal';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import AddressPage from './pages/AddressPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import { cartService } from './services/cartService';
import { wishlistService } from './services/wishlistService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Helper utility to parse current window location pathname
const getRouteFromUrl = () => {
  const path = window.location.pathname;
  if (path.startsWith('/products/')) {
    const idStr = path.split('/products/')[1];
    const id = parseInt(idStr, 10);
    if (!isNaN(id)) {
      return { page: 'details', productId: id };
    }
  }
  if (path === '/diagnostics') {
    return { page: 'diagnostics' };
  }
  if (path === '/cart') {
    return { page: 'cart' };
  }
  if (path === '/wishlist') {
    return { page: 'wishlist' };
  }
  if (path === '/addresses') {
    return { page: 'addresses' };
  }
  if (path === '/checkout') {
    return { page: 'checkout' };
  }
  if (path === '/orders') {
    return { page: 'orders' };
  }
  if (path.startsWith('/orders/')) {
    const idStr = path.split('/orders/')[1];
    const id = parseInt(idStr, 10);
    if (!isNaN(id)) {
      return { page: 'order-details', orderId: id };
    }
  }
  return { page: 'marketplace' };
};

export default function App() {
  const [backendStatus, setBackendStatus] = useState('CHECKING');
  const [backendMsg, setBackendMsg] = useState('Initializing health check...');
  const [dbStatus, setDbStatus] = useState('CHECKING');
  const [dbMsg, setDbMsg] = useState('Initializing database connection check...');
  const [route, setRoute] = useState(getRouteFromUrl());

  // Auth, Cart & Wishlist State
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Handle popstate events for backward/forward browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRouteFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync cart count when user logs in or cart changes
  useEffect(() => {
    if (token) {
      cartService.getCart()
        .then(data => {
          const count = data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          setCartCount(count);
        })
        .catch(err => {
          console.error('Error fetching cart count:', err);
          if (err.response && err.response.status === 401) {
            handleLogout();
          }
        });
    } else {
      setCartCount(0);
    }
  }, [token]);

  // Sync wishlist when user logs in or token changes
  useEffect(() => {
    if (token) {
      wishlistService.getWishlist()
        .then(data => {
          setWishlistItems(data.items || []);
          setWishlistCount(data.items?.length || 0);
        })
        .catch(err => {
          console.error('Error fetching wishlist count:', err);
        });
    } else {
      setWishlistItems([]);
      setWishlistCount(0);
    }
  }, [token]);

  // Route guard: if trying to access cart, wishlist, addresses, checkout, or orders while logged out, redirect and open login
  useEffect(() => {
    if ((route.page === 'cart' || route.page === 'wishlist' || route.page === 'addresses' || route.page === 'checkout' || route.page === 'orders' || route.page === 'order-details') && !token) {
      navigateTo('/');
      setIsAuthModalOpen(true);
    }
  }, [route, token]);

  // Central navigation dispatcher
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setRoute(getRouteFromUrl());
  };

  const handleAuthSuccess = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    showToast(`Logged in successfully as ${userData.name}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setCartCount(0);
    setWishlistItems([]);
    setWishlistCount(0);
    showToast('Logged out successfully.');
    navigateTo('/');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const runDiagnostics = async () => {
    setBackendStatus('CHECKING');
    setBackendMsg('Pinging backend server...');
    setDbStatus('CHECKING');
    setDbMsg('Pinging MySQL database...');

    // 1. Check Backend Health
    try {
      const response = await axios.get(`${API_URL}/api/health`);
      if (response.data.status === 'UP') {
        setBackendStatus('UP');
        setBackendMsg(response.data.message || 'Server is responsive.');
      } else {
        setBackendStatus('DOWN');
        setBackendMsg('Backend returned non-UP status.');
      }
    } catch (err) {
      setBackendStatus('DOWN');
      setBackendMsg(
        err.response?.data?.message || err.message || 'Cannot reach the backend server. Is it running?'
      );
    }

    // 2. Check Database Health
    try {
      const response = await axios.get(`${API_URL}/api/health/db`);
      if (response.data.status === 'UP') {
        setDbStatus('UP');
        setDbMsg(response.data.message || 'Connected to MySQL successfully.');
      } else {
        setDbStatus('DOWN');
        setDbMsg(response.data.message || 'Database ping returned non-UP status.');
      }
    } catch (err) {
      setDbStatus('DOWN');
      setDbMsg(
        err.response?.data?.message || err.message || 'Failed to establish connection to database via backend.'
      );
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  // Sync nav tab active view highlighting
  const currentTab = route.page === 'diagnostics' ? 'diagnostics' : 'marketplace';

  const handleTabChange = (tab) => {
    if (tab === 'marketplace') {
      navigateTo('/');
    } else if (tab === 'diagnostics') {
      navigateTo('/diagnostics');
    }
  };

  return (
    <main style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* BACKGROUND DECORATIVE GLOW SPOTS */}
      <div className="glow-spot-1"></div>
      <div className="glow-spot-2"></div>

      {/* STICKY TOP NAVIGATION */}
      <Navbar 
        activeTab={currentTab} 
        onTabChange={handleTabChange} 
        backendStatus={backendStatus} 
        dbStatus={dbStatus} 
        onRefreshStatus={runDiagnostics} 
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        user={user}
        onAuthTrigger={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onCartClick={() => navigateTo('/cart')}
        onWishlistClick={() => navigateTo('/wishlist')}
        onAddressesClick={() => navigateTo('/addresses')}
        onOrdersClick={() => navigateTo('/orders')}
      />

      {/* DYNAMIC CONTENT ROUTING AREA */}
      <div style={{ padding: '2rem 0', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {route.page === 'marketplace' && (
          <ProductCatalog 
            apiUrl={API_URL} 
            onProductClick={(id) => navigateTo(`/products/${id}`)}
            token={token}
            onAuthTrigger={() => setIsAuthModalOpen(true)}
            onCartCountChange={(count) => setCartCount(count)}
            onShowToast={showToast}
            wishlistItems={wishlistItems}
            onWishlistCountChange={(count) => setWishlistCount(count)}
            onWishlistItemsChange={(items) => setWishlistItems(items)}
          />
        )}
        
        {route.page === 'details' && (
          <ProductDetails 
            productId={route.productId} 
            apiUrl={API_URL} 
            onBack={() => navigateTo('/')}
            token={token}
            onAuthTrigger={() => setIsAuthModalOpen(true)}
            onCartCountChange={(count) => setCartCount(count)}
            onShowToast={showToast}
            wishlistItems={wishlistItems}
            onWishlistCountChange={(count) => setWishlistCount(count)}
            onWishlistItemsChange={(items) => setWishlistItems(items)}
          />
        )}

        {route.page === 'cart' && token && (
          <CartPage 
            onBack={() => navigateTo('/')}
            onProductClick={(id) => navigateTo(`/products/${id}`)}
            onCartCountChange={(count) => setCartCount(count)}
            onManageAddresses={() => navigateTo('/addresses')}
            onCheckout={() => navigateTo('/checkout')}
          />
        )}

        {route.page === 'wishlist' && token && (
          <WishlistPage 
            onBack={() => navigateTo('/')}
            onProductClick={(id) => navigateTo(`/products/${id}`)}
            onCartCountChange={(count) => setCartCount(count)}
            onShowToast={showToast}
            onWishlistCountChange={(count) => setWishlistCount(count)}
          />
        )}

        {route.page === 'addresses' && token && (
          <AddressPage 
            onBack={() => navigateTo('/')}
            onShowToast={showToast}
          />
        )}

        {route.page === 'checkout' && token && (
          <CheckoutPage 
            onBack={() => navigateTo('/cart')}
            onShowToast={showToast}
            navigateTo={navigateTo}
          />
        )}

        {route.page === 'orders' && token && (
          <MyOrdersPage 
            navigateTo={navigateTo}
            onShowToast={showToast}
          />
        )}

        {route.page === 'order-details' && token && (
          <OrderDetailsPage 
            orderId={route.orderId}
            navigateTo={navigateTo}
            onShowToast={showToast}
          />
        )}
        
        {route.page === 'diagnostics' && (
          <div className="container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', margin: '2rem 0' }}>
              <h1>Diagnostics Portal</h1>
              <p className="subtitle">Phase 1A Diagnostics & Core Connectivity</p>

              <div className="status-list">
                {/* Backend Status */}
                <div className="status-item">
                  <div className="status-label">
                    <span className="status-title">Backend API Connection</span>
                    <span className="status-desc">{backendMsg}</span>
                  </div>
                  <span className={`status-badge ${backendStatus.toLowerCase()}`}>
                    {backendStatus}
                  </span>
                </div>

                {/* Database Status */}
                <div className="status-item">
                  <div className="status-label">
                    <span className="status-title">MySQL Database Connection</span>
                    <span className="status-desc">{dbMsg}</span>
                  </div>
                  <span className={`status-badge ${dbStatus.toLowerCase()}`}>
                    {dbStatus}
                  </span>
                </div>

              </div>

              <button 
                className="btn" 
                onClick={runDiagnostics} 
                disabled={backendStatus === 'CHECKING' || dbStatus === 'CHECKING'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                Run Diagnostics Check
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal Overlay */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        apiUrl={API_URL}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="cart-toast">
          <svg className="cart-toast-success-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
