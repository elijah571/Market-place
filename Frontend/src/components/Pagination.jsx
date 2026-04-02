import React from 'react';
import '../componentStyles/Pagination.css';

const Pagination = ({
  currentPage,
  onPageChange,
  totalPages = 0,
  totalResults = 0,
  currentResults = 0,
  activeClass = 'active',
  nextPageText = 'Next',
  prevPageText = 'Prev',
}) => {
  if (totalResults <= 0) {
    return null;
  }

  const getPageNumbers = () => {
    const pages = [];
    const lastPage = Math.max(totalPages, 1);

    for (let page = 1; page <= lastPage; page += 1) {
      const isEdgePage = page === 1 || page === lastPage;
      const isNearbyPage = Math.abs(page - currentPage) <= 1;

      if (isEdgePage || isNearbyPage) {
        pages.push(page);
        continue;
      }

      const previousEntry = pages[pages.length - 1];
      if (previousEntry !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }

    return pages;
  };

  return (
    <nav className="pagination-shell" aria-label="Catalog pagination">
      <div className="pagination-summary">
        <strong>
          Page {Math.min(currentPage, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}
        </strong>
        <span>
          Showing {currentResults} of {totalResults} products
        </span>
      </div>

      {totalPages > 1 ? (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            {prevPageText}
          </button>

          {getPageNumbers().map((number, index) =>
            number === 'ellipsis' ? (
              <span className="pagination-ellipsis" key={`ellipsis-${index}`}>
                ...
              </span>
            ) : (
              <button
                className={`pagination-btn ${
                  currentPage === number ? activeClass : ''
                }`}
                key={number}
                onClick={() => onPageChange(number)}
                aria-current={currentPage === number ? 'page' : undefined}
              >
                {number}
              </button>
            )
          )}

          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            {nextPageText}
          </button>
        </div>
      ) : null}
    </nav>
  );
};

export default Pagination;
