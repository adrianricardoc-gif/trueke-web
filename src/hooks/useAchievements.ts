import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTrukoins } from "@/hooks/useTrukoins";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  reward_trukoins: number;
  is_secret: boolean;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  achievement?: Achievement;
}

export function useAchievements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { earnTrukoins } = useTrukoins();
  const { isEnabled } = useFeatureFlags();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const achievementsEnabled = isEnabled('gamification_achievements');

  useEffect(() => {
    if (achievementsEnabled) {
      fetchAchievements();
      if (user) {
        fetchUserAchievements();
      }
    } else {
      setLoading(false);
    }
  }, [user, achievementsEnabled]);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .order("requirement_value", { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setUserAchievements(data || []);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
    }
  };

  const checkAndUnlockAchievement = async (
    requirementType: string,
    currentValue: number
  ) => {
    if (!user || !achievementsEnabled) return;

    try {
      // Find achievements that can be unlocked
      const eligibleAchievements = achievements.filter(
        (a) =>
          a.requirement_type === requirementType &&
          a.requirement_value <= currentValue &&
          !userAchievements.find((ua) => ua.achievement_id === a.id)
      );

      for (const achievement of eligibleAchievements) {
        // Unlock achievement
        const { error } = await supabase.from("user_achievements").insert({
          user_id: user.id,
          achievement_id: achievement.id,
          progress: currentValue,
        });

        if (error) {
          console.error("Error unlocking achievement:", error);
          continue;
        }

        // Award TrueKoins
        if (achievement.reward_trukoins > 0) {
          await earnTrukoins(
            achievement.reward_trukoins,
            "achievement_unlock",
            `Logro desbloqueado: ${achievement.name}`,
            achievement.id
          );
        }

        toast({
          title: `🏆 ¡Logro desbloqueado!`,
          description: `${achievement.icon} ${achievement.name}`,
        });
      }

      await fetchUserAchievements();
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  };

  const getAchievementProgress = (achievementId: string) => {
    return userAchievements.find((ua) => ua.achievement_id === achievementId);
  };

  const isAchievementUnlocked = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  return {
    achievements,
    userAchievements,
    loading,
    achievementsEnabled,
    checkAndUnlockAchievement,
    getAchievementProgress,
    isAchievementUnlocked,
    refetch: () => {
      fetchAchievements();
      fetchUserAchievements();
    },
  };
}
