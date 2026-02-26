import React, { useEffect, useState } from 'react';
import '../pageStyles/Products.css';
import PageTitle from '../components/PageTitle';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useDispatch, useSelector } from 'react-redux';
import Product from '../components/Product';
import { getProduct, removeErrors } from '../features/products/productSlice';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { useLocation, useNavigate } from 'react-router-dom';
import NoProduct from '../components/NoProduct';
import Pagination from '../components/Pagination';

const Products = () => {
  const { loading, error, products, resultPerPage, productCount } = useSelector(
    (state) => state.product
  );

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const keyword = searchParams.get('keyword');
  const pageFromURL = parseInt(searchParams.get('page'), 10) || 1;
  const category = searchParams.get('category');

  const [currentPage, setCurrentPage] = useState(pageFromURL);

  const categories = [
    'Computers',
    'Mobiles',
    'Accessories',
    'Clothes',
    'Shoes',
    'TVs ',
    'Cameras',
  ];

  // Sync state with URL page
  useEffect(() => {
    setCurrentPage(pageFromURL);
  }, [pageFromURL]);

  useEffect(() => {
    dispatch(getProduct({ keyword, page: currentPage, category }));
  }, [dispatch, keyword, currentPage, category]);

  useEffect(() => {
    if (error) {
      toast.error(error?.message || error);
      dispatch(removeErrors());
    }
  }, [dispatch, error]);

  if (loading) {
    return <Loader />;
  }

  const handlePageChange = (page) => {
    if (page !== currentPage) {
      setCurrentPage(page);

      const newSearchParams = new URLSearchParams(location.search);

      if (page === 1) {
        newSearchParams.delete('page');
      } else {
        newSearchParams.set('page', page);
      }

      navigate(`?${newSearchParams.toString()}`);
    }
  };

  const handleCategory = (selectedCategory) => {
    const newSearchParams = new URLSearchParams(location.search);

    newSearchParams.set('category', selectedCategory);
    newSearchParams.delete('page'); // reset pagination when category changes

    navigate(`?${newSearchParams.toString()}`);
  };

  return (
    <>
      <PageTitle title="All Products" />
      <Navbar />
      <div className="products-layout">
        <div className="filter-section">
          <h3 className="filter-heading">CATEGORIES</h3>

          {categories.map((cat) => (
            <li key={cat} onClick={() => handleCategory(cat)}>
              {cat}
            </li>
          ))}
        </div>

        <div className="products-section">
          {products.length > 0 ? (
            <div className="products-product-container">
              {products.map((product) => (
                <Product key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <NoProduct />
          )}

          <Pagination
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Products;
