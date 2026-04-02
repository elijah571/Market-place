import React, { useEffect } from 'react';

const PageTitle = ({ title }) => {
  useEffect(() => {
    document.title = title ? `${title} | Market Place` : 'Market Place';
  }, [title]);

  return null;
};

export default PageTitle;
