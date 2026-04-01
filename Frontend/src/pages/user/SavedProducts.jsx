import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PageTitle from '../../components/PageTitle';
import Product from '../../components/Product';
import Loader from '../../components/Loader';
import NoProduct from '../../components/NoProduct';
import { getWishlist, removeErrors } from '../../features/users/userSlice';
import { toast } from 'react-toastify';
import '../../pageStyles/SavedProducts.css';

const SavedProducts = ({ title = 'Saved Products', heading = 'Saved Products' }) => {
  const dispatch = useDispatch();
  const { loading, error, wishlistProducts } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(getWishlist());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(removeErrors());
    }
  }, [dispatch, error]);

  return (
    <>
      <PageTitle title={title} />
      <Navbar />
      <div className="saved-products-page">
        <div className="saved-products-shell">
          <div className="saved-products-header">
            <p className="saved-products-kicker">Wishlist</p>
            <h1>{heading}</h1>
            <p className="saved-products-subtitle">
              Keep track of the products you love and jump back in anytime.
            </p>
          </div>

          {loading ? (
            <Loader />
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
      <Footer />
    </>
  );
};

export default SavedProducts;
