import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles, ThumbsUp } from 'lucide-react';
import { RecommendationSkeleton } from '../ui/Skeleton';

export default function RecommendationSection({ recommendations, loading, activeAnime }) {
  const [expanded, setExpanded] = useState(true);

  const sortedRecommendations = useMemo(
    () => [...(recommendations || [])].sort((a, b) => (b?.votes ?? 0) - (a?.votes ?? 0)),
    [recommendations]
  );

  if (loading) return <RecommendationSkeleton />;

  if (!activeAnime) {
    return (
      <section className="recommendation-section recommendation-placeholder">
        <Sparkles size={32} />
        <h2>Smart Recommendations</h2>
        <p>Click any anime card to generate a curated list of similar titles.</p>
      </section>
    );
  }

  return (
    <motion.section
      className="recommendation-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="recommendation-header">
        <div>
          <h2>Because you liked {activeAnime?.title}</h2>
          <p>Community-powered recommendation confidence</p>
        </div>
        <button className="btn-ghost" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="recommendation-grid"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {sortedRecommendations.slice(0, 12).map((rec, i) => (
              <motion.article
                className="recommendation-card"
                key={rec?.entry?.mal_id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/anime/${rec?.entry?.mal_id}`}>
                  <img
                    src={rec?.entry?.images?.jpg?.image_url || ''}
                    alt={rec?.entry?.title || 'Recommendation'}
                    loading="lazy"
                  />
                </Link>
                <div>
                  <Link to={`/anime/${rec?.entry?.mal_id}`}>
                    <h3>{rec?.entry?.title || 'Unknown Title'}</h3>
                  </Link>
                  <p>{rec?.content || 'Fans frequently pair this title with your selected anime.'}</p>
                  <span className="rec-votes">
                    <ThumbsUp size={14} />
                    {rec?.votes || 0} votes
                  </span>
                </div>
              </motion.article>
            ))}
            {sortedRecommendations.length === 0 && (
              <p className="status-text">No recommendations available for this anime yet.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
