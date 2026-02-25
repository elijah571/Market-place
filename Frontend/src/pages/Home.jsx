import React, { useEffect } from 'react';
import '../pageStyles/Home.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ImageSlider from '../components/ImageSlider';
import Product from '../components/Product';
import PageTitle from '../components/PageTitle';

import { useDispatch, useSelector } from 'react-redux';
import { getProduct, removeErrors } from '../features/products/productSlice';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const Home = () => {
  const { loading, error, products, productCount } = useSelector(
    (state) => state.product
  );

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getProduct({}));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(removeErrors());
    }
  }, [dispatch, error]);
  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <>
          <PageTitle title="HOME" />
          <Navbar />
          <ImageSlider />
          <div className="home-container">
            <h2 className="home-heading">Trending Now</h2>
            <div className="home-product-container">
              {products &&
                products.map((product) => (
                  <Product product={product} key={product._id} />
                ))}
            </div>
          </div>
          <Footer />
        </>
      )}
    </>
  );
};

export default Home;
