import React from 'react';

export function Skeleton({ width, height, radius = '12px' }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius }} />;
}

export function AnimeCardSkeleton() {
  return (
    <div className="anime-card skeleton-card">
      <Skeleton width="100%" height="280px" radius="18px 18px 0 0" />
      <div className="anime-content">
        <Skeleton width="80%" height="20px" />
        <Skeleton width="60%" height="16px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="100%" height="14px" />
        <div className="chip-row">
          <Skeleton width="60px" height="24px" radius="999px" />
          <Skeleton width="70px" height="24px" radius="999px" />
        </div>
      </div>
    </div>
  );
}

export function AnimeListSkeleton({ count = 6 }) {
  return (
    <div className="anime-list">
      {Array.from({ length: count }).map((_, i) => <AnimeCardSkeleton key={i} />)}
    </div>
  );
}

export function RecommendationSkeleton() {
  return (
    <div className="recommendation-section">
      <div className="recommendation-header">
        <div>
          <Skeleton width="200px" height="24px" />
          <Skeleton width="280px" height="16px" />
        </div>
      </div>
      <div className="recommendation-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="recommendation-card">
            <Skeleton width="84px" height="120px" radius="10px" />
            <div>
              <Skeleton width="70%" height="18px" />
              <Skeleton width="100%" height="14px" />
              <Skeleton width="50%" height="14px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="detail-skeleton">
      <Skeleton width="100%" height="400px" radius="20px" />
      <div className="detail-skeleton-info">
        <Skeleton width="40%" height="32px" />
        <Skeleton width="60%" height="18px" />
        <Skeleton width="100%" height="16px" />
        <Skeleton width="100%" height="16px" />
        <Skeleton width="80%" height="16px" />
      </div>
    </div>
  );
}
