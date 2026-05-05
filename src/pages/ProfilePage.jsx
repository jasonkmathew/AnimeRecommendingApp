import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User, Bookmark, Star, Clock, CircleCheck as CheckCircle, Pause,
  Trash2, Award, Plus, Sparkles, RefreshCw, ListVideo, Clapperboard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { useToast } from '../contexts/ToastContext';
import StarRating from '../components/ui/StarRating';
import AddAnimeModal from '../components/ui/AddAnimeModal';

const STATUS_CONFIG = {
  watching: { label: 'Watching', icon: Clock, color: 'var(--accent)' },
  completed: { label: 'Watched', icon: CheckCircle, color: 'var(--success)' },
  plan_to_watch: { label: 'Want to Watch', icon: Bookmark, color: 'var(--warning)' },
  on_hold: { label: 'On Hold', icon: Pause, color: 'var(--info)' },
  dropped: { label: 'Dropped', icon: Trash2, color: 'var(--error)' },
};

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const { watchlist, loading, updateWatchlistStatus, rateAnime, removeFromWatchlist } = useWatchlist();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('watched');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState(null);

  const watchedList = useMemo(() => watchlist.filter(w => w.status === 'completed' || w.status === 'watching'), [watchlist]);
  const wantList = useMemo(() => watchlist.filter(w => w.status === 'plan_to_watch'), [watchlist]);
  const displayList = activeTab === 'watched' ? watchedList : wantList;

  const stats = useMemo(() => {
    const total = watchlist.length;
    const completed = watchlist.filter(w => w.status === 'completed').length;
    const watching = watchlist.filter(w => w.status === 'watching').length;
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

    return { total, completed, watching, avgRating, totalEps, topGenres, rated: rated.length };
  }, [watchlist]);

  const fetchRecommendations = async () => {
    if (!user || watchlist.length === 0) return;
    setRecsLoading(true);
    setRecsError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/recommend/for-you?user_id=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error('Recommendation fetch failed');
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error(err);
      setRecsError('Could not load recommendations. Try again in a moment.');
    } finally {
      setRecsLoading(false);
    }
  };

  useEffect(() => {
    if (user && watchlist.length > 0) {
      fetchRecommendations();
    }
  }, [user, watchlist.length]);

  if (!user) {
    return (
      <div className="page-profile-empty">
        <User size={48} />
        <h2>Sign in to view your profile</h2>
        <p>Your watchlist, ratings, and taste profile live here.</p>
      </div>
    );
  }

  return (
    <div className="page-profile">
      {/* Profile Header */}
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

      {/* Stats */}
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
          <p>Watched</p>
          <h3>{stats.completed}</h3>
        </div>
        <div className="stat-card">
          <Star size={20} className="stat-icon" />
          <p>Avg Rating</p>
          <h3>{stats.avgRating}</h3>
        </div>
        <div className="stat-card">
          <Clapperboard size={20} className="stat-icon" />
          <p>Total Episodes</p>
          <h3>{stats.totalEps.toLocaleString()}</h3>
        </div>
      </motion.div>

      {/* Taste Profile */}
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

      {/* My Anime List - Tabs Section */}
      <div className="watchlist-section">
        <div className="watchlist-section-top">
          <h2 className="watchlist-title"><ListVideo size={24} /> My Anime List</h2>
          <button className="btn-primary" onClick={() => setAddModalOpen(true)}>
            <Plus size={18} /> Add Anime
          </button>
        </div>

        <div className="watchlist-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'watched'}
            className={`watchlist-tab ${activeTab === 'watched' ? 'active' : ''}`}
            onClick={() => setActiveTab('watched')}
          >
            <CheckCircle size={18} />
            <span className="watchlist-tab-label">Watched</span>
            <span className="tab-count">{watchedList.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'want'}
            className={`watchlist-tab ${activeTab === 'want' ? 'active' : ''}`}
            onClick={() => setActiveTab('want')}
          >
            <Bookmark size={18} />
            <span className="watchlist-tab-label">Want to Watch</span>
            <span className="tab-count">{wantList.length}</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="watchlist-tab-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <p className="status-text">Loading...</p>
            ) : displayList.length === 0 ? (
              <div className="empty-watchlist">
                <div className="empty-watchlist-icon">
                  {activeTab === 'watched' ? <Clapperboard size={40} /> : <Bookmark size={40} />}
                </div>
                <p className="empty-watchlist-text">
                  {activeTab === 'watched'
                    ? "You haven't added any anime you've watched yet."
                    : "Your want-to-watch list is empty."}
                </p>
                <button className="btn-primary btn-lg" onClick={() => setAddModalOpen(true)}>
                  <Plus size={18} /> {activeTab === 'watched' ? 'Add Anime You\'ve Watched' : 'Add Anime to Watch'}
                </button>
              </div>
            ) : (
              <div className="watchlist-grid">
                {displayList.map((entry, i) => {
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Recommendations Based on Your List */}
      {watchlist.length > 0 && (
        <div className="profile-recs-section">
          <div className="section-heading">
            <h2><Sparkles size={20} /> Recommended For You</h2>
            <p>Based on your watchlist and taste profile</p>
          </div>

          {recsError && (
            <div className="error-banner">
              <span>{recsError}</span>
              <button className="btn-ghost btn-sm" onClick={fetchRecommendations}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}

          {recsLoading ? (
            <p className="status-text">Finding your next obsession...</p>
          ) : recommendations.length > 0 ? (
            <div className="profile-recs-grid">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={rec.mal_id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link to={`/anime/${rec.mal_id}`} className="profile-rec-card">
                    <img src={rec.image_url} alt={rec.title} loading="lazy" />
                    <div className="profile-rec-info">
                      <h3>{rec.title}</h3>
                      {rec.score && (
                        <div className="profile-rec-score">
                          <Star size={12} fill="var(--accent)" stroke="var(--accent)" />
                          <span>{rec.score}</span>
                        </div>
                      )}
                      {rec.genres?.length > 0 && (
                        <div className="chip-row">
                          {rec.genres.slice(0, 3).map(g => (
                            <span key={g} className="chip">{g}</span>
                          ))}
                        </div>
                      )}
                      {rec.reason && <p className="profile-rec-reason">{rec.reason}</p>}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            !recsError && <p className="status-text">Add more anime to your list to unlock personalized recommendations.</p>
          )}
        </div>
      )}

      <AddAnimeModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
}
