import React from 'react';
import heroImage from '../assets/hero.png';

export default function Hero() {
  return (
    <section className="container hero-section">
      {/* Decorative radial glows */}
      <div className="glow-spot-1"></div>
      <div className="glow-spot-2"></div>

      {/* LEFT COLUMN: TEXT CONTENT */}
      <div className="hero-content">
        <span className="hero-badge">
          Your Trusted Home & Enterprise Partner
        </span>
        
        <h1 className="hero-title">
          Utensils, Furniture &<br />
          <span className="hero-title-gradient">Enterprise Supplies</span>
        </h1>
        
        <p className="hero-subtitle">
          Quality products for your home, office and business — all in one place.
        </p>
      </div>

      {/* RIGHT COLUMN: LIFESTYLE IMAGE */}
      <div className="hero-image-container">
        <img 
          src={heroImage} 
          alt="Premium Oak dining table and home furniture interior" 
          className="hero-img"
          loading="eager"
        />
        <div className="hero-image-overlay"></div>
      </div>
    </section>
  );
}
