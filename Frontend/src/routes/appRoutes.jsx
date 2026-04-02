import { lazy } from 'react';
import UserRoute from '../components/protected/UserRoute';

const Home = lazy(() => import('../pages/Home'));
const ProductDetails = lazy(() => import('../pages/ProductDetails'));
const Products = lazy(() => import('../pages/Products'));
const Cart = lazy(() => import('../pages/Cart'));
const Checkout = lazy(() => import('../pages/Checkout'));
const OrderConfirm = lazy(() => import('../pages/OrderConfirm'));
const Payment = lazy(() => import('../pages/Payment'));
const PaymentSuccess = lazy(() => import('../pages/PaymentSuccess'));

const Profile = lazy(() => import('../pages/user/Profile'));
const MyOrders = lazy(() => import('../pages/user/MyOrders'));
const OrderDetails = lazy(() => import('../pages/user/OrderDetails'));
const UserDashboard = lazy(() => import('../pages/user/UserDashboard'));
const SavedProducts = lazy(() => import('../pages/user/SavedProducts'));
const UpdateProfile = lazy(() => import('../User/UpdateProfile'));
const ChangePassword = lazy(() => import('../User/ChangePassword'));
const Logout = lazy(() => import('../User/Logout'));

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('../pages/admin/AdminProductForm'));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminUpdateRole = lazy(() => import('../pages/admin/AdminUpdateRole'));
const AdminUpdateOrder = lazy(() => import('../pages/admin/AdminUpdateOrder'));
const AdminUpdateProduct = lazy(() => import('../pages/admin/AdminUpdateProduct'));
const AdminReviews = lazy(() => import('../pages/admin/AdminReviews'));
const SingleUser = lazy(() => import('../User/SingleUser'));
const DeleteUser = lazy(() => import('../User/DeleteUser'));

const Register = lazy(() => import('../User/Register'));
const Login = lazy(() => import('../User/Login'));
const Verify = lazy(() => import('../User/Verify'));
const ResetPasswordToken = lazy(() => import('../User/ResetPasswordToken'));
const ResetPassword = lazy(() => import('../User/ResetPassword'));

export const storefrontRoutes = [
  { path: '/', element: <Home /> },
  { path: '/product/:id', element: <ProductDetails /> },
  { path: '/products', element: <Products /> },
  { path: '/products/:keywords', element: <Products /> },
  { path: '/cart', element: <Cart /> },
  {
    path: '/checkout',
    element: (
      <UserRoute>
        <Checkout />
      </UserRoute>
    ),
  },
  {
    path: '/order-confirm',
    element: (
      <UserRoute>
        <OrderConfirm />
      </UserRoute>
    ),
  },
  {
    path: '/payment',
    element: (
      <UserRoute>
        <Payment />
      </UserRoute>
    ),
  },
  {
    path: '/payment-success',
    element: (
      <UserRoute>
        <PaymentSuccess />
      </UserRoute>
    ),
  },
];

export const accountRoutes = [
  { path: '/profile', element: <Profile /> },
  { path: '/profile/update', element: <UpdateProfile /> },
  { path: '/change-password', element: <ChangePassword /> },
  { path: '/logout', element: <Logout /> },
  { path: '/orders/me', element: <MyOrders /> },
  { path: '/orders/:id', element: <OrderDetails /> },
  { path: '/user/dashboard', element: <UserDashboard /> },
  {
    path: '/favorites',
    element: <SavedProducts title="Favorites" heading="Favorite Products" />,
  },
  { path: '/saved-products', element: <SavedProducts /> },
];

export const adminRoutes = [
  { path: '/admin/dashboard', element: <AdminDashboard /> },
  { path: '/admin/products', element: <AdminProducts /> },
  { path: '/admin/products/new', element: <AdminProductForm /> },
  { path: '/admin/products/:id/edit', element: <AdminProductForm /> },
  { path: '/admin/orders', element: <AdminOrders /> },
  { path: '/admin/orders/:id', element: <AdminUpdateOrder /> },
  { path: '/admin/users', element: <AdminUsers /> },
  { path: '/admin/users/:id/role', element: <AdminUpdateRole /> },
  { path: '/admin/reviews', element: <AdminReviews /> },
  { path: '/admin/products/:id/update-advanced', element: <AdminUpdateProduct /> },
  { path: '/admin/user/:userId', element: <SingleUser /> },
  { path: '/admin/user/:userId/delete', element: <DeleteUser /> },
];

export const authRoutes = [
  { path: '/signup', element: <Register /> },
  { path: '/login', element: <Login /> },
  { path: '/verify-email', element: <Verify /> },
  { path: '/resetToken', element: <ResetPasswordToken /> },
  { path: '/reset-password/:userId', element: <ResetPassword /> },
];
