import React, { useEffect, useMemo, useState } from 'react';
import { ArrowBackIosNew, ArrowForwardIos, East } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import '../componentStyles/ImageSlider.css';
import { storefrontBackgrounds } from '../utils/backgrounds';

const defaultSlides = [
  {
    image: storefrontBackgrounds[0],
    eyebrow: 'Seasonal edit',
    title: 'Fresh arrivals with a faster checkout path',
    description: 'Browse trending products, save favorites, and move through checkout with fewer interruptions.',
    ctaLabel: 'Shop the edit',
    ctaHref: '/products',
  },
  {
    image: storefrontBackgrounds[1],
    eyebrow: 'Wishlist flow',
    title: 'Save what catches your eye and come back with context',
    description: 'Wishlist, recently viewed, and category shortcuts keep product discovery feeling lightweight.',
    ctaLabel: 'View favorites',
    ctaHref: '/favorites',
  },
  {
    image: storefrontBackgrounds[2],
    eyebrow: 'Guided delivery',
    title: 'Checkout built around saved addresses and cleaner order review',
    description: 'Shipping details, promo savings, and payment setup are clearer across desktop and mobile.',
    ctaLabel: 'Start shopping',
    ctaHref: '/products',
  },
];

const ImageSlider = ({ slides = defaultSlides, autoPlayMs = 5500 }) => {
  const normalizedSlides = useMemo(
    () => (Array.isArray(slides) && slides.length ? slides : defaultSlides),
    [slides]
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % normalizedSlides.length);
    }, autoPlayMs);

    return () => window.clearInterval(interval);
  }, [autoPlayMs, normalizedSlides.length]);

  const handleMove = (direction) => {
    setCurrentIndex((prevIndex) => {
      if (direction > 0) {
        return (prevIndex + 1) % normalizedSlides.length;
      }

      return (prevIndex - 1 + normalizedSlides.length) % normalizedSlides.length;
    });
  };

  return (
    <section className="image-slider-shell">
      <div
        className="slider-images"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {normalizedSlides.map((slide) => (
          <article className="slider-item" key={`${slide.title}-${slide.image}`}>
            <div
              className="slider-media"
              style={{ '--slide-image': `url(${slide.image})` }}
            />
            <div className="slider-copy">
              <p>{slide.eyebrow}</p>
              <h2>{slide.title}</h2>
              <span>{slide.description}</span>
              <Link to={slide.ctaHref} className="slider-link">
                {slide.ctaLabel}
                <East fontSize="inherit" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="slider-nav">
        <div className="slider-dots">
          {normalizedSlides.map((slide, index) => (
            <button
              type="button"
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Show slide ${index + 1}: ${slide.title}`}
              key={`${slide.title}-${index}`}
            />
          ))}
        </div>

        <div className="slider-buttons">
          <button
            type="button"
            className="slider-control"
            onClick={() => handleMove(-1)}
            aria-label="Previous promotion"
          >
            <ArrowBackIosNew fontSize="inherit" />
          </button>
          <button
            type="button"
            className="slider-control"
            onClick={() => handleMove(1)}
            aria-label="Next promotion"
          >
            <ArrowForwardIos fontSize="inherit" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ImageSlider;
