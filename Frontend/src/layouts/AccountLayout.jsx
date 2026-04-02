import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AccountLayout = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main app-main--account">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AccountLayout;
