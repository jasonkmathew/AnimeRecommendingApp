import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Calendar, Zap } from 'lucide-react';
import SearchBar from '../components/anime/SearchBar';
import AnimeList from '../components/anime/AnimeList';
import RecommendationSection from '../components/anime/RecommendationSection';
import { getTrending, getSeasonal, getAnimeRecommendations } from '../lib/jikan';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../hooks/useActivity';

const SORT_OPTIONS = {
  popularity: (a, b) => (a?.popularity ?? Number.MAX_SAFE_INTEGER) - (b?.popularity ?? Number.MAX_SAFE_INTEGER),
  score: (a, b) => (b?.score ?? 0) - (a?.score ?? 0),
  favorites: (a, b) => (b?.favorites ?? 0) - (a?.favorites ?? 0),
  title: (a, b) => (a?.title ?? '').localeCompare(b?.title ?? ''),
};

export default function HomePage() {
  const { user } = useAuth();
  const { logActivity } = useActivity();
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [seasonalHighlights, setSeasonalHighlights] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [activeAnime, setActiveAnime] = useState(null);
  const [genreFilter, setGenreFilter] = useState('All');
  const [sortBy, setSortBy] = useState('score');
  const [loading, setLoading] = useState({ trending: false, seasonal: false, search: false, recommendations: false });
  const [error, setError] = useState(null);

  const fetchData = async (url, onSuccess, onErrorKey, loadingKey) => {
    try {
      setError(null);
      setLoading((prev) => ({ ...prev, [loadingKey]: true }));
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const data = await response.json();
      onSuccess(data?.data ?? []);
    } catch (err) {
      console.error(err);
      setError(`Failed to load ${onErrorKey}. Please try again.`);
    } finally {
      setLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  useEffect(() => {
    fetchData('https://api.jikan.moe/v4/top/anime?limit=24', setTrendingAnime, 'trending anime', 'trending');
    fetchData('https://api.jikan.moe/v4/seasons/now?limit=12', setSeasonalHighlights, 'seasonal highlights', 'seasonal');
  }, []);

  const handleSearch = (query) => {
    if (!query?.trim()) { setSearchResults([]); return; }
    fetchData(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&order_by=members&sort=desc&limit=24`,
      (data) => { setSearchResults(data); setRecommendations([]); setActiveAnime(null); },
      'search results', 'search'
    );
  };

  const handleShowRecommendations = (anime) => {
    if (!anime?.mal_id) return;
    setActiveAnime(anime);
    if (user) logActivity(anime.mal_id, 'recommend', { title: anime.title });
    fetchData(
      `https://api.jikan.moe/v4/anime/${anime.mal_id}/recommendations`,
      setRecommendations, 'recommendations', 'recommendations'
    );
  };

  const displayPool = searchResults.length > 0 ? searchResults : trendingAnime;

  const availableGenres = useMemo(() => {
    const genres = new Set();
    displayPool.forEach((anime) => anime?.genres?.forEach((genre) => genres.add(genre.name)));
    return ['All', ...Array.from(genres).sort()];
  }, [displayPool]);

  const filteredAndSorted = useMemo(() => {
    const filtered = genreFilter === 'All'
      ? displayPool
      : displayPool.filter((anime) => anime?.genres?.some((genre) => genre.name === genreFilter));
    return [...filtered].sort(SORT_OPTIONS[sortBy]);
  }, [displayPool, genreFilter, sortBy]);

  const appStats = useMemo(() => [
    { label: 'Visible Titles', value: filteredAndSorted.length, icon: Zap },
    { label: 'Average Score', value: (() => {
      const scored = filteredAndSorted.filter(a => a?.score);
      return scored.length ? (scored.reduce((acc, a) => acc + a.score, 0) / scored.length).toFixed(2) : 'N/A';
    })(), icon: TrendingUp },
    { label: 'Community Members', value: filteredAndSorted.reduce((acc, a) => acc + (a?.members ?? 0), 0).toLocaleString(), icon: Calendar },
  ], [filteredAndSorted]);

  return (
    <div className="page-home">
      <motion.header
        className="hero"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="badge">
          <Sparkles size={14} />
          Anime Intelligence Hub
        </div>
        <h1>Build your next obsession.</h1>
        <p>Discover top-rated series, explore what's hot this season, and generate recommendations tailored to any title you love.</p>
        <SearchBar onSearch={handleSearch} large />
      </motion.header>

      {error && <div className="error-banner">{error}</div>}

      <motion.section
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {appStats.map((stat, i) => (
          <motion.article
            key={stat.label}
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <stat.icon size={20} className="stat-icon" />
            <p>{stat.label}</p>
            <h3>{stat.value}</h3>
          </motion.article>
        ))}
      </motion.section>

      <section className="controls-panel">
        <div>
          <label htmlFor="genre-filter">Genre</label>
          <select id="genre-filter" value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
            {availableGenres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sort-by">Sort By</label>
          <select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="score">Score</option>
            <option value="popularity">Popularity</option>
            <option value="favorites">Favorites</option>
            <option value="title">Title</option>
          </select>
        </div>
      </section>

      <section>
        <div className="section-heading">
          <h2>{searchResults.length > 0 ? 'Search Discoveries' : 'Trending Anime'}</h2>
          <p>{searchResults.length > 0 ? 'Based on your query' : 'Global fan favorites'}</p>
        </div>
        <AnimeList
          animeList={filteredAndSorted}
          loading={loading.search || loading.trending}
          onShowRecommendations={handleShowRecommendations}
        />
      </section>

      <section>
        <div className="section-heading">
          <h2>Seasonal Highlights</h2>
          <p>Currently airing standouts</p>
        </div>
        <AnimeList
          animeList={seasonalHighlights}
          loading={loading.seasonal}
          onShowRecommendations={handleShowRecommendations}
          compact
        />
      </section>

      <RecommendationSection
        recommendations={recommendations}
        loading={loading.recommendations}
        activeAnime={activeAnime}
      />
    </div>
  );
}
