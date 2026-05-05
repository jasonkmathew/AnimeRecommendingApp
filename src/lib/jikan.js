const BASE = 'https://api.jikan.moe/v4';

let lastRequestTime = 0;
const MIN_INTERVAL = 350; // ms between requests to respect rate limits

export async function rateLimitedFetch(url, retries = 3) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_INTERVAL - elapsed));
  }
  lastRequestTime = Date.now();

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '3', 10) * 1000;
        await new Promise(r => setTimeout(r, retryAfter));
        continue;
      }
      if (res.status === 408 || res.status >= 500) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
      const data = await res.json();
      return data.data;
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

async function fetchJikan(endpoint) {
  return rateLimitedFetch(`${BASE}${endpoint}`);
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
