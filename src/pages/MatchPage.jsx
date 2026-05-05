import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft, RotateCcw, Heart, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const QUESTIONS = [
  {
    id: 'mood',
    question: 'What mood are you in right now?',
    options: [
      { label: 'Hype and energetic', value: 'action', emoji: '🔥' },
      { label: 'Cozy and wholesome', value: 'slice_of_life', emoji: '🌸' },
      { label: 'Dark and intense', value: 'thriller', emoji: '🌑' },
      { label: 'Dreamy and romantic', value: 'romance', emoji: '💫' },
      { label: 'Mind-bending and cerebral', value: 'psychological', emoji: '🧠' },
    ],
  },
  {
    id: 'length',
    question: 'How much time are you willing to invest?',
    options: [
      { label: 'A quick movie (1-2 hrs)', value: 'movie', emoji: '🎬' },
      { label: 'A short series (12 eps)', value: 'short', emoji: '⚡' },
      { label: 'A standard series (24 eps)', value: 'standard', emoji: '📺' },
      { label: 'A long epic (50+ eps)', value: 'long', emoji: '📚' },
      { label: 'No limit, I want it all', value: 'any', emoji: '♾️' },
    ],
  },
  {
    id: 'art',
    question: 'What visual style draws you in?',
    options: [
      { label: 'Classic hand-drawn beauty', value: 'classic', emoji: '🎨' },
      { label: 'Sleek modern animation', value: 'modern', emoji: '✨' },
      { label: 'Dark and atmospheric', value: 'dark', emoji: '🌑' },
      { label: 'Colorful and vibrant', value: 'vibrant', emoji: '🌈' },
      { label: 'I care about story, not art', value: 'any', emoji: '📖' },
    ],
  },
  {
    id: 'pacing',
    question: 'How do you like your pacing?',
    options: [
      { label: 'Non-stop action, keep it moving', value: 'fast', emoji: '💨' },
      { label: 'Slow burn, build the tension', value: 'slow', emoji: '🕯️' },
      { label: 'A good mix of both', value: 'mixed', emoji: '⚖️' },
      { label: 'Episodic, I can jump in anywhere', value: 'episodic', emoji: '🔄' },
    ],
  },
  {
    id: 'emotion',
    question: 'What emotional experience do you crave?',
    options: [
      { label: 'Adrenaline and excitement', value: 'excitement', emoji: '⚡' },
      { label: 'Tears and catharsis', value: 'tears', emoji: '😢' },
      { label: 'Warm fuzzy feelings', value: 'warm', emoji: '🥰' },
      { label: 'Existential dread and questions', value: 'existential', emoji: '🌀' },
      { label: 'Laughter and joy', value: 'joy', emoji: '😂' },
    ],
  },
  {
    id: 'setting',
    question: 'Where should the story take you?',
    options: [
      { label: 'Fantasy worlds with magic', value: 'fantasy', emoji: '🧙' },
      { label: 'Space and the future', value: 'sci_fi', emoji: '🚀' },
      { label: 'Everyday Japan', value: 'realistic', emoji: '🗾' },
      { label: 'Historical eras', value: 'historical', emoji: '⚔️' },
      { label: 'Anywhere, surprise me', value: 'any', emoji: '🎲' },
    ],
  },
  {
    id: 'protagonist',
    question: 'What kind of protagonist do you vibe with?',
    options: [
      { label: 'Underdog who rises up', value: 'underdog', emoji: '🌱' },
      { label: 'Already overpowered', value: 'op', emoji: '👑' },
      { label: 'Clever strategist', value: 'strategist', emoji: '🧩' },
      { label: 'Found family / ensemble cast', value: 'ensemble', emoji: '👥' },
      { label: 'Morally grey antihero', value: 'antihero', emoji: '🦇' },
    ],
  },
  {
    id: 'dealbreaker',
    question: 'What is your absolute dealbreaker?',
    options: [
      { label: 'Boring filler episodes', value: 'no_filler', emoji: '🚫' },
      { label: 'No satisfying ending', value: 'needs_ending', emoji: '🏁' },
      { label: 'Too much fanservice', value: 'no_fanservice', emoji: '🙅' },
      { label: 'Slow starts', value: 'fast_start', emoji: '🚀' },
      { label: 'I have no dealbreakers', value: 'none', emoji: '🤷' },
    ],
  },
];

const GENRE_MAP = {
  action: { genres: [1], keywords: ['action', 'shounen', 'martial'] },
  slice_of_life: { genres: [36], keywords: ['slice of life', 'iyashikei'] },
  thriller: { genres: [7, 41], keywords: ['thriller', 'horror', 'suspense'] },
  romance: { genres: [22], keywords: ['romance', 'love', 'shoujo'] },
  psychological: { genres: [40], keywords: ['psychological', 'mind game'] },
  fantasy: { genres: [10], keywords: ['fantasy', 'magic', 'isekai'] },
  sci_fi: { genres: [24], keywords: ['sci-fi', 'space', 'mecha'] },
};

const QUIZ_RESULTS = {
  action: [
    { mal_id: 16498, title: 'Attack on Titan', score: 8.5, image_url: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg', genres: 'Action, Drama, Fantasy', compatibility: 97 },
    { mal_id: 38000, title: 'Demon Slayer', score: 8.45, image_url: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', genres: 'Action, Fantasy', compatibility: 95 },
    { mal_id: 1, title: 'Cowboy Bebop', score: 8.75, image_url: 'https://cdn.myanimelist.net/images/anime/4/19644.jpg', genres: 'Action, Sci-Fi', compatibility: 92 },
    { mal_id: 11061, title: 'Hunter x Hunter (2011)', score: 9.04, image_url: 'https://cdn.myanimelist.net/images/anime/1337/99013.jpg', genres: 'Action, Adventure', compatibility: 90 },
    { mal_id: 21, title: 'One Piece', score: 8.72, image_url: 'https://cdn.myanimelist.net/images/anime/1244/138851.jpg', genres: 'Action, Adventure', compatibility: 88 },
  ],
  slice_of_life: [
    { mal_id: 849, title: 'Mushishi', score: 8.67, image_url: 'https://cdn.myanimelist.net/images/anime/2/73844.jpg', genres: 'Fantasy, Slice of Life', compatibility: 96 },
    { mal_id: 28851, title: 'A Place Further Than the Universe', score: 8.65, image_url: 'https://cdn.myanimelist.net/images/anime/3300/91557.jpg', genres: 'Adventure, Slice of Life', compatibility: 94 },
    { mal_id: 2167, title: 'Clannad: After Story', score: 8.93, image_url: 'https://cdn.myanimelist.net/images/anime/1299/110774.jpg', genres: 'Drama, Slice of Life', compatibility: 92 },
    { mal_id: 31964, title: 'March Comes in Like a Lion', score: 8.68, image_url: 'https://cdn.myanimelist.net/images/anime/6/82898.jpg', genres: 'Drama, Slice of Life', compatibility: 90 },
    { mal_id: 28623, title: 'Flying Witch', score: 7.87, image_url: 'https://cdn.myanimelist.net/images/anime/7/79787.jpg', genres: 'Slice of Life, Supernatural', compatibility: 88 },
  ],
  thriller: [
    { mal_id: 5114, title: 'Death Note', score: 8.62, image_url: 'https://cdn.myanimelist.net/images/anime/9/9453.jpg', genres: 'Thriller, Supernatural', compatibility: 98 },
    { mal_id: 9253, title: 'Steins;Gate', score: 9.07, image_url: 'https://cdn.myanimelist.net/images/anime/5/73153.jpg', genres: 'Sci-Fi, Thriller', compatibility: 95 },
    { mal_id: 37423, title: 'Vinland Saga', score: 8.72, image_url: 'https://cdn.myanimelist.net/images/anime/1500/103849.jpg', genres: 'Action, Drama', compatibility: 92 },
    { mal_id: 41467, title: 'Bleach: Sennen Kessen-hen', score: 9.06, image_url: 'https://cdn.myanimelist.net/images/anime/1764/126627.jpg', genres: 'Action, Fantasy', compatibility: 89 },
    { mal_id: 37510, title: 'Mob Psycho 100 II', score: 8.78, image_url: 'https://cdn.myanimelist.net/images/anime/1918/96303.jpg', genres: 'Action, Comedy', compatibility: 86 },
  ],
  romance: [
    { mal_id: 2167, title: 'Clannad: After Story', score: 8.93, image_url: 'https://cdn.myanimelist.net/images/anime/1299/110774.jpg', genres: 'Drama, Romance', compatibility: 97 },
    { mal_id: 4181, title: 'Clannad', score: 8.04, image_url: 'https://cdn.myanimelist.net/images/anime/11/22061.jpg', genres: 'Drama, Romance', compatibility: 94 },
    { mal_id: 23273, title: 'Your Lie in April', score: 8.65, image_url: 'https://cdn.myanimelist.net/images/anime/3/67177.jpg', genres: 'Drama, Music, Romance', compatibility: 93 },
    { mal_id: 32281, title: 'Your Name', score: 8.83, image_url: 'https://cdn.myanimelist.net/images/anime/5/87028.jpg', genres: 'Drama, Romance', compatibility: 91 },
    { mal_id: 31964, title: 'March Comes in Like a Lion', score: 8.68, image_url: 'https://cdn.myanimelist.net/images/anime/6/82898.jpg', genres: 'Drama, Slice of Life', compatibility: 88 },
  ],
  psychological: [
    { mal_id: 5114, title: 'Death Note', score: 8.62, image_url: 'https://cdn.myanimelist.net/images/anime/9/9453.jpg', genres: 'Psychological, Thriller', compatibility: 99 },
    { mal_id: 9253, title: 'Steins;Gate', score: 9.07, image_url: 'https://cdn.myanimelist.net/images/anime/5/73153.jpg', genres: 'Sci-Fi, Psychological', compatibility: 96 },
    { mal_id: 1085, title: 'Neon Genesis Evangelion', score: 8.35, image_url: 'https://cdn.myanimelist.net/images/anime/1314/1089.jpg', genres: 'Mecha, Psychological', compatibility: 94 },
    { mal_id: 19815, title: 'Psycho-Pass', score: 8.43, image_url: 'https://cdn.myanimelist.net/images/anime/5/43399.jpg', genres: 'Sci-Fi, Psychological', compatibility: 91 },
    { mal_id: 22319, title: 'Tokyo Ghoul', score: 7.79, image_url: 'https://cdn.myanimelist.net/images/anime/12/76049.jpg', genres: 'Action, Horror, Psychological', compatibility: 87 },
  ],
  fantasy: [
    { mal_id: 16498, title: 'Attack on Titan', score: 8.5, image_url: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg', genres: 'Action, Fantasy', compatibility: 96 },
    { mal_id: 51009, title: 'Frieren: Beyond Journey\'s End', score: 9.33, image_url: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg', genres: 'Adventure, Fantasy', compatibility: 95 },
    { mal_id: 11061, title: 'Hunter x Hunter (2011)', score: 9.04, image_url: 'https://cdn.myanimelist.net/images/anime/1337/99013.jpg', genres: 'Action, Adventure, Fantasy', compatibility: 93 },
    { mal_id: 9253, title: 'Steins;Gate', score: 9.07, image_url: 'https://cdn.myanimelist.net/images/anime/5/73153.jpg', genres: 'Sci-Fi, Thriller', compatibility: 88 },
    { mal_id: 38000, title: 'Demon Slayer', score: 8.45, image_url: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', genres: 'Action, Fantasy', compatibility: 86 },
  ],
  sci_fi: [
    { mal_id: 1, title: 'Cowboy Bebop', score: 8.75, image_url: 'https://cdn.myanimelist.net/images/anime/4/19644.jpg', genres: 'Action, Sci-Fi', compatibility: 97 },
    { mal_id: 9253, title: 'Steins;Gate', score: 9.07, image_url: 'https://cdn.myanimelist.net/images/anime/5/73153.jpg', genres: 'Sci-Fi, Thriller', compatibility: 95 },
    { mal_id: 1085, title: 'Neon Genesis Evangelion', score: 8.35, image_url: 'https://cdn.myanimelist.net/images/anime/1314/1089.jpg', genres: 'Mecha, Sci-Fi', compatibility: 93 },
    { mal_id: 19815, title: 'Psycho-Pass', score: 8.43, image_url: 'https://cdn.myanimelist.net/images/anime/5/43399.jpg', genres: 'Sci-Fi, Psychological', compatibility: 90 },
    { mal_id: 41467, title: 'Bleach: Sennen Kessen-hen', score: 9.06, image_url: 'https://cdn.myanimelist.net/images/anime/1764/126627.jpg', genres: 'Action, Fantasy', compatibility: 85 },
  ],
};

function computeResults(answers) {
  const scores = {};
  Object.values(answers).forEach((val) => {
    const mapping = GENRE_MAP[val];
    if (mapping) {
      mapping.genres.forEach(g => { scores[g] = (scores[g] || 0) + 1; });
      mapping.keywords.forEach(k => { scores[k] = (scores[k] || 0) + 0.5; });
    }
  });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topGenre = sorted.length > 0 ? sorted[0][0] : 'action';

  const genreKey = Object.keys(GENRE_MAP).find(k => GENRE_MAP[k].genres.includes(parseInt(topGenre))) || 'action';
  const results = QUIZ_RESULTS[genreKey] || QUIZ_RESULTS.action;

  const moodAnswer = answers.mood || 'action';
  const moodResults = QUIZ_RESULTS[moodAnswer] || QUIZ_RESULTS.action;

  const merged = [...new Map([...moodResults, ...results].map(r => [r.mal_id, r])).values()];
  return merged.slice(0, 5).map((r, i) => ({
    ...r,
    compatibility: Math.max(70, r.compatibility - i * 3),
  }));
}

export default function MatchPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;
  const isLastStep = step === QUESTIONS.length - 1;

  const handleAnswer = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (isLastStep) {
      const computed = computeResults(newAnswers);
      setResults(computed);
      setShowResults(true);
      if (user) {
        supabase.from('quiz_results').insert({
          user_id: user.id,
          answers: newAnswers,
          results: computed,
        }).then(() => {});
      }
    } else {
      setTimeout(() => setStep(step + 1), 300);
    }
  };

  const handleRestart = () => {
    setStep(0);
    setAnswers({});
    setResults(null);
    setShowResults(false);
  };

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
              <Sparkles size={32} />
              <h1>Anime Soul Match</h1>
              <p>Answer 8 questions and we'll find your anime soulmate</p>
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

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                className="quiz-question"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <h2>{currentQuestion.question}</h2>
                <div className="quiz-options">
                  {currentQuestion.options.map((option) => (
                    <motion.button
                      key={option.value}
                      className={`quiz-option ${answers[currentQuestion.id] === option.value ? 'selected' : ''}`}
                      onClick={() => handleAnswer(currentQuestion.id, option.value)}
                      whileHover={{ scale: 1.02 }}
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
              <button className="btn-ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="results"
            className="quiz-results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="quiz-results-header">
              <Heart size={32} fill="var(--error)" stroke="var(--error)" />
              <h1>Your Anime Soul Matches</h1>
              <p>Based on your unique taste profile</p>
            </div>

            <div className="soul-matches">
              {results.map((anime, i) => (
                <motion.div
                  key={anime.mal_id}
                  className={`soul-match-card ${i === 0 ? 'top-match' : ''}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                >
                  {i === 0 && <div className="top-badge"><Zap size={14} /> Best Match</div>}
                  <Link to={`/anime/${anime.mal_id}`} className="soul-match-link">
                    <img src={anime.image_url} alt={anime.title} loading="lazy" />
                    <div className="soul-match-info">
                      <h3>{anime.title}</h3>
                      <p>{anime.genres}</p>
                      <div className="soul-match-score">
                        <Star size={14} /> {anime.score}
                      </div>
                    </div>
                  </Link>
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
                        stroke="var(--accent)"
                        strokeWidth="3"
                        strokeDasharray={`${anime.compatibility}, 100`}
                        initial={{ strokeDasharray: '0, 100' }}
                        animate={{ strokeDasharray: `${anime.compatibility}, 100` }}
                        transition={{ duration: 1.5, delay: 0.5 + i * 0.15 }}
                      />
                    </svg>
                    <span className="compat-text">{anime.compatibility}%</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="quiz-actions">
              <button className="btn-primary" onClick={handleRestart}>
                <RotateCcw size={16} /> Retake Quiz
              </button>
              <Link to="/discover" className="btn-ghost">
                Browse More <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Star(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
