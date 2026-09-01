import React from 'react';

export default function SearchBar({ searchQuery, onSearchChange }) {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="container search-bar-container">
      <form onSubmit={handleSubmit} className="search-glass">
        {/* Search Icon */}
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        {/* Input */}
        <input 
          type="text" 
          className="search-input" 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search utensils, furniture, office supplies..."
          aria-label="Search items"
        />

        {/* Search Action Button */}
        <button type="submit" className="search-btn">
          Search
        </button>
      </form>
    </div>
  );
}
