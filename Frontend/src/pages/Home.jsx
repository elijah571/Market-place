import React, { useMemo, useRef } from 'react';
import '../pageStyles/Home.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import Product from '../components/Product';
import PageTitle from '../components/PageTitle';
import ImageSlider from '../components/ImageSlider';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import ProductSkeletonGrid from '../components/ProductSkeletonGrid';
import { Link } from 'react-router-dom';
import { formatCompactNumber } from '../utils/formatters';
import { pickRandomBackground } from '../utils/backgrounds';
import { useHomeCollections } from '../features/catalog/catalogQueries';

const HomeSliderSection = ({
  sectionRef,
  kicker,
  heading,
  subtitle,
  products,
  emptyMessage = 'No products to display right now.',
  keyPrefix,
  onScroll,
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
          onClick={() => onScroll(sectionRef, -1)}
          aria-label={`Scroll ${heading} left`}
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          className="home-slider-btn"
          onClick={() => onScroll(sectionRef, 1)}
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

const Home = () => {
  const { recentlyViewed } = useSelector((state) => state.user);
  const mostViewedRef = useRef(null);
  const topRatedRef = useRef(null);
  const recentlyViewedRef = useRef(null);
  const heroBackground = useMemo(() => pickRandomBackground(), []);
  const spotlightBackground = useMemo(
    () => pickRandomBackground([heroBackground]),
    [heroBackground]
  );
  const {
    data: sections = {
      mostViewed: [],
      topRated: [],
      meta: {
        categories: [],
        priceRange: { min: 0, max: 0 },
      },
    },
    isLoading: loading,
  } = useHomeCollections();

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

  return (
    <>
      <PageTitle title="HOME" />
      <Navbar />
      <div className="home-page">
        <section
          className="home-hero home-surface home-backdrop"
          style={{ '--hero-image': `url(${heroBackground})` }}
        >
          <div className="home-hero-copy">
            <p className="home-kicker">Fresh storefront layout</p>
            <h1>Discover fast-moving deals in a storefront that feels editorial, bright, and quick.</h1>
            <p className="home-hero-text">
              Browse curated collections, save products you love, reuse saved addresses, and move
              from discovery to payment with a more visual shopping experience.
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
            <div
              className="hero-panel-card accent hero-panel-spotlight"
              style={{ '--spotlight-image': `url(${spotlightBackground})` }}
            >
              <span>Storefront spotlight</span>
              <strong>Shoppable scenes with stronger visual rhythm</strong>
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
          <ImageSlider />
          <section className="home-editorial-ribbon home-surface">
            <article>
              <span>Curated layout</span>
              <strong>Image-led sections make discovery feel more premium.</strong>
            </article>
            <article>
              <span>Faster intent</span>
              <strong>Most-viewed, top-rated, and recently-viewed products are easier to scan.</strong>
            </article>
            <article>
              <span>Checkout clarity</span>
              <strong>Saved address flows and cart sync status stay visible while shopping.</strong>
            </article>
          </section>
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

              <HomeSliderSection
                sectionRef={mostViewedRef}
                kicker="Storefront Highlights"
                heading="Most Viewed Products"
                subtitle="Products shoppers are opening and checking out the most right now."
                products={sections.mostViewed}
                keyPrefix="viewed"
                onScroll={scrollSection}
              />

              <HomeSliderSection
                sectionRef={topRatedRef}
                kicker="Customer Favorites"
                heading="Top Rated Products"
                subtitle="The highest-rated picks based on reviews from your customers."
                products={sections.topRated}
                keyPrefix="rated"
                onScroll={scrollSection}
              />

              {recentlyViewed.length > 0 &&
                (
                  <HomeSliderSection
                    sectionRef={recentlyViewedRef}
                    kicker="Just For You"
                    heading="Recently Viewed"
                    products={recentlyViewed}
                    keyPrefix="recent"
                    onScroll={scrollSection}
                  />
                )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;
