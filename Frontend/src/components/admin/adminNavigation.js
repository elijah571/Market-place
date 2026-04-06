import {
  AddShoppingCartRounded,
  DashboardRounded,
  Inventory2Rounded,
  RateReviewRounded,
  StorefrontRounded,
  SupervisorAccountRounded,
} from '@mui/icons-material';

export const adminNavigation = [
  {
    label: 'Overview',
    description: 'KPIs, activity, and revenue trends',
    to: '/admin/dashboard',
    icon: DashboardRounded,
  },
  {
    label: 'Products',
    description: 'Catalog health, stock, and publishing',
    to: '/admin/products',
    icon: Inventory2Rounded,
  },
  {
    label: 'Orders',
    description: 'Fulfilment flow and payment status',
    to: '/admin/orders',
    icon: AddShoppingCartRounded,
  },
  {
    label: 'Users',
    description: 'Roles, access, and customer records',
    to: '/admin/users',
    icon: SupervisorAccountRounded,
  },
  {
    label: 'Reviews',
    description: 'Product feedback and moderation',
    to: '/admin/reviews',
    icon: RateReviewRounded,
  },
];

export const adminQuickLinks = [
  {
    label: 'New Product',
    to: '/admin/products/new',
  },
  {
    label: 'Storefront',
    to: '/',
    icon: StorefrontRounded,
  },
];
