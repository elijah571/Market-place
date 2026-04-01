import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Loader from './components/Loader';
import {
  loadCurrentUser,
  getWishlist,
  getRecentlyViewed,
} from './features/users/userSlice';
import AdminRoute from './components/protected/AdminRoute';
import UserRoute from './components/protected/UserRoute';

const Home = lazy(() => import('./pages/Home'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Products = lazy(() => import('./pages/Products'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirm = lazy(() => import('./pages/OrderConfirm'));
const Payment = lazy(() => import('./pages/Payment'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminUpdateRole = lazy(() => import('./pages/admin/AdminUpdateRole'));
const AdminUpdateOrder = lazy(() => import('./pages/admin/AdminUpdateOrder'));
const AdminUpdateProduct = lazy(() => import('./pages/admin/AdminUpdateProduct'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const Profile = lazy(() => import('./pages/user/Profile'));
const MyOrders = lazy(() => import('./pages/user/MyOrders'));
const OrderDetails = lazy(() => import('./pages/user/OrderDetails'));
const UserDashboard = lazy(() => import('./pages/user/UserDashboard'));
const SavedProducts = lazy(() => import('./pages/user/SavedProducts'));
const Register = lazy(() => import('./User/Register'));
const Login = lazy(() => import('./User/Login'));
const Verify = lazy(() => import('./User/Verify'));
const ResetPasswordToken = lazy(() => import('./User/ResetPasswordToken'));
const ResetPassword = lazy(() => import('./User/ResetPassword'));
const UpdateProfile = lazy(() => import('./User/UpdateProfile'));
const ChangePassword = lazy(() => import('./User/ChangePassword'));
const Logout = lazy(() => import('./User/Logout'));
const SingleUser = lazy(() => import('./User/SingleUser'));
const DeleteUser = lazy(() => import('./User/DeleteUser'));

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(loadCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getWishlist());
      dispatch(getRecentlyViewed());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:keywords" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <UserRoute>
                <Checkout />
              </UserRoute>
            }
          />
          <Route
            path="/order-confirm"
            element={
              <UserRoute>
                <OrderConfirm />
              </UserRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <UserRoute>
                <Payment />
              </UserRoute>
            }
          />
          <Route
            path="/payment-success"
            element={
              <UserRoute>
                <PaymentSuccess />
              </UserRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <UserRoute>
                <Profile />
              </UserRoute>
            }
          />
          <Route
            path="/profile/update"
            element={
              <UserRoute>
                <UpdateProfile />
              </UserRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <UserRoute>
                <ChangePassword />
              </UserRoute>
            }
          />
          <Route
            path="/logout"
            element={
              <UserRoute>
                <Logout />
              </UserRoute>
            }
          />
          <Route
            path="/orders/me"
            element={
              <UserRoute>
                <MyOrders />
              </UserRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <UserRoute>
                <OrderDetails />
              </UserRoute>
            }
          />
          <Route
            path="/user/dashboard"
            element={
              <UserRoute>
                <UserDashboard />
              </UserRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <UserRoute>
                <SavedProducts title="Favorites" heading="Favorite Products" />
              </UserRoute>
            }
          />
          <Route
            path="/saved-products"
            element={
              <UserRoute>
                <SavedProducts />
              </UserRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products/new"
            element={
              <AdminRoute>
                <AdminProductForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products/:id/edit"
            element={
              <AdminRoute>
                <AdminProductForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders/:id"
            element={
              <AdminRoute>
                <AdminUpdateOrder />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/:id/role"
            element={
              <AdminRoute>
                <AdminUpdateRole />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <AdminRoute>
                <AdminReviews />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products/:id/update-advanced"
            element={
              <AdminRoute>
                <AdminUpdateProduct />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/user/:userId"
            element={
              <AdminRoute>
                <SingleUser />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/user/:userId/delete"
            element={
              <AdminRoute>
                <DeleteUser />
              </AdminRoute>
            }
          />
          <Route path="/signup" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<Verify />} />
          <Route path="/resetToken" element={<ResetPasswordToken />} />
          <Route path="/reset-password/:userId" element={<ResetPassword />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
