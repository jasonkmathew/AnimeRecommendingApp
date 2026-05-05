import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Bookmark, Star, TrendingUp, Clock, CircleCheck as CheckCircle, Pause, Trash2, ChartBar as BarChart3, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWatchlist } from '../hooks/useWatchlist';
import StarRating from '../components/ui/StarRating';

const STATUS_CONFIG = {
  watching: { label: 'Watching', icon: Clock, color: 'var(--accent)' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'var(--success)' },
  plan_to_watch: { label: 'Plan to Watch', icon: Bookmark, color: 'var(--warning)' },
  on_hold: { label: 'On Hold', icon: Pause, color: 'var(--info)' },
  dropped: { label: 'Dropped', icon: Trash2, color: 'var(--error)' },
};

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const { watchlist, loading, updateWatchlistStatus, rateAnime, removeFromWatchlist } = useWatchlist();
  const [statusFilter, setStatusFilter] = useState('all');

  if (!user) {
    return (
      <div className="page-profile-empty">
        <User size={48} />
        <h2>Sign in to view your profile</h2>
        <p>Your watchlist, ratings, and taste profile live here.</p>
      </div>
    );
  }

  const filteredWatchlist = statusFilter === 'all'
    ? watchlist
    : watchlist.filter(w => w.status === statusFilter);

  const stats = useMemo(() => {
    const total = watchlist.length;
    const watching = watchlist.filter(w => w.status === 'watching').length;
    const completed = watchlist.filter(w => w.status === 'completed').length;
    const rated = watchlist.filter(w => w.user_rating);
    const avgRating = rated.length
      ? (rated.reduce((acc, w) => acc + w.user_rating, 0) / rated.length).toFixed(1)
      : 'N/A';
    const totalEps = watchlist.reduce((acc, w) => acc + (w.episodes || 0), 0);

    const genreMap = {};
    watchlist.forEach(w => {
      (w.genres || '').split(',').filter(Boolean).forEach(g => {
        genreMap[g.trim()] = (genreMap[g.trim()] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { total, watching, completed, avgRating, totalEps, topGenres, rated: rated.length };
  }, [watchlist]);

  return (
    <div className="page-profile">
      <motion.div
        className="profile-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="profile-avatar">
          <div className="avatar-lg">
            {user.email?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
        <div className="profile-info">
          <h1>{profile?.username || user.email?.split('@')[0] || 'Anime Fan'}</h1>
          <p>{user.email}</p>
          <p className="profile-joined">Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString()}</p>
        </div>
        <button className="btn-ghost" onClick={signOut}>Sign Out</button>
      </motion.div>

      <motion.div
        className="profile-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="stat-card">
          <Bookmark size={20} className="stat-icon" />
          <p>Total Entries</p>
          <h3>{stats.total}</h3>
        </div>
        <div className="stat-card">
          <CheckCircle size={20} className="stat-icon" />
          <p>Completed</p>
          <h3>{stats.completed}</h3>
        </div>
        <div className="stat-card">
          <Star size={20} className="stat-icon" />
          <p>Avg Rating</p>
          <h3>{stats.avgRating}</h3>
        </div>
        <div className="stat-card">
          <Film size={20} className="stat-icon" />
          <p>Total Episodes</p>
          <h3>{stats.totalEps.toLocaleString()}</h3>
        </div>
      </motion.div>

      {stats.topGenres.length > 0 && (
        <motion.div
          className="taste-profile"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2><Award size={20} /> Your Taste Profile</h2>
          <div className="taste-bars">
            {stats.topGenres.map(([genre, count]) => (
              <div key={genre} className="taste-bar">
                <span className="taste-label">{genre}</span>
                <div className="taste-track">
                  <motion.div
                    className="taste-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / stats.total) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
                <span className="taste-count">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="watchlist-section">
        <div className="watchlist-header">
          <h2><Bookmark size={20} /> Watchlist</h2>
          <div className="watchlist-filters">
            <button
              className={`chip ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >All ({stats.total})</button>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => {
              const count = watchlist.filter(w => w.status === key).length;
              return (
                <button
                  key={key}
                  className={`chip ${statusFilter === key ? 'active' : ''}`}
                  onClick={() => setStatusFilter(key)}
                >{label} ({count})</button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <p className="status-text">Loading watchlist...</p>
        ) : filteredWatchlist.length === 0 ? (
          <p className="status-text">No entries in this category.</p>
        ) : (
          <div className="watchlist-grid">
            {filteredWatchlist.map((entry, i) => {
              const statusCfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.plan_to_watch;
              return (
                <motion.div
                  key={entry.id}
                  className="watchlist-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link to={`/anime/${entry.mal_id}`} className="watchlist-card-link">
                    <img src={entry.image_url} alt={entry.title} loading="lazy" />
                    <div>
                      <h3>{entry.title}</h3>
                      <div className="watchlist-card-meta">
                        <span style={{ color: statusCfg.color }}>{statusCfg.label}</span>
                        {entry.episodes && <span>{entry.episodes} eps</span>}
                        {entry.score > 0 && <span>MAL: {entry.score}</span>}
                      </div>
                      {entry.user_rating && (
                        <div className="watchlist-rating">
                          <Star size={14} fill="var(--accent)" stroke="var(--accent)" />
                          <span>{entry.user_rating}/10</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="watchlist-card-actions">
                    <select
                      value={entry.status}
                      onChange={(e) => updateWatchlistStatus(entry.mal_id, e.target.value)}
                      className="status-select-sm"
                    >
                      {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <StarRating
                      rating={entry.user_rating || 0}
                      onRate={(rating) => rateAnime(entry.mal_id, rating)}
                      size={14}
                    />
                    <button
                      className="btn-icon-danger"
                      onClick={() => removeFromWatchlist(entry.mal_id)}
                      aria-label="Remove from watchlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Film(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M17 3v18"/><path d="M3 7.5h4"/><path d="M17 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 16.5h4"/>
    </svg>
  );
}
