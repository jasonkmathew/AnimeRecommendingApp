import React from 'react';
import AnimeCard from './AnimeCard';

function AnimeList({ animeList = [], loading, onShowRecommendations, compact = false }) {
  if (loading) {
    return <p className="status-text">Loading titles...</p>;
  }

  if (!animeList?.length) {
    return <p className="status-text">No anime found for the current filters.</p>;
  }

  return (
    <div className={`anime-list ${compact ? 'compact-list' : ''}`}>
      {animeList.map((anime) => (
        <AnimeCard
          key={anime.mal_id}
          anime={anime}
          onShowRecommendations={onShowRecommendations}
          compact={compact}
        />
      ))}
    </div>
  );
}

export default AnimeList;
