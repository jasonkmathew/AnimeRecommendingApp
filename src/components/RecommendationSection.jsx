import React, { useMemo, useState } from 'react';

function RecommendationSection({ recommendations, loading, activeAnime }) {
  const [expanded, setExpanded] = useState(true);

  const sortedRecommendations = useMemo(
    () => [...(recommendations || [])].sort((a, b) => (b?.votes ?? 0) - (a?.votes ?? 0)),
    [recommendations]
  );

  if (loading) {
    return <p className="status-text">Building recommendation graph...</p>;
  }

  if (!activeAnime) {
    return (
      <section className="recommendation-section recommendation-placeholder">
        <h2>AI Recommendations</h2>
        <p>Pick any anime card to generate a curated list of similar titles.</p>
      </section>
    );
  }

  return (
    <section className="recommendation-section">
      <div className="recommendation-header">
        <div>
          <h2>Because you liked {activeAnime?.title}</h2>
          <p>Community recommendation confidence powered by Jikan data.</p>
        </div>
        <button onClick={() => setExpanded((current) => !current)}>
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {expanded && (
        <div className="recommendation-grid">
          {sortedRecommendations.slice(0, 12).map((rec) => (
            <article className="recommendation-card" key={rec?.entry?.mal_id || rec?.entry?.title}>
              <img
                src={rec?.entry?.images?.jpg?.image_url || ''}
                alt={rec?.entry?.title || 'Recommendation'}
                loading="lazy"
              />
              <div>
                <h3>{rec?.entry?.title || 'Unknown Title'}</h3>
                <p>{rec?.content || 'Fans frequently pair this title with your selected anime.'}</p>
                <span>{rec?.votes || 0} recommendation votes</span>
              </div>
            </article>
          ))}
          {sortedRecommendations.length === 0 && (
            <p className="status-text">No recommendations available for this anime yet.</p>
          )}
        </div>
      )}
    </section>
  );
}

export default RecommendationSection;
