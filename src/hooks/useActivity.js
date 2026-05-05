import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useActivity() {
  const { user } = useAuth();

  const logActivity = useCallback(async (malId, activityType, metadata = {}) => {
    if (!user) return;
    await supabase.from('user_activity').insert({
      user_id: user.id,
      mal_id: malId,
      activity_type: activityType,
      metadata,
    });
  }, [user]);

  return { logActivity };
}
