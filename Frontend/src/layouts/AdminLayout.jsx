import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AdminLayout = () => {
  return (
    <div className="app-shell app-shell--admin">
      <Navbar />
      <main className="app-main app-main--admin">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
