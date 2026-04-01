import React, { useEffect } from 'react';
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
import FiltersPanel from '../components/FiltersPanel';

const Products = () => {
  const { loading, error, products } = useSelector((state) => state.product);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const keyword = searchParams.get('keyword');
  const pageFromURL = parseInt(searchParams.get('page'), 10) || 1;
  const category = searchParams.get('category');
  const priceLteFromURL =
    searchParams.get('price[lte]') !== null
      ? Number(searchParams.get('price[lte]'))
      : null;
  const ratingGteFromURL =
    searchParams.get('rating[gte]') !== null
      ? Number(searchParams.get('rating[gte]'))
      : null;
  const sortFromURL = searchParams.get('sort') || 'newest';

  const currentPage = pageFromURL;
  const maxPrice = priceLteFromURL;
  const minimumRating = ratingGteFromURL;
  const sortBy = sortFromURL;

  const categories = [
    'Computers',
    'Mobiles',
    'Accessories',
    'Clothes',
    'Shoes',
    'TVs ',
    'Cameras',
  ];

  useEffect(() => {
    dispatch(
      getProduct({
        keyword,
        page: currentPage,
        category,
        priceLte: maxPrice !== null ? maxPrice : undefined,
        ratingGte: minimumRating !== null ? minimumRating : undefined,
        sort: sortBy,
      })
    );
  }, [dispatch, keyword, currentPage, category, maxPrice, minimumRating, sortBy]);

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

    if (!selectedCategory) {
      newSearchParams.delete('category');
    } else {
      newSearchParams.set('category', selectedCategory);
    }
    newSearchParams.delete('page'); // reset pagination when category changes

    navigate(`?${newSearchParams.toString()}`);
  };

  const handlePrice = (value) => {
    const numeric = Number(value);

    const newSearchParams = new URLSearchParams(location.search);
    if (Number.isFinite(numeric)) {
      newSearchParams.set('price[lte]', String(numeric));
    } else {
      newSearchParams.delete('price[lte]');
    }
    newSearchParams.delete('page');
    navigate(`?${newSearchParams.toString()}`);
  };

  const handleRating = (value) => {
    const numeric = Number(value);

    const newSearchParams = new URLSearchParams(location.search);
    if (Number.isFinite(numeric) && numeric > 0) {
      newSearchParams.set('rating[gte]', String(numeric));
    } else {
      newSearchParams.delete('rating[gte]');
    }
    newSearchParams.delete('page');
    navigate(`?${newSearchParams.toString()}`);
  };

  const handleSort = (value) => {
    const newSearchParams = new URLSearchParams(location.search);
    if (value && value !== 'newest') {
      newSearchParams.set('sort', value);
    } else {
      newSearchParams.delete('sort');
    }
    newSearchParams.delete('page');
    navigate(`?${newSearchParams.toString()}`);
  };

  return (
    <>
      <PageTitle title="All Products" />
      <Navbar />
      <div className="products-layout">
        <FiltersPanel
          categories={categories}
          selectedCategory={category || ''}
          onCategoryChange={handleCategory}
          selectedPrice={maxPrice}
          onPriceChange={handlePrice}
          selectedRating={minimumRating}
          onRatingChange={handleRating}
          selectedSort={sortBy}
          onSortChange={handleSort}
        />

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
