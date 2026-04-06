import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { syncCartWithServer } from './cartSlice';

export const useCartServerSync = (delayMs = 250) => {
  const dispatch = useDispatch();
  const timeoutRef = useRef(null);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const queueSync = (payload = {}) => {
    if (!isAuthenticated) {
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      dispatch(syncCartWithServer(payload));
    }, delayMs);
  };

  return {
    canSync: isAuthenticated,
    queueSync,
  };
};
