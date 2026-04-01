import React, { useEffect, useRef, useState } from 'react';
import '../pageStyles/Home.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ImageSlider from '../components/ImageSlider';
import Product from '../components/Product';
import PageTitle from '../components/PageTitle';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

import { useSelector } from 'react-redux';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import apiClient from '../utils/apiClient';

const Home = () => {
  const { recentlyViewed } = useSelector((state) => state.user);
  const mostViewedRef = useRef(null);
  const topRatedRef = useRef(null);
  const recentlyViewedRef = useRef(null);
  const [sections, setSections] = useState({
    mostViewed: [],
    topRated: [],
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
        const [mostViewedRes, topRatedRes] = await Promise.all([
          apiClient.get('/products?limit=4&sort=viewedDesc'),
          apiClient.get('/products?limit=4&sort=ratingDesc'),
        ]);

        setSections({
          mostViewed: mostViewedRes.data?.data || [],
          topRated: topRatedRes.data?.data || [],
        });
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
      {loading ? (
        <Loader />
      ) : (
        <>
          <PageTitle title="HOME" />
          <Navbar />
          <ImageSlider />
          <div className="home-container">
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

            {recentlyViewed.length > 0 && (
              renderSliderSection({
                sectionRef: recentlyViewedRef,
                kicker: 'Just For You',
                heading: 'Recently Viewed',
                products: recentlyViewed,
                keyPrefix: 'recent',
              })
            )}
          </div>
          <Footer />
        </>
      )}
    </>
  );
};

export default Home;
