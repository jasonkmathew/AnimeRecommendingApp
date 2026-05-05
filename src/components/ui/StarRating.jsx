import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating, onRate, size = 20, readonly = false }) {
  const displayRating = rating || 0;

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= displayRating ? 'filled' : ''}`}
          onClick={() => !readonly && onRate?.(star)}
          disabled={readonly}
          aria-label={`Rate ${star} out of 10`}
        >
          <Star size={size} />
        </button>
      ))}
      {displayRating > 0 && <span className="rating-value">{displayRating}/10</span>}
    </div>
  );
}
