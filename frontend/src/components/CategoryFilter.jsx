import React from 'react';

export default function CategoryFilter({ activeCategory, onCategoryChange }) {
  const categories = [
    { id: 'ALL', label: 'All Products' },
    { id: 'KITCHEN_UTENSILS', label: 'Kitchen & Utensils' },
    { id: 'FURNITURE', label: 'Furniture' },
    { id: 'OFFICE_ENTERPRISE', label: 'Office & Enterprise' }
  ];

  return (
    <div className="container category-filter-container">
      <div className="category-scroll-wrapper">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat.id)}
            aria-label={`Filter by ${cat.label}`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
