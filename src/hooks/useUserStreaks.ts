import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTrukoins } from "@/hooks/useTrukoins";

interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_multiplier: number;
  total_streak_bonus_earned: number;
}

export function useUserStreaks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { earnTrukoins } = useTrukoins();
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStreak();
    }
  }, [user]);

  const fetchStreak = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create streak if doesn't exist
        const { data: newStreak, error: createError } = await supabase
          .from("user_streaks")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        setStreak(newStreak);
      } else {
        setStreak(data);
      }
    } catch (error) {
      console.error("Error fetching streak:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkInToday = async () => {
    if (!user || !streak) return { error: "Not initialized" };

    const today = new Date().toISOString().split("T")[0];
    const lastActivity = streak.last_activity_date;

    // Already checked in today
    if (lastActivity === today) {
      return { alreadyCheckedIn: true, error: null };
    }

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = 1;
      let newMultiplier = 1.0;

      // Check if continuing streak
      if (lastActivity === yesterdayStr) {
        newStreak = streak.current_streak + 1;
        // Increase multiplier every 7 days (max 2.0)
        newMultiplier = Math.min(1.0 + Math.floor(newStreak / 7) * 0.1, 2.0);
      }

      const newLongest = Math.max(newStreak, streak.longest_streak);

      // Calculate bonus
      const baseBonus = 5;
      const bonus = Math.floor(baseBonus * newMultiplier);

      const { error } = await supabase
        .from("user_streaks")
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today,
          streak_multiplier: newMultiplier,
          total_streak_bonus_earned: streak.total_streak_bonus_earned + bonus,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Award streak bonus
      await earnTrukoins(bonus, "streak_bonus", `Bonus de racha día ${newStreak}`);

      if (newStreak > streak.current_streak) {
        toast({
          title: `🔥 ¡Racha de ${newStreak} días!`,
          description: `+${bonus} TrueKoins (x${newMultiplier.toFixed(1)} multiplicador)`,
        });
      }

      await fetchStreak();
      return { alreadyCheckedIn: false, error: null };
    } catch (error) {
      console.error("Error checking in:", error);
      return { error };
    }
  };

  return {
    streak,
    loading,
    checkInToday,
    refetch: fetchStreak,
  };
}
