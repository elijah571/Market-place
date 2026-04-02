import React from 'react';
import '../componentStyles/Filters.css';

const FiltersPanel = ({
  categories = [],
  selectedCategory,
  onCategoryChange,
  maxPrice = 5000,
  selectedPrice,
  onPriceChange,
  selectedRating,
  onRatingChange,
  selectedSort,
  onSortChange,
  onClear,
}) => {
  const priceValue = selectedPrice ?? maxPrice;

  return (
    <div className="filter-section">
      <div className="filter-head">
        <h3 className="filter-heading">Refine Results</h3>
        <button type="button" className="filter-clear-btn" onClick={onClear}>
          Clear
        </button>
      </div>

      <div className="filter">
        <h4>Category</h4>
        <div className="filter-chip-grid">
          <button
            type="button"
            className={`filter-chip ${!selectedCategory ? 'active' : ''}`}
            onClick={() => onCategoryChange('')}
          >
            All
          </button>
          {categories.map((category) => {
            const label = typeof category === 'string' ? category : category.label;
            const count = typeof category === 'string' ? null : category.count;

            return (
              <button
                type="button"
                key={label}
                className={`filter-chip ${selectedCategory === label ? 'active' : ''}`}
                onClick={() => onCategoryChange(label)}
              >
                <span>{label}</span>
                {count ? <small>{count}</small> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter">
        <h4>Max Price: ${priceValue}</h4>
        <input
          type="range"
          min="0"
          max={maxPrice}
          value={priceValue}
          onChange={(event) => onPriceChange(event.target.value)}
        />
      </div>

      <div className="filter">
        <h4>Minimum Rating</h4>
        <select
          value={selectedRating || ''}
          onChange={(event) => onRatingChange(event.target.value)}
        >
          <option value="">All ratings</option>
          <option value="4">4 stars & up</option>
          <option value="3">3 stars & up</option>
          <option value="2">2 stars & up</option>
        </select>
      </div>

      <div className="filter">
        <h4>Sort By</h4>
        <select
          value={selectedSort || 'newest'}
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="ratingDesc">Top Rated</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
};

export default FiltersPanel;
