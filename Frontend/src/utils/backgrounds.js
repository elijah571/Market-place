export const storefrontBackgrounds = [
  '/images/banner1.jpeg',
  '/images/banner2.jpeg',
  '/images/banner3.jpeg',
  '/images/banner4.jpeg',
  '/images/banner5.jpg',
];

export const pickRandomBackground = (excluded = []) => {
  const blocked = new Set(excluded.filter(Boolean));
  const available = storefrontBackgrounds.filter((image) => !blocked.has(image));

  if (!available.length) {
    return storefrontBackgrounds[0];
  }

  return available[Math.floor(Math.random() * available.length)];
};
