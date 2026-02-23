import React, { useEffect, useState } from 'react';
import '../componentStyles/ImageSlider.css';

const images = [
  ' https://www-konga-com-res.cloudinary.com/image/upload/f_auto,fl_lossy,dpr_auto,q_auto,w_1200//v1770883551/contentservice/Premium%20banner-samsung.png_1q5qjGXiJ.png',
  'https://www-konga-com-res.cloudinary.com/image/upload/f_auto,fl_lossy,dpr_auto,q_auto,w_1200//v1770712246/contentservice/Premium%20Banner%202%20%288%29.png_GLTHdl0yEI.png',
  'https://www-konga-com-res.cloudinary.com/image/upload/f_auto,fl_lossy,dpr_auto,q_auto,w_1200//v1770285181/contentservice/SILKBV%20-%202.png_EdP_-Qr7S.png',
  'https://www-konga-com-res.cloudinary.com/image/upload/f_auto,fl_lossy,dpr_auto,q_auto,w_1200//v1770197964/contentservice/ASUS%20CHRISTMAS%20SALES%20%281%29.png_cd_lKD7DN.png',
];
const ImageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="image-slider-container">
      <div
        className="slider-images"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div className="slider-item" key={index}>
            <img src={image} alt={`slide ${index + 1}`} />
          </div>
        ))}
      </div>
      <div className="slider-dots">
        {images.map((_, index) => (
          <span
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            key={index}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
