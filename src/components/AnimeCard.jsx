import React from 'react';

function AnimeCard({ anime, onShowRecommendations, compact = false }) {
  const image = anime?.images?.jpg?.large_image_url || anime?.images?.jpg?.image_url;

  return (
    <article className={`anime-card ${compact ? 'compact' : ''}`}>
      <img src={image} alt={anime?.title || 'Anime poster'} loading="lazy" />
      <div className="anime-content">
        <h3>{anime?.title || 'Unknown Title'}</h3>
        <p className="meta">
          Score <strong>{anime?.score ?? 'N/A'}</strong> • Episodes <strong>{anime?.episodes ?? '?'}</strong>
        </p>
        {!compact && <p className="synopsis">{anime?.synopsis || 'No synopsis available.'}</p>}
        <div className="chip-row">
          {(anime?.genres || []).slice(0, compact ? 2 : 3).map((genre) => (
            <span key={`${anime?.mal_id}-${genre.name}`} className="chip">
              {genre.name}
            </span>
          ))}
        </div>
        <button onClick={() => onShowRecommendations(anime)}>Generate Similar Picks</button>
      </div>
    </article>
  );
}

export default AnimeCard;
