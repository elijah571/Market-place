import {
  FavoriteBorder,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  PersonAddAlt1Outlined,
  PersonOutline,
  ReceiptLongOutlined,
  ShoppingCartOutlined,
  SpaceDashboardOutlined,
  StorefrontOutlined,
} from '@mui/icons-material';

export const PRIMARY_NAV_LINKS = [
  {
    to: '/',
    label: 'Home',
    icon: HomeOutlined,
    end: true,
  },
  {
    to: '/products',
    label: 'Shop',
    icon: StorefrontOutlined,
  },
];

export const getQuickActionLinks = ({ isAuthenticated }) => [
  {
    to: '/cart',
    label: 'Cart',
    icon: ShoppingCartOutlined,
  },
  {
    to: '/favorites',
    label: 'Wishlist',
    icon: FavoriteBorder,
  },
  isAuthenticated
    ? {
        to: '/orders/me',
        label: 'Orders',
        icon: ReceiptLongOutlined,
      }
    : {
        to: '/login',
        label: 'Login',
        icon: LoginOutlined,
      },
];

export const getAccountLinks = ({ isAuthenticated, isAdmin }) => {
  if (!isAuthenticated) {
    return [
      {
        to: '/login',
        label: 'Login',
        icon: LoginOutlined,
      },
      {
        to: '/signup',
        label: 'Create Account',
        icon: PersonAddAlt1Outlined,
      },
    ];
  }

  const links = [
    {
      to: '/profile',
      label: 'Profile',
      icon: PersonOutline,
    },
    {
      to: '/orders/me',
      label: 'My Orders',
      icon: ReceiptLongOutlined,
    },
  ];

  if (isAdmin) {
    links.push({
      to: '/admin/dashboard',
      label: 'Admin Dashboard',
      icon: SpaceDashboardOutlined,
    });
  }

  links.push({
    to: '/logout',
    label: 'Logout',
    icon: LogoutOutlined,
  });

  return links;
};
