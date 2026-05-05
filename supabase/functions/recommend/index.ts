import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const JIKAN_BASE = "https://api.jikan.moe/v4";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/recommend", "");

    if (path.startsWith("/for-you")) {
      return await handleForYou(req, url);
    } else if (path.startsWith("/similar/")) {
      const malId = path.split("/")[2];
      return await handleSimilar(req, malId);
    } else if (path.startsWith("/taste")) {
      return await handleTaste(req, url);
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleForYou(req: Request, url: URL) {
  const userId = url.searchParams.get("user_id");
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "user_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check cache
  const { data: cached } = await supabase
    .from("recommendation_cache")
    .select("*")
    .eq("user_id", userId)
    .is("mal_id", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached) {
    return new Response(
      JSON.stringify({ recommendations: cached.recommendations, reason: cached.reason, cached: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get user's watchlist to build taste profile
  const { data: watchlist } = await supabase
    .from("watchlist")
    .select("mal_id, score, user_rating, genres, status")
    .eq("user_id", userId);

  if (!watchlist || watchlist.length === 0) {
    const trending = await fetchJikan("/top/anime?limit=12");
    return new Response(
      JSON.stringify({
        recommendations: trending.map((a: any) => ({
          mal_id: a.mal_id,
          title: a.title,
          image_url: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url,
          score: a.score,
          genres: (a.genres || []).map((g: any) => g.name),
          reason: "Popular with the community",
        })),
        reason: "Trending picks to get you started",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Build genre affinity from watchlist
  const genreAffinity: Record<string, number> = {};
  watchlist.forEach((entry: any) => {
    const genres = (entry.genres || "").split(",").filter(Boolean);
    const weight = entry.user_rating ? entry.user_rating / 10 : (entry.score || 5) / 10;
    genres.forEach((g: string) => {
      const trimmed = g.trim();
      genreAffinity[trimmed] = (genreAffinity[trimmed] || 0) + weight;
    });
  });

  const topGenres = Object.entries(genreAffinity)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([genre]) => genre);

  const genreResults = await Promise.all(
    topGenres.map(async (genre) => {
      const data = await fetchJikan(`/anime?genres=${encodeURIComponent(genre)}&order_by=score&sort=desc&limit=8`);
      return data;
    })
  );

  const watchedIds = new Set(watchlist.map((w: any) => w.mal_id));
  const seen = new Set<number>();
  const recommendations: any[] = [];

  genreResults.flat().forEach((anime: any) => {
    if (!seen.has(anime.mal_id) && !watchedIds.has(anime.mal_id)) {
      seen.add(anime.mal_id);
      recommendations.push({
        mal_id: anime.mal_id,
        title: anime.title,
        image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        score: anime.score,
        genres: (anime.genres || []).map((g: any) => g.name),
        reason: `Matches your love for ${topGenres.join(", ")}`,
      });
    }
  });

  // Serendipity picks
  const surprise = await fetchJikan("/top/anime?limit=5&page=2");
  surprise.forEach((anime: any) => {
    if (!seen.has(anime.mal_id) && !watchedIds.has(anime.mal_id)) {
      seen.add(anime.mal_id);
      recommendations.push({
        mal_id: anime.mal_id,
        title: anime.title,
        image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        score: anime.score,
        genres: (anime.genres || []).map((g: any) => g.name),
        reason: "Serendipity pick -- step outside your comfort zone",
      });
    }
  });

  const finalRecs = recommendations.slice(0, 15);
  const reasonText = `Based on your affinity for ${topGenres.join(", ")} with ${watchlist.length} titles in your watchlist`;

  await supabase.from("recommendation_cache").insert({
    user_id: userId,
    mal_id: null,
    recommendations: finalRecs,
    reason: reasonText,
    expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  });

  return new Response(
    JSON.stringify({ recommendations: finalRecs, reason: reasonText }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleSimilar(req: Request, malId: string) {
  const data = await fetchJikan(`/anime/${malId}/recommendations`);
  const recommendations = data.slice(0, 12).map((rec: any) => ({
    mal_id: rec.entry?.mal_id,
    title: rec.entry?.title,
    image_url: rec.entry?.images?.jpg?.image_url,
    votes: rec.votes,
    reason: rec.content || "Community recommendation",
  }));

  return new Response(
    JSON.stringify({ recommendations }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleTaste(req: Request, url: URL) {
  const userId = url.searchParams.get("user_id");
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "user_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: watchlist } = await supabase
    .from("watchlist")
    .select("genres, user_rating, score")
    .eq("user_id", userId);

  const genreAffinity: Record<string, number> = {};
  (watchlist || []).forEach((entry: any) => {
    const genres = (entry.genres || "").split(",").filter(Boolean);
    const weight = entry.user_rating ? entry.user_rating / 10 : 0.5;
    genres.forEach((g: string) => {
      const trimmed = g.trim();
      genreAffinity[trimmed] = (genreAffinity[trimmed] || 0) + weight;
    });
  });

  const sorted = Object.entries(genreAffinity)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([genre, score]) => ({ genre, score: Math.round((score as number) * 100) / 100 }));

  return new Response(
    JSON.stringify({ taste_profile: sorted }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function fetchJikan(endpoint: string) {
  const res = await fetch(`${JIKAN_BASE}${endpoint}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}
