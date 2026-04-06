import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { adminNavigation, adminQuickLinks } from '../components/admin/adminNavigation';
import '../AdminStyles/AdminLayout.css';

const AdminLayout = () => {
  return (
    <div className="app-shell app-shell--admin">
      <Navbar />
      <main className="app-main app-main--admin">
        <div className="admin-layout page-shell">
          <aside className="admin-sidebar" aria-label="Admin navigation">
            <div className="admin-sidebar__intro">
              <p className="admin-sidebar__eyebrow">Control room</p>
              <h1 className="admin-sidebar__title">Admin Studio</h1>
              <p className="admin-sidebar__description">
                A sharper workspace for managing products, orders, users, and reviews without
                bouncing across disconnected screens.
              </p>
            </div>

            <nav className="admin-sidebar__nav">
              {adminNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `admin-sidebar__link${isActive ? ' is-active' : ''}`
                    }
                  >
                    <span className="admin-sidebar__link-icon">
                      <Icon fontSize="small" />
                    </span>
                    <span className="admin-sidebar__link-copy">
                      <span className="admin-sidebar__link-label">{item.label}</span>
                      <span className="admin-sidebar__link-description">{item.description}</span>
                    </span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="admin-sidebar__footer">
              <div className="admin-sidebar__footnote">
                <span className="admin-sidebar__footnote-bullet" aria-hidden="true" />
                <span>
                  <strong>Live ops</strong>
                  <br />
                  Keep the storefront healthy and fast.
                </span>
              </div>
              <div className="admin-sidebar__footer-links">
                {adminQuickLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="admin-btn admin-btn--ghost"
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </aside>

          <section className="admin-content">
            <Outlet />
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
