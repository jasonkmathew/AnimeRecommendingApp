import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowLeft, RotateCcw, Heart, Zap, Star,
  Bookmark, BookmarkCheck, Loader2, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { useToast } from '../contexts/ToastContext';
import { rateLimitedFetch } from '../lib/jikan';

// --- Quiz definition -----------------------------------------------------------

const QUESTIONS = [
  {
    id: 'mood',
    question: "What genre are you feeling?",
    options: [
      { label: 'Action / Fighting', value: 'action', emoji: '⚔️' },
      { label: 'Romance / Drama', value: 'romance', emoji: '💫' },
      { label: 'Comedy / Slice of Life', value: 'slice_of_life', emoji: '🌸' },
      { label: 'Thriller / Dark', value: 'thriller', emoji: '🌑' },
      { label: 'Fantasy / Adventure', value: 'fantasy', emoji: '🧙' },
      { label: 'Sci-Fi / Mecha', value: 'sci_fi', emoji: '🚀' },
      { label: 'Mind-bending / Psychological', value: 'psychological', emoji: '🧠' },
    ],
  },
  {
    id: 'length',
    question: 'How long should it be?',
    options: [
      { label: 'Movie (under 2 hrs)', value: 'Movie', emoji: '🎬' },
      { label: 'Short — 12 or 13 episodes', value: 'short', emoji: '⚡' },
      { label: 'Standard — around 24 episodes', value: 'standard', emoji: '📺' },
      { label: "Long — 50+ episodes, I'm committed", value: 'long', emoji: '📚' },
      { label: "Doesn't matter", value: 'any', emoji: '♾️' },
    ],
  },
  {
    id: 'emotion',
    question: 'How do you want to feel watching it?',
    options: [
      { label: 'Pumped up & hyped', value: 'excitement', emoji: '🔥' },
      { label: 'Emotional — ready to cry', value: 'tears', emoji: '😢' },
      { label: 'Happy & warm inside', value: 'warm', emoji: '🥰' },
      { label: 'Thinking deeply & unsettled', value: 'existential', emoji: '🌀' },
      { label: 'Laughing the whole time', value: 'joy', emoji: '😂' },
    ],
  },
  {
    id: 'setting',
    question: 'Pick a world.',
    options: [
      { label: 'Fantasy realms with magic', value: 'fantasy', emoji: '✨' },
      { label: 'Space or the far future', value: 'sci_fi', emoji: '🛸' },
      { label: 'Real-world / everyday life', value: 'realistic', emoji: '🗾' },
      { label: 'Historical or feudal era', value: 'historical', emoji: '⚔️' },
      { label: 'Any world is fine', value: 'any', emoji: '🎲' },
    ],
  },
  {
    id: 'dealbreaker',
    question: 'One hard rule — pick what you hate most.',
    options: [
      { label: 'Filler episodes / padding', value: 'no_filler', emoji: '🚫' },
      { label: 'Bad or no ending', value: 'needs_ending', emoji: '🏁' },
      { label: 'Excessive fan service', value: 'no_fanservice', emoji: '🙅' },
      { label: 'Painfully slow start', value: 'fast_start', emoji: '💤' },
      { label: 'No dealbreakers for me', value: 'none', emoji: '🤷' },
    ],
  },
];

// --- Genre ID mapping ----------------------------------------------------------

const MOOD_GENRES = {
  action: [1],
  slice_of_life: [36],
  thriller: [7, 41],
  romance: [22],
  psychological: [40],
  fantasy: [10],
  sci_fi: [24],
};

const EMOTION_GENRES = {
  tears: [8],       // drama
  warm: [36],       // slice of life
  existential: [40],
  joy: [4],         // comedy
  excitement: [1],  // action
};

const SETTING_GENRES = {
  fantasy: [10],
  sci_fi: [24],
  historical: [13],
  dystopian: [40, 24],
};

// Build Jikan query params from answers
function buildQueries(answers) {
  const primary = MOOD_GENRES[answers.mood] || [1];
  const emotion = EMOTION_GENRES[answers.emotion] || [];
  const setting = SETTING_GENRES[answers.setting] || [];

  // Merge and deduplicate, cap at 3 to avoid over-filtering
  const merged = [...new Set([...primary, ...emotion, ...setting])].slice(0, 2);

  const type = answers.length === 'Movie' ? 'Movie' : answers.length === 'any' ? '' : 'TV';
  const minScore = answers.dealbreaker === 'needs_ending' ? 7.0 : 6.0;

  // Main query — intersection of genres
  const params1 = new URLSearchParams({
    genres: merged.join(','),
    order_by: 'score',
    sort: 'desc',
    limit: 12,
    min_score: minScore,
    sfw: 'true',
  });
  if (type) params1.set('type', type);

  // Fallback query — just the primary genre, broader
  const params2 = new URLSearchParams({
    genres: primary.join(','),
    order_by: 'score',
    sort: 'desc',
    limit: 12,
    min_score: 7.0,
    sfw: 'true',
  });
  if (type) params2.set('type', type);

  return {
    main: `https://api.jikan.moe/v4/anime?${params1}`,
    fallback: `https://api.jikan.moe/v4/anime?${params2}`,
  };
}

function computeCompatibility(anime, index, total) {
  if (!anime.score) return Math.max(65, 88 - index * 5);
  const scoreBase = Math.round(((anime.score - 5) / 5) * 45 + 50);
  const popularityBonus = Math.min(8, Math.round(Math.log10(anime.members || 1) * 1.5));
  const positionPenalty = index * 4;
  return Math.min(99, Math.max(62, scoreBase + popularityBonus - positionPenalty));
}

async function fetchMatchResults(answers) {
  const { main, fallback } = buildQueries(answers);

  let results = await rateLimitedFetch(main);

  // Fallback if we don't get enough
  if (!results || results.length < 4) {
    const fb = await rateLimitedFetch(fallback);
    // Merge, deduplicate by mal_id, keep best
    const map = new Map();
    [...(results || []), ...(fb || [])].forEach(a => {
      if (!map.has(a.mal_id)) map.set(a.mal_id, a);
    });
    results = Array.from(map.values());
  }

  return (results || [])
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5)
    .map((anime, i, arr) => ({
      ...anime,
      compatibility: computeCompatibility(anime, i, arr.length),
    }));
}

// --- Component ----------------------------------------------------------------

export default function MatchPage() {
  const { user } = useAuth();
  const { isInWatchlist, addToWatchlist } = useWatchlist();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [addingId, setAddingId] = useState(null);

  const currentQuestion = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;
  const isLastStep = step === QUESTIONS.length - 1;

  const handleAnswer = async (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (isLastStep) {
      setFetchingResults(true);
      setFetchError(null);
      try {
        const computed = await fetchMatchResults(newAnswers);
        setResults(computed);
        setShowResults(true);
      } catch (err) {
        console.error(err);
        setFetchError('Could not load recommendations. The API may be rate-limited — please try again.');
      } finally {
        setFetchingResults(false);
      }
    } else {
      setTimeout(() => setStep(s => s + 1), 280);
    }
  };

  const handleAddToWatchlist = async (anime) => {
    if (!user) {
      toast('Sign in to save anime to your watchlist', 'info');
      return;
    }
    setAddingId(anime.mal_id);
    try {
      await addToWatchlist(anime, 'plan_to_watch');
      toast(`"${anime.title}" added to watchlist`, 'success');
    } catch {
      toast('Failed to add to watchlist', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleRestart = () => {
    setStep(0);
    setAnswers({});
    setResults(null);
    setShowResults(false);
    setFetchError(null);
    setFetchingResults(false);
  };

  // Loading screen
  if (fetchingResults) {
    return (
      <div className="page-match">
        <motion.div
          className="quiz-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          >
            <Sparkles size={48} />
          </motion.div>
          <h2>Finding your anime soulmates…</h2>
          <p>Scanning the MyAnimeList database for perfect matches</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-match">
      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div
            key="quiz"
            className="quiz-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="quiz-header">
              <Sparkles size={36} />
              <h1>Anime Soul Match</h1>
              <p>Answer {QUESTIONS.length} questions and we'll find your perfect match from all of MyAnimeList</p>
            </div>

            <div className="quiz-progress">
              <div className="quiz-progress-bar">
                <motion.div
                  className="quiz-progress-fill"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span>{step + 1} / {QUESTIONS.length}</span>
            </div>

            {fetchError && (
              <div className="error-banner" style={{ marginBottom: '1rem' }}>
                <span>{fetchError}</span>
                <button className="btn-ghost btn-sm" onClick={handleRestart}>
                  <RotateCcw size={14} /> Restart
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                className="quiz-question"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.25 }}
              >
                <h2>{currentQuestion.question}</h2>
                <div className="quiz-options">
                  {currentQuestion.options.map((option) => (
                    <motion.button
                      key={option.value}
                      className={`quiz-option ${answers[currentQuestion.id] === option.value ? 'selected' : ''}`}
                      onClick={() => handleAnswer(currentQuestion.id, option.value)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="quiz-emoji">{option.emoji}</span>
                      <span>{option.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {step > 0 && (
              <button className="btn-ghost quiz-back-btn" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="results"
            className="quiz-results"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="quiz-results-header">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Heart size={40} fill="var(--error)" stroke="var(--error)" />
              </motion.div>
              <h1>Your Anime Soul Matches</h1>
              <p>Pulled live from MyAnimeList — matched to your taste profile</p>
            </div>

            <div className="soul-matches">
              {(results || []).map((anime, i) => {
                const inList = isInWatchlist(anime.mal_id);
                const isAdding = addingId === anime.mal_id;
                const image = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
                const synopsis = anime.synopsis?.replace(/\[Written.*?\]/g, '').trim();

                return (
                  <motion.div
                    key={anime.mal_id}
                    className={`soul-match-card ${i === 0 ? 'top-match' : ''}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
                  >
                    {i === 0 && <div className="top-badge"><Zap size={12} /> Best Match</div>}

                    <div className="soul-match-layout">
                      <Link to={`/anime/${anime.mal_id}`} className="soul-match-poster-link">
                        <img
                          src={image}
                          alt={anime.title}
                          className="soul-match-poster"
                          loading="lazy"
                        />
                      </Link>

                      <div className="soul-match-body">
                        <Link to={`/anime/${anime.mal_id}`} className="soul-match-title-link">
                          <h3>{anime.title}</h3>
                        </Link>

                        <div className="soul-match-meta">
                          {anime.score && (
                            <span className="soul-match-score-badge">
                              <Star size={13} fill="var(--accent-400)" stroke="none" />
                              {anime.score}
                            </span>
                          )}
                          {anime.type && <span className="chip chip-sm">{anime.type}</span>}
                          {anime.episodes && <span className="chip chip-sm">{anime.episodes} eps</span>}
                          {anime.year && <span className="chip chip-sm">{anime.year}</span>}
                        </div>

                        <div className="chip-row" style={{ margin: '4px 0' }}>
                          {(anime.genres || []).slice(0, 4).map(g => (
                            <span key={g.mal_id} className="chip chip-sm">{g.name}</span>
                          ))}
                        </div>

                        {synopsis && (
                          <p className="soul-match-synopsis">{synopsis.slice(0, 160)}{synopsis.length > 160 ? '…' : ''}</p>
                        )}

                        <div className="soul-match-actions">
                          <button
                            className={`btn-sm ${inList ? 'btn-ghost btn-active-green' : 'btn-primary'}`}
                            onClick={() => handleAddToWatchlist(anime)}
                            disabled={inList || isAdding}
                          >
                            {isAdding ? (
                              <Loader2 size={14} className="spin" />
                            ) : inList ? (
                              <><BookmarkCheck size={14} /> In Watchlist</>
                            ) : (
                              <><Bookmark size={14} /> Add to Watchlist</>
                            )}
                          </button>
                          <Link to={`/anime/${anime.mal_id}`} className="btn-ghost btn-sm">
                            <ExternalLink size={14} /> Details
                          </Link>
                        </div>
                      </div>

                      <div className="compatibility-ring">
                        <svg viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="var(--border)"
                            strokeWidth="3"
                          />
                          <motion.path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={i === 0 ? 'var(--secondary-400)' : 'var(--primary-400)'}
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: '0, 100' }}
                            animate={{ strokeDasharray: `${anime.compatibility}, 100` }}
                            transition={{ duration: 1.2, delay: 0.4 + i * 0.12, ease: 'easeOut' }}
                          />
                        </svg>
                        <span className="compat-text">{anime.compatibility}%</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="quiz-actions">
              <button className="btn-primary" onClick={handleRestart}>
                <RotateCcw size={16} /> Retake Quiz
              </button>
              <Link to="/discover" className="btn-ghost">
                Browse All Anime
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
