import React, { useState } from 'react';

export default function Navbar({ 
  activeTab, 
  onTabChange, 
  backendStatus, 
  dbStatus, 
  onRefreshStatus, 
  cartCount = 0, 
  wishlistCount = 0,
  user = null, 
  onAuthTrigger, 
  onLogout, 
  onCartClick,
  onWishlistClick,
  onAddressesClick,
  onOrdersClick
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="navbar-sticky">
      <div className="container navbar-container">
        {/* LEFT: BRAND LOGO */}
        <a href="/" className="navbar-brand" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new Event('popstate')); }}>
          <svg className="navbar-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          ForgeAI
        </a>

        {/* CENTER: NAVIGATION TABS */}
        <div className="navbar-tabs">
          <button 
            className={`navbar-tab ${activeTab === 'marketplace' ? 'active' : ''}`}
            onClick={() => onTabChange('marketplace')}
            aria-label="View Marketplace"
          >
            Marketplace
          </button>
          
          <button 
            className={`navbar-tab ${activeTab === 'diagnostics' ? 'active' : ''}`}
            onClick={() => onTabChange('diagnostics')}
            aria-label="View Diagnostics Portal"
          >
            Diagnostics
          </button>
        </div>

        {/* RIGHT: HEALTH PILLS & ACTION ICONS */}
        <div className="navbar-right">
          {/* Server/DB status pills (clickable to run a refresh) */}
          <div className="navbar-status-group" title="Click to refresh connection status" onClick={onRefreshStatus} style={{ cursor: 'pointer' }}>
            <div className={`navbar-status-pill ${backendStatus.toLowerCase()}`}>
              <span className="status-dot"></span>
              SERVER: {backendStatus}
            </div>
            <div className={`navbar-status-pill ${dbStatus.toLowerCase()}`}>
              <span className="status-dot"></span>
              DATABASE: {dbStatus}
            </div>
          </div>

          {/* Action icons */}
          <div className="navbar-icons">
            {/* Wishlist Icon with badge */}
            <button className="navbar-icon-btn" aria-label="View Wishlist" onClick={onWishlistClick}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="cart-badge" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>{wishlistCount}</span>
              )}
            </button>

            {/* Cart Icon with badge */}
            <button className="navbar-icon-btn" aria-label="View Cart" onClick={onCartClick}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </button>

            {/* Profile Dropdown Trigger */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button 
                className="navbar-icon-btn" 
                aria-label="View Profile" 
                onClick={() => user ? setIsDropdownOpen(!isDropdownOpen) : onAuthTrigger()}
                title={user ? `Signed in as ${user.name}` : 'Login / Register'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={user ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {user && (
                  <span style={{ position: 'absolute', bottom: '0px', right: '0px', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', border: '1.5px solid #0f172a' }}></span>
                )}
              </button>
              
              {user && isDropdownOpen && (
                <div 
                  className="glass-panel" 
                  style={{ 
                    position: 'absolute', 
                    right: 0, 
                    top: 'calc(100% + 12px)', 
                    width: '200px', 
                    padding: '1rem', 
                    zIndex: 100, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.75rem',
                    animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      onWishlistClick();
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      padding: '0.25rem 0',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    My Wishlist ({wishlistCount})
                  </button>

                  <button 
                    onClick={() => {
                      onCartClick();
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      padding: '0.25rem 0',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    My Cart ({cartCount})
                  </button>

                  <button 
                    onClick={() => {
                      onAddressesClick();
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      padding: '0.25rem 0',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    My Addresses
                  </button>

                  <button 
                    onClick={() => {
                      onOrdersClick();
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      padding: '0.25rem 0',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="21 8 21 21 3 21 3 8" />
                      <rect x="1" y="3" width="22" height="5" />
                      <line x1="10" y1="12" x2="14" y2="12" />
                    </svg>
                    My Orders
                  </button>

                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      textAlign: 'left',
                      padding: '0.25rem 0',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
