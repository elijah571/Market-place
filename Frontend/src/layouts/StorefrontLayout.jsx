import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const StorefrontLayout = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main app-main--storefront">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default StorefrontLayout;
