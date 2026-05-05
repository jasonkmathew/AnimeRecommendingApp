import React from 'react';
import AnimeCard from './AnimeCard';
import { AnimeListSkeleton } from '../ui/Skeleton';

export default function AnimeList({ animeList = [], loading, compact = false }) {
  if (loading) return <AnimeListSkeleton count={compact ? 4 : 6} />;
  if (!animeList?.length) return <p className="status-text">No anime found for the current filters.</p>;

  return (
    <div className={`anime-list ${compact ? 'compact-list' : ''}`}>
      {animeList.map((anime, i) => (
        <AnimeCard key={anime.mal_id} anime={anime} index={i} compact={compact} />
      ))}
    </div>
  );
}
