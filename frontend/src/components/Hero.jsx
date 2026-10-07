import React from 'react';
import cookwareBg from '../assets/cookware-hero.jpg';

export default function Hero({ onShopNow, onExploreProducts }) {
  const handleShopNow = () => {
    if (onShopNow) {
      onShopNow();
    } else {
      const el = document.getElementById('catalog-products-section') || document.querySelector('.product-catalog-grid');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleExplore = () => {
    if (onExploreProducts) {
      onExploreProducts();
    } else {
      const el = document.getElementById('category-filter-section') || document.querySelector('.category-filter-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <section className="hero-banner-section" aria-label="Cookware and Kitchen Essentials Showcase">
      {/* Background Image Container */}
      <div 
        className="hero-bg-media" 
        style={{ backgroundImage: `url(${cookwareBg})` }}
        role="img"
        aria-label="Modern cookware and kitchen products marketplace display"
      >
        {/* Dual-layered subtle dark/neutral overlay for optimal readability */}
        <div className="hero-bg-overlay"></div>
      </div>

      {/* Decorative radial lighting accent */}
      <div className="hero-ambient-glow"></div>

      {/* Hero Foreground Content */}
      <div className="container hero-banner-container">
        <div className="hero-banner-content">
          {/* Subtle ForgeAI Brand Pill */}
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            <span className="hero-badge-brand">ForgeAI</span>
            <span className="hero-badge-sep">•</span>
            <span>Kitchen & Cookware Marketplace</span>
          </div>

          {/* Hero Main Heading */}
          <h1 className="hero-title">
            Everything You Need <br />
            <span className="hero-title-highlight">for Your Kitchen</span>
          </h1>

          {/* Hero Subtitle */}
          <p className="hero-subtitle">
            Discover quality cookware, kitchen essentials, and everyday products at ForgeAI.
          </p>

          {/* Action Buttons */}
          <div className="hero-cta-group">
            <button 
              id="hero-shop-now-btn" 
              className="hero-btn-primary" 
              onClick={handleShopNow}
              aria-label="Shop Now"
            >
              <span>Shop Now</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>

            <button 
              id="hero-explore-products-btn" 
              className="hero-btn-secondary" 
              onClick={handleExplore}
              aria-label="Explore Products"
            >
              <span>Explore Products</span>
            </button>
          </div>

          {/* Visual Trust / Feature Highlights */}
          <div className="hero-highlights">
            <div className="hero-highlight-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              <span>Premium Cookware</span>
            </div>
            <div className="hero-highlight-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span>Kitchen Essentials</span>
            </div>
            <div className="hero-highlight-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Curated Quality</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

