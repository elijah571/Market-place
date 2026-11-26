import React, { useMemo } from 'react';
import '../pageStyles/Home.css';
import PageTitle from '../components/PageTitle';
import { Link } from 'react-router-dom';
import { pickRandomBackground } from '../utils/backgrounds';

const Home = () => {
  const heroBackground = useMemo(() => pickRandomBackground(), []);

  return (
    <>
      <PageTitle title="HOME" />
      <div className="home-page">
        {/* HERO */}
        <section className="home-hero">
          <div className="home-hero-copy">
            <p className="home-kicker">Limited time offer</p>

            <h1>Grab Upto 50% Off On Selected Items</h1>

            <p className="home-hero-text">
              Shop the season&apos;s best deals across your favourite categories —
              curated, fast, and delivered right to your door.
            </p>

            <div className="home-hero-actions">
              <Link to="/products" className="home-primary-btn">
                Buy Now
              </Link>
              <Link to="/favorites" className="home-secondary-btn">
                Your wishlist
              </Link>
            </div>
          </div>

          <div
            className="home-hero-visual"
            style={{ '--hero-image': `url(${heroBackground})` }}
            aria-hidden="true"
          />
        </section>
      </div>
    </>
  );
};

export default Home;
