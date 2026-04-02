import React, { memo } from 'react';
import { Search } from '@mui/icons-material';

const NavbarSearch = ({
  searchQuery,
  onSearchQueryChange,
  onSubmit,
}) => {
  return (
    <form className="navbar-search" role="search" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="navbar-search-input">
        Search products, categories, or brands
      </label>
      <Search fontSize="small" aria-hidden="true" />
      <input
        id="navbar-search-input"
        type="search"
        className="navbar-search-input"
        placeholder="Search products, categories, or brands"
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
      />
      <button type="submit" className="navbar-search-button">
        Search
      </button>
    </form>
  );
};

export default memo(NavbarSearch);
