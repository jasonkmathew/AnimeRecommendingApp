import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Bookmark, Play } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWatchlist } from '../../hooks/useWatchlist';

export default function AnimeCard({ anime, index = 0, compact = false }) {
  const { user } = useAuth();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const image = anime?.images?.jpg?.large_image_url || anime?.images?.jpg?.image_url;
  const inList = isInWatchlist(anime?.mal_id);

  const handleWatchlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (inList) {
      removeFromWatchlist(anime.mal_id);
    } else {
      addToWatchlist(anime, 'plan_to_watch');
    }
  };

  return (
    <motion.article
      className={`anime-card ${compact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link to={`/anime/${anime?.mal_id}`} className="anime-card-link">
        <div className="anime-card-image">
          <img src={image} alt={anime?.title || 'Anime poster'} loading="lazy" />
          <div className="anime-card-overlay">
            <Play size={32} />
          </div>
          {anime?.score && (
            <div className="anime-card-score">
              <Star size={12} />
              <span>{anime.score}</span>
            </div>
          )}
        </div>
        <div className="anime-content">
          <h3>{anime?.title || 'Unknown Title'}</h3>
          <p className="meta">
            {anime?.episodes ? `${anime.episodes} eps` : 'TBA'} • {anime?.type || 'TV'}
          </p>
          {!compact && anime?.synopsis && (
            <p className="synopsis">{anime.synopsis}</p>
          )}
          <div className="chip-row">
            {(anime?.genres || []).slice(0, compact ? 2 : 3).map((genre) => (
              <span key={`${anime?.mal_id}-${genre.name}`} className="chip">
                {genre.name}
              </span>
            ))}
          </div>
        </div>
      </Link>
      {user && (
        <button
          className={`watchlist-toggle ${inList ? 'active' : ''}`}
          onClick={handleWatchlistToggle}
          aria-label={inList ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Bookmark size={16} fill={inList ? 'currentColor' : 'none'} />
        </button>
      )}
    </motion.article>
  );
}
