import React from 'react';
import {
  Phone,
  Mail,
  GitHub,
  LinkedIn,
  YouTube,
  Instagram,
} from '@mui/icons-material';
import '../componentStyles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Section 1*/}
        <div className="footer-section contact">
          <h3>Contact Us</h3>
          <p>
            <Phone fontSize="small" /> Phone: +234667889
          </p>
          <p>
            <Mail fontSize="small" />
            Email: elijahfx43@gmail.com
          </p>
        </div>
        {/* section 2 */}
        <div className="footer-section social">
          <h3>Follow me</h3>
          <div className="social-links">
            <a href="" target="_blank">
              <GitHub className="social-icon" />
            </a>
            <LinkedIn className="social-icon" />

            <YouTube className="social-icon" />

            <Instagram className="social-icon" />
          </div>
        </div>
        {/* Section 3 */}
        <div className="footer-section about">
          <h3>About</h3>
          <p>
            Providing web development tutorials and courses to help you grow
            your skills.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 ElijhCoding. All rights Reversed</p>
      </div>
    </footer>
  );
};

export default Footer;
