import React from 'react';
import '../componentStyles/Filters.css';

const FiltersPanel = ({
  categories = [],
  selectedCategory,
  onCategoryChange,
  subcategories = [],
  selectedSubcategory,
  onSubcategoryChange,
  maxPrice = 5000,
  selectedPrice,
  onPriceChange,
  selectedRating,
  onRatingChange,
  selectedSort,
  onSortChange,
  selectedLimit,
  onLimitChange,
  activeFilters = [],
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

      {subcategories.length > 0 ? (
        <div className="filter">
          <h4>Subcategory</h4>
          <div className="filter-chip-grid">
            <button
              type="button"
              className={`filter-chip ${!selectedSubcategory ? 'active' : ''}`}
              onClick={() => onSubcategoryChange('')}
            >
              All
            </button>
            {subcategories.map((subcategory) => {
              const label =
                typeof subcategory === 'string' ? subcategory : subcategory.label;
              const count =
                typeof subcategory === 'string' ? null : subcategory.count;

              return (
                <button
                  type="button"
                  key={label}
                  className={`filter-chip ${selectedSubcategory === label ? 'active' : ''}`}
                  onClick={() => onSubcategoryChange(label)}
                >
                  <span>{label}</span>
                  {count ? <small>{count}</small> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="filter">
        <h4>Max Price: ${priceValue}</h4>
        <input
          type="range"
          min="0"
          max={maxPrice}
          value={priceValue}
          onChange={(event) => onPriceChange(event.target.value)}
        />
        <div className="filter-range-meta">
          <span>$0</span>
          <span>${maxPrice}</span>
        </div>
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
        <h4>Results Per Page</h4>
        <select
          value={selectedLimit || 12}
          onChange={(event) => onLimitChange(event.target.value)}
        >
          <option value="8">8 products</option>
          <option value="12">12 products</option>
          <option value="24">24 products</option>
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

      {activeFilters.length > 0 ? (
        <div className="filter">
          <h4>Applied Filters</h4>
          <div className="filter-active-list" aria-label="Applied catalog filters">
            {activeFilters.map((filter) => (
              <span key={filter.label} className="filter-active-pill">
                {filter.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FiltersPanel;
