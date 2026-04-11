import React, { Suspense, lazy, memo, useMemo, useRef } from 'react';
import '../pageStyles/Home.css';
import Product from '../components/Product';
import PageTitle from '../components/PageTitle';
import { useSelector } from 'react-redux';
import ProductSkeletonGrid from '../components/ProductSkeletonGrid';
import { Link } from 'react-router-dom';
import { formatCompactNumber } from '../utils/formatters';
import { pickRandomBackground } from '../utils/backgrounds';
import { useHomeCollections } from '../features/catalog/catalogQueries';

const ImageSlider = lazy(() => import('../components/ImageSlider'));

const HomeSliderSection = memo(({
  kicker,
  heading,
  subtitle,
  products,
  emptyMessage = 'Nothing here yet. Check back soon.',
  keyPrefix,
}) => (
  <section className="home-section">
    <div className="home-section-top">
      <div className="home-section-copy">
        <p className="home-kicker">{kicker}</p>
        <h2 className="home-heading">{heading}</h2>
        {subtitle ? <p className="home-subheading">{subtitle}</p> : null}
      </div>
    </div>

    {products.length > 0 ? (
      <div className="home-product-grid">
        {products.slice(0, 3).map((product) => (
          <div className="home-product-slide" key={`${keyPrefix}-${product._id}`}>
            <Product product={product} />
          </div>
        ))}
      </div>
    ) : (
      <p className="home-empty-state">{emptyMessage}</p>
    )}
  </section>
));

const Home = () => {
  const { recentlyViewed } = useSelector((state) => state.user);
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
      },
    },
    isLoading: loading,
  } = useHomeCollections();

  return (
    <>
      <PageTitle title="HOME" />
      <div className="home-page">

        {/* HERO */}
        <section
          className="home-hero home-surface home-backdrop"
          style={{ '--hero-image': `url(${heroBackground})` }}
        >
          <div className="home-hero-copy">
            <p className="home-kicker">A better way to shop</p>

            <h1>
              Discover products that feel made for you.
            </h1>

            <p className="home-hero-text">
              A faster, cleaner shopping experience designed to help you find what matters,
              save what you love, and check out without friction.
            </p>

            <div className="home-hero-highlights">
              <span>Seamless checkout</span>
              <span>Smart recommendations</span>
              <span>Effortless browsing</span>
            </div>

            <div className="home-hero-actions">
              <Link to="/products" className="home-primary-btn">
                Explore products
              </Link>
              <Link to="/favorites" className="home-secondary-btn">
                Your wishlist
              </Link>
            </div>

            <div className="home-hero-stats">
              <article>
                <strong>{formatCompactNumber(sections.mostViewed.length || 0)}+</strong>
                <span>Trending now</span>
              </article>
              <article>
                <strong>{formatCompactNumber(sections.topRated.length || 0)}+</strong>
                <span>Top rated</span>
              </article>
              <article>
                <strong>24/7</strong>
                <span>Always available</span>
              </article>
            </div>
          </div>

          <div className="home-hero-panel">
            <div
              className="hero-panel-card accent hero-panel-spotlight"
              style={{ '--spotlight-image': `url(${spotlightBackground})` }}
            >
              <div className="hero-panel-heading">
                <span>Featured experience</span>
                <small>Built for speed</small>
              </div>

              <strong>
                Designed to help you decide faster.
              </strong>

              <p>
                The products people love most are surfaced instantly — so you spend less time searching.
              </p>

              <div className="hero-panel-meta">
                <span>Trending</span>
                <span>Top picks</span>
                <span>Your history</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE STRIP */}
        <section className="home-feature-strip">
          <article>
            <strong>Smarter browsing</strong>
            <p>Everything you interact with shapes what you see next.</p>
          </article>
          <article>
            <strong>Faster checkout</strong>
            <p>Saved details make every purchase feel instant.</p>
          </article>
          <article>
            <strong>Built for clarity</strong>
            <p>No clutter. Just products, decisions, and flow.</p>
          </article>
        </section>

        <div className="home-container">
          <Suspense fallback={<div className="home-section">Loading experience...</div>}>
            <ImageSlider />
          </Suspense>

          {/* EDITORIAL STRIP */}
          <section className="home-editorial-ribbon home-surface">
            <article>
              <span>Visual first</span>
              <strong>Discover products through immersive layouts.</strong>
            </article>
            <article>
              <span>Less searching</span>
              <strong>We surface what matters before you ask.</strong>
            </article>
            <article>
              <span>Frictionless</span>
              <strong>From discovery to checkout in seconds.</strong>
            </article>
          </section>

          {loading ? (
            <ProductSkeletonGrid count={8} />
          ) : (
            <>
              <HomeSliderSection
                kicker="Trending now"
                heading="Most viewed products"
                subtitle="What everyone is checking out right now."
                products={sections.mostViewed}
                keyPrefix="viewed"
              />

              <HomeSliderSection
                kicker="Top picks"
                heading="Highest rated products"
                subtitle="Loved by customers. Proven by reviews."
                products={sections.topRated}
                keyPrefix="rated"
              />

              {recentlyViewed.length > 0 && (
                <HomeSliderSection
                  kicker="Pick up where you left off"
                  heading="Recently viewed"
                  subtitle="Your last interactions, ready when you are."
                  products={recentlyViewed}
                  keyPrefix="recent"
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;