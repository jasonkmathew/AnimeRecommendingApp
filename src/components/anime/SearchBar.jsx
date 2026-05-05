import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';

export default function SearchBar({ onSearch, large = false }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    } else if (query.trim()) {
      navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`search-bar ${large ? 'search-bar-large' : ''}`} role="search">
      <Search size={large ? 20 : 16} />
      <input
        type="text"
        placeholder="Search anime, e.g. Fullmetal Alchemist"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <motion.button
        type="submit"
        className="btn-primary"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {large ? 'Explore' : <ArrowRight size={18} />}
      </motion.button>
    </form>
  );
}
