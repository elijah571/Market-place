import React from 'react';
import '../componentStyles/Pagination.css';
import { useSelector } from 'react-redux';

const Pagination = ({
  currentPage,
  onPageChange,
  activeClass = 'active',
  nextPageText = 'Next',
  prevPageText = 'Prev',
  firstPageText = '1st',
  lastPageText = 'Last',
}) => {
  const { totalPage, products } = useSelector((state) => state.product);

  if (!products || products.length === 0 || totalPage <= 1) return null;

  const getPageNumbers = () => {
    const pageNumbers = [];
    const pageWindow = 2;

    for (
      let i = Math.max(1, currentPage - pageWindow);
      i <= Math.min(totalPage, currentPage + pageWindow);
      i++
    ) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return (
    <div className="pagination">
      {currentPage > 1 && (
        <>
          <button className="pagination-btn" onClick={() => onPageChange(1)}>
            {firstPageText}
          </button>

          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
          >
            {prevPageText}
          </button>
        </>
      )}

      {getPageNumbers().map((number) => (
        <button
          className={`pagination-btn ${
            currentPage === number ? activeClass : ''
          }`}
          key={number}
          onClick={() => onPageChange(number)}
        >
          {number}
        </button>
      ))}

      {currentPage < totalPage && (
        <>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
          >
            {nextPageText}
          </button>

          <button
            className="pagination-btn"
            onClick={() => onPageChange(totalPage)}
          >
            {lastPageText}
          </button>
        </>
      )}
    </div>
  );
};

export default Pagination;
