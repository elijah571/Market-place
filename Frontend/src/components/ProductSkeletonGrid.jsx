import React from 'react';

const ProductSkeletonGrid = ({ count = 8 }) => {
  return (
    <div className="product-skeleton-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`} className="product-skeleton-card">
          <div className="product-skeleton-media" />
          <div className="product-skeleton-line short" />
          <div className="product-skeleton-line" />
          <div className="product-skeleton-line small" />
        </div>
      ))}
    </div>
  );
};

export default ProductSkeletonGrid;
