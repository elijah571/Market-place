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
}) => {
  const priceValue = selectedPrice ?? maxPrice;

  return (
    <div className="filter-section">
      <h3 className="filter-heading">Filters</h3>
      <div className="filter">
        <h4>Category</h4>
        <select
          value={selectedCategory || ''}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">All</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
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
