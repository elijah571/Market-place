import React, { useEffect, useRef, useState } from 'react';
import '../pageStyles/Home.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import Product from '../components/Product';
import PageTitle from '../components/PageTitle';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ProductSkeletonGrid from '../components/ProductSkeletonGrid';
import { storefrontService } from '../services/storefront.service';
import { Link } from 'react-router-dom';
import { formatCompactNumber } from '../utils/formatters';

const Home = () => {
  const { recentlyViewed } = useSelector((state) => state.user);
  const mostViewedRef = useRef(null);
  const topRatedRef = useRef(null);
  const recentlyViewedRef = useRef(null);
  const [sections, setSections] = useState({
    mostViewed: [],
    topRated: [],
    meta: {
      categories: [],
      priceRange: { min: 0, max: 0 },
    },
  });
  const [loading, setLoading] = useState(true);

  const scrollSection = (sectionRef, direction) => {
    if (!sectionRef?.current) {
      return;
    }

    const { clientWidth } = sectionRef.current;
    sectionRef.current.scrollBy({
      left: direction * Math.max(clientWidth * 0.82, 280),
      behavior: 'smooth',
    });
  };

  const renderSliderSection = ({
    sectionRef,
    kicker,
    heading,
    subtitle,
    products,
    emptyMessage = 'No products to display right now.',
    keyPrefix,
  }) => (
    <section className="home-section">
      <div className="home-section-top">
        <div className="home-section-copy">
          <p className="home-kicker">{kicker}</p>
          <h2 className="home-heading">{heading}</h2>
          {subtitle ? <p className="home-subheading">{subtitle}</p> : null}
        </div>
        <div className="home-slider-controls">
          <button
            type="button"
            className="home-slider-btn"
            onClick={() => scrollSection(sectionRef, -1)}
            aria-label={`Scroll ${heading} left`}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className="home-slider-btn"
            onClick={() => scrollSection(sectionRef, 1)}
            aria-label={`Scroll ${heading} right`}
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="home-product-slider" ref={sectionRef}>
          {products.map((product) => (
            <div className="home-product-slide" key={`${keyPrefix}-${product._id}`}>
              <Product product={product} />
            </div>
          ))}
        </div>
      ) : (
        <p className="home-empty-state">{emptyMessage}</p>
      )}
    </section>
  );

  useEffect(() => {
    const loadHomeSections = async () => {
      setLoading(true);
      try {
        const data = await storefrontService.getHomeCollections();
        setSections(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load home products');
      } finally {
        setLoading(false);
      }
    };

    loadHomeSections();
  }, []);

  return (
    <>
      <PageTitle title="HOME" />
      <Navbar />
      <div className="home-page">
        <section className="home-hero">
          <div className="home-hero-copy">
            <p className="home-kicker">Jumia-inspired shopping, reworked for speed</p>
            <h1>Discover fast-moving deals, guided checkout, and a cleaner shopping flow.</h1>
            <p className="home-hero-text">
              Browse curated collections, save products you love, reuse saved addresses, and move
              from discovery to payment with less friction.
            </p>
            <div className="home-hero-actions">
              <Link to="/products" className="home-primary-btn">
                Shop now
              </Link>
              <Link to="/favorites" className="home-secondary-btn">
                View wishlist
              </Link>
            </div>
            <div className="home-hero-stats">
              <article>
                <strong>{formatCompactNumber(sections.mostViewed.length || 0)}+</strong>
                <span>Trending picks</span>
              </article>
              <article>
                <strong>{formatCompactNumber(sections.meta.categories.length || 0)}</strong>
                <span>Categories</span>
              </article>
              <article>
                <strong>24/7</strong>
                <span>Checkout availability</span>
              </article>
            </div>
          </div>
          <div className="home-hero-panel">
            <div className="hero-panel-card accent">
              <span>Best sellers</span>
              <strong>High-intent collections</strong>
              <p>Top viewed and top rated products are surfaced automatically for faster discovery.</p>
            </div>
            <div className="hero-panel-grid">
              {sections.meta.categories.slice(0, 4).map((category) => (
                <Link
                  key={category.label}
                  to={`/products?category=${encodeURIComponent(category.label)}`}
                  className="hero-category-card"
                >
                  <strong>{category.label}</strong>
                  <span>{category.count} products</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="home-feature-strip">
          <article>
            <strong>Wishlist & Recently Viewed</strong>
            <p>Bring shoppers back with lightweight intent signals already built into the flow.</p>
          </article>
          <article>
            <strong>Saved Address Checkout</strong>
            <p>Repeat purchases are faster with reusable address cards and guided checkout steps.</p>
          </article>
          <article>
            <strong>Analytics-Ready Admin</strong>
            <p>Revenue, traffic, top products, and order status breakdowns now sit in one place.</p>
          </article>
        </section>

        <div className="home-container">
          {loading ? (
            <ProductSkeletonGrid count={8} />
          ) : (
            <>
              <section className="home-category-section">
                <div className="home-section-top">
                  <div className="home-section-copy">
                    <p className="home-kicker">Browse By Category</p>
                    <h2 className="home-heading">Start with the departments shoppers use most</h2>
                  </div>
                </div>
                <div className="home-category-grid">
                  {sections.meta.categories.map((category) => (
                    <Link
                      key={`grid-${category.label}`}
                      to={`/products?category=${encodeURIComponent(category.label)}`}
                      className="home-category-card"
                    >
                      <strong>{category.label}</strong>
                      <span>{category.count} items</span>
                      <small>
                        {(category.subcategories || [])
                          .slice(0, 2)
                          .map((item) => item.label)
                          .join(' • ') || 'Top picks inside'}
                      </small>
                    </Link>
                  ))}
                </div>
              </section>

              {renderSliderSection({
                sectionRef: mostViewedRef,
                kicker: 'Storefront Highlights',
                heading: 'Most Viewed Products',
                subtitle: 'Products shoppers are opening and checking out the most right now.',
                products: sections.mostViewed,
                keyPrefix: 'viewed',
              })}

              {renderSliderSection({
                sectionRef: topRatedRef,
                kicker: 'Customer Favorites',
                heading: 'Top Rated Products',
                subtitle: 'The highest-rated picks based on reviews from your customers.',
                products: sections.topRated,
                keyPrefix: 'rated',
              })}

              {recentlyViewed.length > 0 &&
                renderSliderSection({
                  sectionRef: recentlyViewedRef,
                  kicker: 'Just For You',
                  heading: 'Recently Viewed',
                  products: recentlyViewed,
                  keyPrefix: 'recent',
                })}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;
