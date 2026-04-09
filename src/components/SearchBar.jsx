import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (event) => {
    event.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSearch} className="search-bar" role="search">
      <input
        type="text"
        placeholder="Search anime, e.g. Fullmetal Alchemist"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button type="submit">Explore</button>
    </form>
  );
};

export default SearchBar;
