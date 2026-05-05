import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Check, Loader as Loader2 } from 'lucide-react';
import { searchAnime } from '../../lib/jikan';
import { useWatchlist } from '../../hooks/useWatchlist';

const STATUS_OPTIONS = [
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'plan_to_watch', label: 'Plan to Watch' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'dropped', label: 'Dropped' },
];

export default function AddAnimeModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());
  const [selectedStatus, setSelectedStatus] = useState('completed');
  const { addToWatchlist, isInWatchlist } = useWatchlist();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchAnime(query, 12);
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (anime) => {
    setAddingId(anime.mal_id);
    try {
      await addToWatchlist(anime, selectedStatus);
      setAddedIds(prev => new Set([...prev, anime.mal_id]));
    } catch (err) {
      console.error(err);
    } finally {
      setAddingId(null);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setAddedIds(new Set());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="modal-content modal-content-lg"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={handleClose} aria-label="Close">
              <X size={20} />
            </button>

            <div className="add-anime-header">
              <h2>Add Anime to Your List</h2>
              <p>Search for anime you've watched or want to watch</p>
            </div>

            <form className="add-anime-search" onSubmit={handleSearch}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by title, e.g. Attack on Titan"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-primary" disabled={loading || !query.trim()}>
                {loading ? <Loader2 size={16} className="spin" /> : 'Search'}
              </button>
            </form>

            <div className="add-anime-status-row">
              <span>Add as:</span>
              <div className="status-chips">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`chip ${selectedStatus === opt.value ? 'active' : ''}`}
                    onClick={() => setSelectedStatus(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="add-anime-results">
              {results.length === 0 && !loading && query && (
                <p className="status-text">Search for anime above to add them to your list.</p>
              )}
              {results.length === 0 && !loading && !query && (
                <p className="status-text">Type a title to search the MyAnimeList database.</p>
              )}
              {results.map((anime, i) => {
                const alreadyInList = isInWatchlist(anime.mal_id);
                const justAdded = addedIds.has(anime.mal_id);
                const isAdding = addingId === anime.mal_id;
                const image = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;

                return (
                  <motion.div
                    key={anime.mal_id}
                    className="add-anime-result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <img src={image} alt={anime.title} loading="lazy" />
                    <div className="add-anime-result-info">
                      <h3>{anime.title}</h3>
                      <div className="add-anime-result-meta">
                        {anime.score && <span>Score: {anime.score}</span>}
                        {anime.episodes && <span>{anime.episodes} eps</span>}
                        {anime.type && <span>{anime.type}</span>}
                      </div>
                      <div className="chip-row">
                        {(anime.genres || []).slice(0, 3).map(g => (
                          <span key={g.mal_id} className="chip">{g.name}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      className={`add-anime-btn ${alreadyInList || justAdded ? 'added' : ''}`}
                      onClick={() => handleAdd(anime)}
                      disabled={alreadyInList || justAdded || isAdding}
                    >
                      {isAdding ? (
                        <Loader2 size={16} className="spin" />
                      ) : alreadyInList || justAdded ? (
                        <><Check size={16} /> In List</>
                      ) : (
                        <><Plus size={16} /> Add</>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
