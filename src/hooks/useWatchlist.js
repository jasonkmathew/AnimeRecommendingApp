import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (!error) setWatchlist(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

  const addToWatchlist = async (anime, status = 'plan_to_watch') => {
    if (!user) return;
    const entry = {
      user_id: user.id,
      mal_id: anime.mal_id,
      title: anime.title,
      image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
      score: anime.score || 0,
      status,
      genres: (anime.genres || []).map(g => g.name).join(','),
      episodes: anime.episodes,
    };
    const { data, error } = await supabase
      .from('watchlist')
      .upsert(entry, { onConflict: 'user_id,mal_id' })
      .select()
      .maybeSingle();
    if (!error && data) {
      setWatchlist(prev => {
        const filtered = prev.filter(w => w.mal_id !== anime.mal_id);
        return [data, ...filtered];
      });
    }
    return data;
  };

  const removeFromWatchlist = async (malId) => {
    if (!user) return;
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('mal_id', malId);
    if (!error) {
      setWatchlist(prev => prev.filter(w => w.mal_id !== malId));
    }
  };

  const updateWatchlistStatus = async (malId, status) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('watchlist')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('mal_id', malId)
      .select()
      .maybeSingle();
    if (!error && data) {
      setWatchlist(prev => prev.map(w => w.mal_id === malId ? data : w));
    }
    return data;
  };

  const rateAnime = async (malId, userRating) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('watchlist')
      .update({ user_rating: userRating, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('mal_id', malId)
      .select()
      .maybeSingle();
    if (!error && data) {
      setWatchlist(prev => prev.map(w => w.mal_id === malId ? data : w));
    }
    return data;
  };

  const isInWatchlist = (malId) => watchlist.some(w => w.mal_id === malId);

  const getWatchlistEntry = (malId) => watchlist.find(w => w.mal_id === malId);

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    updateWatchlistStatus,
    rateAnime,
    isInWatchlist,
    getWatchlistEntry,
    refetch: fetchWatchlist,
  };
}
