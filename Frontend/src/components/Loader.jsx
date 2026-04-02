import React from 'react';
import '../componentStyles/Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader-brand">
        <div className="loader"></div>
        <p>Preparing your storefront...</p>
      </div>
    </div>
  );
};

export default Loader;
