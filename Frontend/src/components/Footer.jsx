import React from 'react';
import { Phone, Mail } from '@mui/icons-material';
import '../componentStyles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Section 1*/}
        <div className="footer-section contact">
          <h3>Contact Us</h3>
          <p>
            <Phone /> Phone: +234667889
          </p>
          <p>
            <Mail />
            Email: elijahfx43@gmail.com
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
