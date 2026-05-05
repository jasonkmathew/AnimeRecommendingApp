const BASE = 'https://api.jikan.moe/v4';

async function fetchJikan(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const data = await res.json();
  return data.data;
}

export function getTrending(limit = 24) {
  return fetchJikan(`/top/anime?limit=${limit}`);
}

export function getSeasonal(limit = 12) {
  return fetchJikan(`/seasons/now?limit=${limit}`);
}

export function searchAnime(query, limit = 24) {
  return fetchJikan(`/anime?q=${encodeURIComponent(query)}&order_by=members&sort=desc&limit=${limit}`);
}

export function getAnimeDetail(malId) {
  return fetchJikan(`/anime/${malId}/full`);
}

export function getAnimeRecommendations(malId) {
  return fetchJikan(`/anime/${malId}/recommendations`);
}

export function getAnimeCharacters(malId) {
  return fetchJikan(`/anime/${malId}/characters`);
}

export function getTopAnimeByGenre(genreId, limit = 24) {
  return fetchJikan(`/anime?genres=${genreId}&order_by=score&sort=desc&limit=${limit}`);
}

export function getUpcoming(limit = 12) {
  return fetchJikan(`/seasons/upcoming?limit=${limit}`);
}

export function getAnimeReviews(malId) {
  return fetchJikan(`/anime/${malId}/reviews`);
}

export function getAnimeStats(malId) {
  return fetchJikan(`/anime/${malId}/statistics`);
}
