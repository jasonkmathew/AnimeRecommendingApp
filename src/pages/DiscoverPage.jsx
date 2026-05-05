import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import AnimeList from '../components/anime/AnimeList';
import { rateLimitedFetchPaginated, GENRE_IDS } from '../lib/jikan';
import { useDebounce } from '../hooks/useDebounce';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
  'Thriller', 'Mecha', 'Music', 'Psychological', 'Historical',
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
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalResults, setTotalResults] = useState(null);
  const topRef = useRef(null);

  const query = searchParams.get('q') || '';
  const [inputQuery, setInputQuery] = useState(query);
  const debouncedQuery = useDebounce(inputQuery, 500);

  const genre = searchParams.get('genre') || '';
  const type = searchParams.get('type') || '';
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sort') || 'score';
  const page = parseInt(searchParams.get('page') || '1');

  // Sync debounced query to URL params
  useEffect(() => {
    if (debouncedQuery !== query) {
      const next = new URLSearchParams(searchParams);
      if (debouncedQuery) {
        next.set('q', debouncedQuery);
      } else {
        next.delete('q');
      }
      next.set('page', '1');
      setSearchParams(next);
    }
  }, [debouncedQuery]);

  const fetchAnime = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);

      // Convert genre name → ID for Jikan API
      if (genre && GENRE_IDS[genre]) {
        params.set('genres', GENRE_IDS[genre]);
      }

      if (type) params.set('type', type);
      if (status) {
        const statusMap = { Airing: 'airing', Complete: 'complete', Upcoming: 'upcoming' };
        params.set('status', statusMap[status] || status.toLowerCase());
      }

      params.set('order_by', SORT_MAP[sortBy] || 'score');
      params.set('sort', 'desc');
      params.set('limit', '25');
      params.set('page', page);
      params.set('sfw', 'true');

      const url = `https://api.jikan.moe/v4/anime?${params}`;
      const { data, pagination } = await rateLimitedFetchPaginated(url);
      setAnimeList(data || []);
      setHasNextPage(pagination?.has_next_page ?? false);
      setTotalResults(pagination?.items?.total ?? null);
    } catch (err) {
      console.error(err);
      setError('Failed to load anime. The API may be rate-limited — please try again in a moment.');
      setAnimeList([]);
    } finally {
      setLoading(false);
    }
  }, [query, genre, type, status, sortBy, page]);

  useEffect(() => {
    fetchAnime();
  }, [fetchAnime]);

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

  const goToPage = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page-discover" ref={topRef}>
      <motion.div
        className="discover-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Discover Anime</h1>
        <p>
          Search the full MyAnimeList database
          {totalResults != null && <span className="discover-total"> — {totalResults.toLocaleString()} titles found</span>}
        </p>
      </motion.div>

      <form className="discover-search" onSubmit={(e) => e.preventDefault()}>
        <Search size={18} />
        <input
          type="text"
          placeholder="Search any title, e.g. Fullmetal Alchemist..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
        />
        {loading && <Loader2 size={18} className="spin discover-loading-icon" />}
        <button
          type="button"
          className={`btn-ghost ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={18} />
          Filters
        </button>
      </form>

      <AnimatePresence>
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
                <button className={`chip ${!genre ? 'active' : ''}`} onClick={() => updateParam('genre', '')}>All</button>
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
                <option value="title">Title A–Z</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(query || genre || type || status) && (
        <div className="discover-results-info">
          {query && <span>Results for "{query}"</span>}
          {genre && <span className="chip active">{genre}</span>}
          {type && <span className="chip active">{type}</span>}
          {status && <span className="chip active">{status}</span>}
          <button
            className="btn-ghost btn-sm"
            onClick={() => { setInputQuery(''); setSearchParams(new URLSearchParams()); }}
          >
            Clear all
          </button>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button className="btn-ghost btn-sm" onClick={fetchAnime}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      <AnimeList animeList={animeList} loading={loading} />

      {/* Pagination */}
      {!loading && (animeList.length > 0 || page > 1) && (
        <div className="pagination">
          <button
            className="btn-ghost"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="pagination-info">Page {page}</span>
          <button
            className="btn-ghost"
            onClick={() => goToPage(page + 1)}
            disabled={!hasNextPage}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
