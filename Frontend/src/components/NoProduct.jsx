import React from 'react';
import '../componentStyles/NoProducts.css';

const NoProduct = ({ keyword }) => {
  return (
    <div className="no-product-content">
      <div className="no-products-icon">
        <h3>No Products Found</h3>
        🧺
        <p className="no-product-message">
          {keyword
            ? `We could't  find any products mathcing "${keyword}" Try using different keywords or browswe our complte catalog`
            : 'No product available please check back later'}
        </p>
      </div>
    </div>
  );
};

export default NoProduct;
