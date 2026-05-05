const BASE = 'https://api.jikan.moe/v4';

let lastRequestTime = 0;
const MIN_INTERVAL = 400;

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
      const json = await res.json();
      return json.data;
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// Returns { data, pagination } for paginated endpoints
export async function rateLimitedFetchPaginated(url, retries = 3) {
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
      const json = await res.json();
      return { data: json.data || [], pagination: json.pagination || {} };
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

export function getTrending(limit = 25) {
  return fetchJikan(`/top/anime?limit=${limit}&filter=bypopularity`);
}

export function getSeasonal(limit = 12) {
  return fetchJikan(`/seasons/now?limit=${limit}`);
}

export function getUpcoming(limit = 12) {
  return fetchJikan(`/seasons/upcoming?limit=${limit}`);
}

export function searchAnime(query, limit = 25) {
  return fetchJikan(`/anime?q=${encodeURIComponent(query)}&order_by=members&sort=desc&limit=${limit}&sfw=true`);
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

export function getTopAnimeByGenre(genreId, limit = 25) {
  return fetchJikan(`/anime?genres=${genreId}&order_by=score&sort=desc&limit=${limit}&sfw=true`);
}

export function getAnimeByGenresAndType(genreIds, type, minScore = 6.0, limit = 10) {
  const params = new URLSearchParams({
    order_by: 'score',
    sort: 'desc',
    limit,
    min_score: minScore,
    sfw: 'true',
  });
  if (genreIds?.length) params.set('genres', genreIds.join(','));
  if (type) params.set('type', type);
  return fetchJikan(`/anime?${params}`);
}

// Genre name → MAL genre ID mapping
export const GENRE_IDS = {
  'Action': 1,
  'Adventure': 2,
  'Comedy': 4,
  'Drama': 8,
  'Fantasy': 10,
  'Horror': 14,
  'Mystery': 7,
  'Romance': 22,
  'Sci-Fi': 24,
  'Slice of Life': 36,
  'Sports': 30,
  'Supernatural': 37,
  'Thriller': 41,
  'Mecha': 18,
  'Music': 19,
  'Psychological': 40,
  'Historical': 13,
  'Ecchi': 9,
  'Isekai': 41,
  'Shounen': 27,
  'Shoujo': 25,
};
