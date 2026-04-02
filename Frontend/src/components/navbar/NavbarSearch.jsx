import React, { memo, useId } from 'react';
import { Search } from '@mui/icons-material';

const NavbarSearch = ({
  searchQuery,
  onSearchQueryChange,
  onSubmit,
  className = '',
  buttonLabel = 'Search',
  placeholder = 'Search products, categories, or brands',
}) => {
  const inputId = useId();

  return (
    <form
      className={className ? `navbar-search ${className}` : 'navbar-search'}
      role="search"
      onSubmit={onSubmit}
    >
      <label className="sr-only" htmlFor={inputId}>
        Search products, categories, or brands
      </label>
      <Search fontSize="small" aria-hidden="true" />
      <input
        id={inputId}
        type="search"
        className="navbar-search-input"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
      />
      <button type="submit" className="navbar-search-button">
        {buttonLabel}
      </button>
    </form>
  );
};

export default memo(NavbarSearch);
