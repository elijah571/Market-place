import React, { useEffect, useMemo } from 'react';
import '../pageStyles/Products.css';
import PageTitle from '../components/PageTitle';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useDispatch, useSelector } from 'react-redux';
import Product from '../components/Product';
import { getProduct, removeErrors } from '../features/products/productSlice';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import NoProduct from '../components/NoProduct';
import Pagination from '../components/Pagination';
import FiltersPanel from '../components/FiltersPanel';
import ProductSkeletonGrid from '../components/ProductSkeletonGrid';
import { pickRandomBackground } from '../utils/backgrounds';
import { useCatalogMeta } from '../features/catalog/catalogQueries';

const Products = () => {
  const { loading, error, products, productCount, totalPage } = useSelector(
    (state) => state.product
  );

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const heroBackground = useMemo(() => pickRandomBackground(), []);
  const {
    data: catalogMeta = {
      categories: [],
      priceRange: { min: 0, max: 5000 },
    },
  } = useCatalogMeta();

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
    newSearchParams.delete('page');

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
      <section
        className="catalog-hero home-surface home-backdrop"
        style={{ '--hero-image': `url(${heroBackground})` }}
      >
        <div className="catalog-hero-copy">
          <p className="products-kicker">Catalog layout refresh</p>
          <h1>{keyword ? `Results for "${keyword}"` : 'Find products through a cleaner visual catalog'}</h1>
          <p className="products-subtitle">
            Explore curated categories, tighter filtering, and a stronger editorial header with rotating imagery.
          </p>
        </div>
        <div className="catalog-hero-metrics">
          <article>
            <strong>{productCount || 0}</strong>
            <span>Products in this view</span>
          </article>
          <article>
            <strong>{catalogMeta.categories.length || 0}</strong>
            <span>Departments</span>
          </article>
          <article>
            <strong>{totalPage || 1}</strong>
            <span>Pages of results</span>
          </article>
        </div>
      </section>
      <div className="products-layout">
        <FiltersPanel
          categories={catalogMeta.categories}
          selectedCategory={category || ''}
          onCategoryChange={handleCategory}
          maxPrice={catalogMeta.priceRange?.max || 5000}
          selectedPrice={maxPrice ?? catalogMeta.priceRange?.max}
          onPriceChange={handlePrice}
          selectedRating={minimumRating}
          onRatingChange={handleRating}
          selectedSort={sortBy}
          onSortChange={handleSort}
          onClear={() => navigate('/products')}
        />

        <div className="products-section">
          <div className="products-page-header">
            <div>
              <p className="products-kicker">Catalog</p>
              <h1>{keyword ? `Results for "${keyword}"` : 'Shop all products'}</h1>
              <p className="products-subtitle">
                {productCount} products found across curated departments and fast-moving categories.
              </p>
            </div>
            <div className="products-summary-card">
              <strong>{totalPage || 1}</strong>
              <span>pages of results</span>
            </div>
          </div>
          <div className="catalog-feature-row">
            {(catalogMeta.categories || []).slice(0, 3).map((item) => (
              <button
                key={item.label}
                type="button"
                className={`catalog-feature-card ${category === item.label ? 'active' : ''}`}
                onClick={() => handleCategory(item.label)}
              >
                <strong>{item.label}</strong>
                <span>{item.count} items</span>
              </button>
            ))}
          </div>

          {loading ? (
            <ProductSkeletonGrid count={8} />
          ) : products.length > 0 ? (
            <div className="products-product-container">
              {products.map((product) => (
                <Product key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <NoProduct />
          )}

          <Pagination currentPage={currentPage} onPageChange={handlePageChange} />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Products;
