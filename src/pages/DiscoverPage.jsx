import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Search, RefreshCw } from 'lucide-react';
import AnimeList from '../components/anime/AnimeList';
import { rateLimitedFetch } from '../lib/jikan';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
  'Thriller', 'Mecha', 'Music', 'Psychological',
];

const TYPES = ['TV', 'Movie', 'OVA', 'Special', 'ONA'];
const STATUSES = ['Airing', 'Complete', 'Upcoming'];

const SORT_MAP = {
  score: 'score',
  popularity: 'members',
  favorites: 'favorites',
  title: 'title',
};

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get('q') || '';
  const [inputQuery, setInputQuery] = useState(query);
  const genre = searchParams.get('genre') || '';
  const type = searchParams.get('type') || '';
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sort') || 'score';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchAnime = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = [];
      if (query) params.push(`q=${encodeURIComponent(query)}`);
      if (genre) params.push(`genres=${encodeURIComponent(genre)}`);
      if (type) params.push(`type=${type}`);
      if (status) params.push(`status=${status === 'Airing' ? 'airing' : status === 'Complete' ? 'complete' : 'upcoming'}`);
      params.push(`order_by=${SORT_MAP[sortBy] || 'score'}`);
      params.push('sort=desc');
      params.push(`limit=24`);
      params.push(`page=${page}`);

      const url = `https://api.jikan.moe/v4/anime?${params.join('&')}`;
      const res = await rateLimitedFetch(url);
      setAnimeList(res || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load anime. The API may be rate-limited -- please try again in a moment.');
      setAnimeList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnime();
  }, [query, genre, type, status, sortBy, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParam('q', inputQuery);
  };

  return (
    <div className="page-discover">
      <motion.div
        className="discover-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Discover Anime</h1>
        <p>Explore the full catalog with advanced filters</p>
      </motion.div>

      <form className="discover-search" onSubmit={handleSearch}>
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by title..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary">Search</button>
        <button
          type="button"
          className={`btn-ghost ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={18} />
          Filters
        </button>
      </form>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button className="btn-ghost btn-sm" onClick={fetchAnime}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {showFilters && (
        <motion.div
          className="filter-panel"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="filter-group">
            <label>Genre</label>
            <div className="filter-chips">
              <button
                className={`chip ${!genre ? 'active' : ''}`}
                onClick={() => updateParam('genre', '')}
              >All</button>
              {GENRES.map(g => (
                <button
                  key={g}
                  className={`chip ${genre === g ? 'active' : ''}`}
                  onClick={() => updateParam('genre', g)}
                >{g}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Type</label>
            <div className="filter-chips">
              <button className={`chip ${!type ? 'active' : ''}`} onClick={() => updateParam('type', '')}>All</button>
              {TYPES.map(t => (
                <button key={t} className={`chip ${type === t ? 'active' : ''}`} onClick={() => updateParam('type', t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-chips">
              <button className={`chip ${!status ? 'active' : ''}`} onClick={() => updateParam('status', '')}>All</button>
              {STATUSES.map(s => (
                <button key={s} className={`chip ${status === s ? 'active' : ''}`} onClick={() => updateParam('status', s)}>{s}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => updateParam('sort', e.target.value)}>
              <option value="score">Score</option>
              <option value="popularity">Popularity</option>
              <option value="favorites">Favorites</option>
              <option value="title">Title</option>
            </select>
          </div>
        </motion.div>
      )}

      <div className="discover-results-info">
        {query && <span>Results for "{query}"</span>}
        {genre && <span className="chip active">{genre}</span>}
        {type && <span className="chip active">{type}</span>}
      </div>

      <AnimeList animeList={animeList} loading={loading} />

      <div className="pagination">
        {page > 1 && (
          <button className="btn-ghost" onClick={() => updateParam('page', String(page - 1))}>
            Previous
          </button>
        )}
        <span>Page {page}</span>
        {animeList.length === 24 && (
          <button className="btn-ghost" onClick={() => updateParam('page', String(page + 1))}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
