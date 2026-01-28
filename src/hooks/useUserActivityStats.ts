import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserActivityStats {
  id: string;
  user_id: string;
  total_swipes: number;
  total_likes_given: number;
  total_likes_received: number;
  total_trades_initiated: number;
  total_trades_completed: number;
  total_value_traded: number;
  total_products_listed: number;
  total_messages_sent: number;
  avg_response_time_minutes: number | null;
  current_streak: number;
  longest_streak: number;
  last_active_at: string;
}

export function useUserActivityStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_activity_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create stats if doesn't exist
        const { data: newStats, error: createError } = await supabase
          .from("user_activity_stats")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        setStats(newStats);
      } else {
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching user activity stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const incrementStat = async (
    statName: keyof Omit<UserActivityStats, "id" | "user_id" | "last_active_at">,
    amount: number = 1
  ) => {
    if (!user || !stats) return;

    try {
      const currentValue = (stats[statName] as number) || 0;
      const { error } = await supabase
        .from("user_activity_stats")
        .update({
          [statName]: currentValue + amount,
          last_active_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
      await fetchStats();
    } catch (error) {
      console.error("Error incrementing stat:", error);
    }
  };

  return {
    stats,
    loading,
    incrementStat,
    refetch: fetchStats,
  };
}
