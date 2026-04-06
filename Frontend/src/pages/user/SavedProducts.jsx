import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PageTitle from '../../components/PageTitle';
import Product from '../../components/Product';
import NoProduct from '../../components/NoProduct';
import { getWishlist, removeErrors } from '../../features/users/userSlice';
import { toast } from 'react-toastify';
import '../../pageStyles/SavedProducts.css';
import ProductSkeletonGrid from '../../components/ProductSkeletonGrid';

const SavedProducts = ({ title = 'Saved Products', heading = 'Saved Products' }) => {
  const dispatch = useDispatch();
  const { error, isAuthenticated, wishlistLoading, wishlistLoaded, wishlistProducts } =
    useSelector((state) => state.user);

  useEffect(() => {
    if (!isAuthenticated || wishlistLoading || wishlistLoaded) {
      return;
    }

    dispatch(getWishlist());
  }, [dispatch, isAuthenticated, wishlistLoaded, wishlistLoading]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(removeErrors());
    }
  }, [dispatch, error]);

  return (
    <>
      <PageTitle title={title} />
      <div className="saved-products-page">
        <div className="saved-products-shell">
          <div className="saved-products-header">
            <p className="saved-products-kicker">Wishlist</p>
            <h1>{heading}</h1>
            <p className="saved-products-subtitle">
              Keep track of the products you love and jump back in anytime.
            </p>
          </div>

          {wishlistLoading ? (
            <ProductSkeletonGrid count={6} />
          ) : wishlistProducts.length > 0 ? (
            <div className="saved-products-grid">
              {wishlistProducts.map((product) => (
                <Product product={product} key={product._id} />
              ))}
            </div>
          ) : (
            <div className="saved-products-empty">
              <NoProduct />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SavedProducts;
