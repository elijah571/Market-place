import React, { useCallback, useEffect, useMemo } from 'react';
import '../pageStyles/Products.css';
import PageTitle from '../components/PageTitle';
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

const DEFAULT_PAGE_SIZE = 12;

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
  const subcategory = searchParams.get('subcategory');
  const limitFromURL = parseInt(searchParams.get('limit'), 10) || DEFAULT_PAGE_SIZE;
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
  const pageSize = limitFromURL;
  const maxPrice = priceLteFromURL;
  const minimumRating = ratingGteFromURL;
  const sortBy = sortFromURL;
  const selectedCategoryMeta = useMemo(
    () =>
      (catalogMeta.categories || []).find((item) => item.label === category) || null,
    [catalogMeta.categories, category]
  );
  const subcategories = useMemo(
    () => selectedCategoryMeta?.subcategories || [],
    [selectedCategoryMeta]
  );
  const hasFiltersApplied = Boolean(
    category ||
      subcategory ||
      maxPrice !== null ||
      minimumRating !== null ||
      (sortBy && sortBy !== 'newest') ||
      (pageSize && pageSize !== DEFAULT_PAGE_SIZE)
  );
  const activeFilters = useMemo(() => {
    const filters = [];

    if (category) {
      filters.push({ label: `Category: ${category}` });
    }

    if (subcategory) {
      filters.push({ label: `Subcategory: ${subcategory}` });
    }

    if (maxPrice !== null) {
      filters.push({ label: `Up to $${maxPrice}` });
    }

    if (minimumRating !== null) {
      filters.push({ label: `${minimumRating}+ star rating` });
    }

    if (sortBy && sortBy !== 'newest') {
      const sortLabelMap = {
        popular: 'Most Popular',
        ratingDesc: 'Top Rated',
        priceAsc: 'Price: Low to High',
        priceDesc: 'Price: High to Low',
        newest: 'Newest',
        oldest: 'Oldest',
      };
      filters.push({ label: sortLabelMap[sortBy] || sortBy });
    }

    if (pageSize !== DEFAULT_PAGE_SIZE) {
      filters.push({ label: `${pageSize} per page` });
    }

    return filters;
  }, [category, subcategory, maxPrice, minimumRating, sortBy, pageSize]);

  const updateCatalogParams = useCallback(
    (updater) => {
      const nextParams = new URLSearchParams(location.search);
      updater(nextParams);
      navigate(
        {
          pathname: '/products',
          search: nextParams.toString() ? `?${nextParams.toString()}` : '',
        },
        { replace: false }
      );
    },
    [location.search, navigate]
  );

  useEffect(() => {
    dispatch(
      getProduct({
        keyword,
        page: currentPage,
        limit: pageSize,
        category,
        subcategory,
        priceLte: maxPrice !== null ? maxPrice : undefined,
        ratingGte: minimumRating !== null ? minimumRating : undefined,
        sort: sortBy,
      })
    );
  }, [
    dispatch,
    keyword,
    currentPage,
    pageSize,
    category,
    subcategory,
    maxPrice,
    minimumRating,
    sortBy,
  ]);

  useEffect(() => {
    if (!subcategory || subcategories.length === 0) {
      return;
    }

    const exists = subcategories.some((item) => item.label === subcategory);

    if (!exists) {
      updateCatalogParams((params) => {
        params.delete('subcategory');
        params.delete('page');
      });
    }
  }, [subcategory, subcategories, updateCatalogParams]);

  useEffect(() => {
    if (error) {
      toast.error(error?.message || error);
      dispatch(removeErrors());
    }
  }, [dispatch, error]);

  const handlePageChange = (page) => {
    if (page !== currentPage) {
      updateCatalogParams((params) => {
        if (page === 1) {
          params.delete('page');
        } else {
          params.set('page', String(page));
        }
      });
    }
  };

  const handleCategory = (selectedCategory) => {
    updateCatalogParams((params) => {
      if (!selectedCategory) {
        params.delete('category');
        params.delete('subcategory');
      } else {
        params.set('category', selectedCategory);
        params.delete('subcategory');
      }
      params.delete('page');
    });
  };

  const handleSubcategory = (selectedSubcategory) => {
    updateCatalogParams((params) => {
      if (!selectedSubcategory) {
        params.delete('subcategory');
      } else {
        params.set('subcategory', selectedSubcategory);
      }
      params.delete('page');
    });
  };

  const handlePrice = (value) => {
    const numeric = Number(value);
    updateCatalogParams((params) => {
      if (Number.isFinite(numeric)) {
        params.set('price[lte]', String(numeric));
      } else {
        params.delete('price[lte]');
      }
      params.delete('page');
    });
  };

  const handleRating = (value) => {
    const numeric = Number(value);
    updateCatalogParams((params) => {
      if (Number.isFinite(numeric) && numeric > 0) {
        params.set('rating[gte]', String(numeric));
      } else {
        params.delete('rating[gte]');
      }
      params.delete('page');
    });
  };

  const handleSort = (value) => {
    updateCatalogParams((params) => {
      if (value && value !== 'newest') {
        params.set('sort', value);
      } else {
        params.delete('sort');
      }
      params.delete('page');
    });
  };

  const handleLimit = (value) => {
    const numeric = Number(value);

    updateCatalogParams((params) => {
      if (Number.isFinite(numeric) && numeric !== DEFAULT_PAGE_SIZE) {
        params.set('limit', String(numeric));
      } else {
        params.delete('limit');
      }
      params.delete('page');
    });
  };

  const handleClearFilters = () => {
    updateCatalogParams((params) => {
      params.delete('category');
      params.delete('subcategory');
      params.delete('price[lte]');
      params.delete('rating[gte]');
      params.delete('sort');
      params.delete('limit');
      params.delete('page');
    });
  };

  return (
    <>
      <PageTitle title="All Products" />
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
      <div className="products-layout page-shell">
        <FiltersPanel
          categories={catalogMeta.categories}
          selectedCategory={category || ''}
          onCategoryChange={handleCategory}
          subcategories={subcategories}
          selectedSubcategory={subcategory || ''}
          onSubcategoryChange={handleSubcategory}
          maxPrice={catalogMeta.priceRange?.max || 5000}
          selectedPrice={maxPrice ?? catalogMeta.priceRange?.max}
          onPriceChange={handlePrice}
          selectedRating={minimumRating}
          onRatingChange={handleRating}
          selectedSort={sortBy}
          onSortChange={handleSort}
          selectedLimit={pageSize}
          onLimitChange={handleLimit}
          activeFilters={activeFilters}
          onClear={handleClearFilters}
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
              <strong>{productCount || 0}</strong>
              <span>products in this catalog view</span>
            </div>
          </div>
          <div className="products-toolbar">
            <div className="products-toolbar-copy">
              <strong>{category ? `${category}${subcategory ? ` / ${subcategory}` : ''}` : 'All categories'}</strong>
              <span>
                {hasFiltersApplied
                  ? 'Filters are shaping the current catalog view.'
                  : 'Browse everything or narrow results with filters.'}
              </span>
            </div>
            {activeFilters.length > 0 ? (
              <div className="products-active-filters" aria-label="Active catalog filters">
                {activeFilters.map((filter) => (
                  <span key={filter.label} className="products-filter-pill">
                    {filter.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="catalog-feature-row">
            <button
              type="button"
              className={`catalog-feature-card ${!category ? 'active' : ''}`}
              onClick={() => handleCategory('')}
            >
              <strong>All Categories</strong>
              <span>{catalogMeta.categories.length} departments</span>
            </button>
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

          {subcategories.length > 0 ? (
            <div className="products-subcategory-row">
              <button
                type="button"
                className={`products-subcategory-pill ${!subcategory ? 'active' : ''}`}
                onClick={() => handleSubcategory('')}
              >
                All subcategories
              </button>
              {subcategories.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`products-subcategory-pill ${
                    subcategory === item.label ? 'active' : ''
                  }`}
                  onClick={() => handleSubcategory(item.label)}
                >
                  <span>{item.label}</span>
                  <small>{item.count}</small>
                </button>
              ))}
            </div>
          ) : null}

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

          <Pagination
            currentPage={currentPage}
            onPageChange={handlePageChange}
            totalPages={totalPage}
            totalResults={productCount}
            currentResults={products.length}
          />
        </div>
      </div>
    </>
  );
};

export default Products;
