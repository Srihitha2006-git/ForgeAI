import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Hero from './Hero';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import ServiceFeatures from './ServiceFeatures';
import ProductCard from './ProductCard';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import cookwareBg from '../assets/cookware-hero.jpg';

export default function ProductCatalog({ apiUrl, onProductClick, token, onAuthTrigger, onCartCountChange, onShowToast, wishlistItems, onWishlistCountChange, onWishlistItemsChange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${apiUrl}/api/products`);
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        setProducts([]);
        console.warn('Backend returned non-array product list:', response.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [apiUrl]);

  // Handle Search Input Change
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  // Handle Category Select
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Handle Sort Select
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // 1. FILTERING LOGIC
  const getFilteredProducts = () => {
    let list = [...products];

    // Filter by Category
    if (selectedCategory !== 'ALL') {
      list = list.filter(
        (p) => p.category && p.category.toUpperCase() === selectedCategory
      );
    }

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description || '').toLowerCase().includes(query) ||
          (p.brand || '').toLowerCase().includes(query) ||
          (p.sku || '').toLowerCase().includes(query)
      );
    }

    // 2. SORTING LOGIC
    switch (sortBy) {
      case 'PRICE_LOW_HIGH':
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'PRICE_HIGH_LOW':
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'NAME_A_Z':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'NEWEST':
      default:
        // Sort by id descending (higher id is newer) or by createdAt if available
        list.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return (b.id || 0) - (a.id || 0);
        });
        break;
    }

    return list;
  };

  const processedProducts = getFilteredProducts();

  return (
    <div style={{ width: '100%' }}>
      {/* 1. HERO SECTION */}
      <Hero />

      {/* 2. SEARCH, CATEGORY FILTER & SERVICE FEATURES SECTION WITH UTENSILS BACKDROP */}
      <section className="search-features-section-wrapper" aria-label="Search and Category Filters">
        <div
          className="search-features-bg-backdrop"
          style={{ backgroundImage: `url(${cookwareBg})` }}
          role="img"
          aria-label="Kitchen utensils and cookware marketplace background"
        >
          <div className="search-features-bg-overlay"></div>
        </div>

        <div className="search-features-content-container">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />

          <div id="category-filter-section">
            <CategoryFilter
              activeCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          <ServiceFeatures />
        </div>
      </section>

      {/* 5. DYNAMIC PRODUCT GRID VIEW */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="products-catalog-section-wrapper">
          {/* Utensils image background for the products backside */}
          <div
            className="products-bg-backdrop"
            style={{ backgroundImage: `url(${cookwareBg})` }}
            role="img"
            aria-label="Cookware marketplace background"
          >
            <div className="products-bg-overlay"></div>
          </div>

          <div id="catalog-products-section" className="container" style={{ width: '100%', position: 'relative', zIndex: 5 }}>
            {/* Header layout for grid section with left accent and right sort drop-down */}
            <div className="catalog-section-header">
              <h2 className="catalog-section-title">
                <span className="catalog-title-accent"></span>
                Featured Products
              </h2>

              <div className="sort-container">
                <label htmlFor="sort-select-dropdown" className="sort-label">Sort By:</label>
                <select
                  id="sort-select-dropdown"
                  className="sort-select"
                  value={sortBy}
                  onChange={handleSortChange}
                >
                  <option value="NEWEST">Newest</option>
                  <option value="PRICE_LOW_HIGH">Price: Low to High</option>
                  <option value="PRICE_HIGH_LOW">Price: High to Low</option>
                  <option value="NAME_A_Z">Name: A-Z</option>
                </select>
              </div>
            </div>

            {/* 4-Column Product Grid */}
            {processedProducts.length === 0 ? (
              <div className="empty-state" style={{ margin: '2rem auto' }}>
                <h3>No products found</h3>
                <p style={{ marginTop: '0.5rem' }}>No products match your search or filter criteria.</p>
              </div>
            ) : (
              <div className="product-catalog-grid">
                {processedProducts.map((product) => (
                  <ProductCard
                    key={product.id || product.sku}
                    product={product}
                    onProductClick={onProductClick}
                    token={token}
                    onAuthTrigger={onAuthTrigger}
                    onCartCountChange={onCartCountChange}
                    onShowToast={onShowToast}
                    wishlistItems={wishlistItems}
                    onWishlistCountChange={onWishlistCountChange}
                    onWishlistItemsChange={onWishlistItemsChange}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* FOOTER TEXT BANNER */}
      <footer className="footer-banner">
        <div className="container">
          <p className="footer-text">
            &copy; {new Date().getFullYear()} ForgeAI Marketplace. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
