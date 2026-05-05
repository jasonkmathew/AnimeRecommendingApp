import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Bookmark, Play, Clock, Film,
  ExternalLink, ChevronRight, Tv, X as XIcon,
} from 'lucide-react';
import { getAnimeDetail, getAnimeRecommendations, getAnimeCharacters } from '../lib/jikan';
import { useAuth } from '../contexts/AuthContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { useActivity } from '../hooks/useActivity';
import { useToast } from '../contexts/ToastContext';
import StarRating from '../components/ui/StarRating';
import AnimeList from '../components/anime/AnimeList';
import { DetailSkeleton } from '../components/ui/Skeleton';

export default function AnimeDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, getWatchlistEntry, rateAnime, updateWatchlistStatus } = useWatchlist();
  const { logActivity } = useActivity();
  const toast = useToast();
  const [anime, setAnime] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [trailerOpen, setTrailerOpen] = useState(false);

  const inList = isInWatchlist(parseInt(id));
  const watchlistEntry = getWatchlistEntry(parseInt(id));

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const [detail, chars, recs] = await Promise.allSettled([
          getAnimeDetail(parseInt(id)),
          getAnimeCharacters(parseInt(id)),
          getAnimeRecommendations(parseInt(id)),
        ]);
        if (detail.status === 'fulfilled') setAnime(detail.value);
        if (chars.status === 'fulfilled') setCharacters(chars.value?.slice(0, 12) || []);
        if (recs.status === 'fulfilled') setRecommendations(recs.value?.slice(0, 6) || []);
        if (user) logActivity(parseInt(id), 'view_detail', { title: detail.value?.title });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, user]);

  if (loading) return <DetailSkeleton />;
  if (!anime) return <div className="error-banner">Anime not found.</div>;

  const image = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const trailerUrl = anime.trailer?.url;
  const recAnime = recommendations.map(r => r.entry).filter(Boolean);

  const handleWatchlistToggle = async () => {
    if (inList) {
      await removeFromWatchlist(parseInt(id));
      toast(`"${anime.title}" removed from watchlist`, 'info');
    } else {
      await addToWatchlist(anime, 'plan_to_watch');
      toast(`"${anime.title}" added to watchlist`, 'success');
    }
  };

  const handleRate = async (rating) => {
    if (!user) return;
    if (!inList) await addToWatchlist(anime, 'completed');
    await rateAnime(parseInt(id), rating);
    toast(`Rated ${rating}/10`, 'success');
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'characters', label: 'Characters' },
    { id: 'related', label: 'Related' },
    { id: 'recommendations', label: 'Recommendations' },
  ];

  return (
    <div className="page-detail">
      <div className="detail-hero" style={{ backgroundImage: `url(${image})` }}>
        <div className="detail-hero-overlay" />
        <div className="detail-hero-content">
          <motion.img
            src={image}
            alt={anime.title}
            className="detail-poster"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="detail-info"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="detail-badges">
              {anime.type && <span className="badge">{anime.type}</span>}
              {anime.status && <span className="badge">{anime.status}</span>}
              {anime.season && anime.year && (
                <span className="badge">{anime.season} {anime.year}</span>
              )}
            </div>
            <h1>{anime.title}</h1>
            {anime.title_japanese && <p className="detail-jp-title">{anime.title_japanese}</p>}

            <div className="detail-score-row">
              <div className="detail-score-big">
                <Star size={24} fill="var(--accent)" stroke="var(--accent)" />
                <span>{anime.score || 'N/A'}</span>
                <small>{anime.scored_by?.toLocaleString() || 0} users</small>
              </div>
              {anime.rank && <span className="detail-rank">#{anime.rank} Ranked</span>}
              {anime.popularity && <span className="detail-rank">#{anime.popularity} Popular</span>}
            </div>

            <div className="detail-meta-row">
              {anime.episodes && (
                <span><Film size={16} /> {anime.episodes} episodes</span>
              )}
              {anime.duration && (
                <span><Clock size={16} /> {anime.duration}</span>
              )}
              {anime.studios?.length > 0 && (
                <span><Tv size={16} /> {anime.studios.map(s => s.name).join(', ')}</span>
              )}
            </div>

            <div className="chip-row">
              {(anime.genres || []).map(g => (
                <Link key={g.mal_id} to={`/discover?genre=${g.name}`} className="chip">{g.name}</Link>
              ))}
              {(anime.themes || []).map(t => (
                <span key={t.mal_id} className="chip chip-outline">{t.name}</span>
              ))}
            </div>

            <div className="detail-actions">
              {user && (
                <>
                  <button
                    className={`btn-primary ${inList ? 'btn-active' : ''}`}
                    onClick={handleWatchlistToggle}
                  >
                    <Bookmark size={18} fill={inList ? 'currentColor' : 'none'} />
                    {inList ? 'In Watchlist' : 'Add to Watchlist'}
                  </button>
                  {inList && (
                    <select
                      value={watchlistEntry?.status || 'plan_to_watch'}
                      onChange={(e) => updateWatchlistStatus(parseInt(id), e.target.value)}
                      className="status-select"
                    >
                      <option value="watching">Watching</option>
                      <option value="completed">Completed</option>
                      <option value="plan_to_watch">Plan to Watch</option>
                      <option value="on_hold">On Hold</option>
                      <option value="dropped">Dropped</option>
                    </select>
                  )}
                </>
              )}
              {trailerUrl && (
                <button className="btn-ghost" onClick={() => setTrailerOpen(true)}>
                  <Play size={18} /> Watch Trailer
                </button>
              )}
              {anime.url && (
                <a href={anime.url} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  <ExternalLink size={18} /> MyAnimeList
                </a>
              )}
            </div>

            {user && inList && (
              <div className="detail-user-rating">
                <span>Your Rating:</span>
                <StarRating
                  rating={watchlistEntry?.user_rating || 0}
                  onRate={handleRate}
                  size={18}
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="detail-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`detail-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="detail-tab-content">
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="detail-overview">
            <div className="detail-synopsis">
              <h2>Synopsis</h2>
              <p>{anime.synopsis || 'No synopsis available.'}</p>
            </div>
            {anime.background && (
              <div className="detail-background">
                <h2>Background</h2>
                <p>{anime.background}</p>
              </div>
            )}
            <div className="detail-info-grid">
              {anime.source && <div className="info-item"><label>Source</label><span>{anime.source}</span></div>}
              {anime.aired?.string && <div className="info-item"><label>Aired</label><span>{anime.aired.string}</span></div>}
              {anime.rating && <div className="info-item"><label>Rating</label><span>{anime.rating}</span></div>}
              {anime.members && <div className="info-item"><label>Members</label><span>{anime.members.toLocaleString()}</span></div>}
              {anime.favorites && <div className="info-item"><label>Favorites</label><span>{anime.favorites.toLocaleString()}</span></div>}
            </div>
            {anime.streaming?.length > 0 && (
              <div className="detail-streaming">
                <h2>Where to Watch</h2>
                <div className="streaming-links">
                  {anime.streaming.map(s => (
                    <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="streaming-link">
                      <ExternalLink size={14} /> {s.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {anime.opening_themes?.length > 0 && (
              <div className="detail-themes">
                <h2>Opening Themes</h2>
                {anime.opening_themes.map((t, i) => <p key={i}>{t}</p>)}
              </div>
            )}
            {anime.ending_themes?.length > 0 && (
              <div className="detail-themes">
                <h2>Ending Themes</h2>
                {anime.ending_themes.map((t, i) => <p key={i}>{t}</p>)}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'characters' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="detail-characters">
            {characters.length === 0 ? <p className="status-text">No character data available.</p> : (
              <div className="character-grid">
                {characters.map((c) => (
                  <div key={c.character?.mal_id} className="character-card">
                    <img
                      src={c.character?.images?.jpg?.image_url}
                      alt={c.character?.name}
                      loading="lazy"
                    />
                    <div>
                      <h3>{c.character?.name}</h3>
                      <span>{c.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'related' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="detail-related">
            {anime.relations?.length === 0 ? <p className="status-text">No related anime found.</p> : (
              <div className="related-list">
                {anime.relations?.map((rel, i) => (
                  <div key={i} className="related-group">
                    <h3>{rel.relation}</h3>
                    <div className="related-entries">
                      {rel.entry.map((entry) => (
                        <Link
                          key={entry.mal_id}
                          to={entry.type === 'anime' ? `/anime/${entry.mal_id}` : '#'}
                          className="related-entry"
                        >
                          <ChevronRight size={14} />
                          <span>{entry.name}</span>
                          <span className="chip chip-sm">{entry.type}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'recommendations' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AnimeList animeList={recAnime} />
          </motion.div>
        )}
      </div>

      {/* Trailer modal */}
      <AnimatePresence>
        {trailerOpen && trailerUrl && (
          <motion.div
            className="modal-overlay trailer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTrailerOpen(false)}
          >
            <motion.div
              className="trailer-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="trailer-close" onClick={() => setTrailerOpen(false)} aria-label="Close trailer">
                <XIcon size={20} />
              </button>
              <div className="trailer-embed">
                <iframe
                  src={trailerUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                  title={`${anime.title} trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
