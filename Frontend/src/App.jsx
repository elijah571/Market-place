import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Loader from './components/Loader';
import AdminRoute from './components/protected/AdminRoute';
import UserRoute from './components/protected/UserRoute';
import AppBootstrap from './app/AppBootstrap';
import StorefrontLayout from './layouts/StorefrontLayout';
import AccountLayout from './layouts/AccountLayout';
import AdminLayout from './layouts/AdminLayout';
import {
  accountRoutes,
  adminRoutes,
  authRoutes,
  storefrontRoutes,
} from './routes/appRoutes';

const renderRoutes = (routes) =>
  routes.map((route) => (
    <Route key={route.path} path={route.path} element={route.element} />
  ));

const App = () => {
  return (
    <Router>
      <AppBootstrap />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route element={<StorefrontLayout />}>
            {renderRoutes(storefrontRoutes)}
          </Route>

          <Route
            element={
              <UserRoute>
                <AccountLayout />
              </UserRoute>
            }
          >
            {renderRoutes(accountRoutes)}
          </Route>

          <Route
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            {renderRoutes(adminRoutes)}
          </Route>

          {renderRoutes(authRoutes)}
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
