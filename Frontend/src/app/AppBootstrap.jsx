import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCart,
  hydrateCartFromStorage,
  mergeGuestCart,
} from '../features/cart/cartSlice';
import { CART_STORAGE_KEYS } from '../features/cart/cartPersistence';
import {
  getRecentlyViewed,
  loadCurrentUser,
} from '../features/users/userSlice';

const AppBootstrap = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(loadCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(mergeGuestCart());
      dispatch(getRecentlyViewed());
      return;
    }

    dispatch(hydrateCartFromStorage());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (!CART_STORAGE_KEYS.includes(event.key || '')) {
        return;
      }

      dispatch(hydrateCartFromStorage());

      if (isAuthenticated) {
        dispatch(fetchCart());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [dispatch, isAuthenticated]);

  return null;
};

export default AppBootstrap;
