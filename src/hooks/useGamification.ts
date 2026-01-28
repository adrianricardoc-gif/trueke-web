import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface UserLevel {
  id: string;
  user_id: string;
  level: number;
  experience_points: number;
  total_trades: number;
  total_likes_given: number;
  total_likes_received: number;
  total_products_listed: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

// XP needed for each level
const XP_PER_LEVEL = 100;

export const useGamification = () => {
  const { user } = useAuth();
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserLevel();
      fetchBadges();
      fetchUserBadges();
    }
  }, [user]);

  const fetchUserLevel = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_levels")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create new user level record
        const { data: newLevel, error: insertError } = await supabase
          .from("user_levels")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setUserLevel(newLevel);
      } else {
        setUserLevel(data);
      }
    } catch (error) {
      console.error("Error fetching user level:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("requirement_value", { ascending: true });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error("Error fetching badges:", error);
    }
  };

  const fetchUserBadges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", user.id);

      if (error) throw error;
      setUserBadges(data || []);
    } catch (error) {
      console.error("Error fetching user badges:", error);
    }
  };

  const addExperience = async (xp: number) => {
    if (!user || !userLevel) return;

    const newXP = userLevel.experience_points + xp;
    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
    const leveledUp = newLevel > userLevel.level;

    try {
      const { error } = await supabase
        .from("user_levels")
        .update({
          experience_points: newXP,
          level: newLevel,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setUserLevel((prev) =>
        prev ? { ...prev, experience_points: newXP, level: newLevel } : null
      );

      if (leveledUp) {
        toast({
          title: "¡Subiste de nivel! 🎉",
          description: `Ahora eres nivel ${newLevel}`,
        });
      }
    } catch (error) {
      console.error("Error adding experience:", error);
    }
  };

  const updateStats = async (stat: keyof Pick<UserLevel, 'total_trades' | 'total_likes_given' | 'total_likes_received' | 'total_products_listed'>, increment: number = 1) => {
    if (!user || !userLevel) return;

    const newValue = (userLevel[stat] || 0) + increment;

    try {
      const { error } = await supabase
        .from("user_levels")
        .update({ [stat]: newValue })
        .eq("user_id", user.id);

      if (error) throw error;

      setUserLevel((prev) => (prev ? { ...prev, [stat]: newValue } : null));

      // Check for badge achievements
      await checkBadgeAchievements(stat, newValue);
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  };

  const checkBadgeAchievements = async (stat: string, value: number) => {
    if (!user) return;

    const statToRequirement: Record<string, string> = {
      total_trades: "trades",
      total_likes_given: "likes_given",
      total_likes_received: "likes_received",
      total_products_listed: "products",
    };

    const requirementType = statToRequirement[stat];
    if (!requirementType) return;

    // Find eligible badges
    const eligibleBadges = badges.filter(
      (badge) =>
        badge.requirement_type === requirementType &&
        badge.requirement_value <= value &&
        !userBadges.some((ub) => ub.badge_id === badge.id)
    );

    // Award new badges
    for (const badge of eligibleBadges) {
      try {
        const { error } = await supabase
          .from("user_badges")
          .insert({ user_id: user.id, badge_id: badge.id });

        if (error) throw error;

        toast({
          title: "¡Nueva insignia desbloqueada! 🏆",
          description: badge.name,
        });

        await fetchUserBadges();
        await addExperience(50); // Bonus XP for badges
      } catch (error) {
        console.error("Error awarding badge:", error);
      }
    }
  };

  const getLevelProgress = () => {
    if (!userLevel) return 0;
    return (userLevel.experience_points % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
  };

  const getXPToNextLevel = () => {
    if (!userLevel) return XP_PER_LEVEL;
    return XP_PER_LEVEL - (userLevel.experience_points % XP_PER_LEVEL);
  };

  return {
    userLevel,
    badges,
    userBadges,
    loading,
    addExperience,
    updateStats,
    getLevelProgress,
    getXPToNextLevel,
    refetch: () => {
      fetchUserLevel();
      fetchBadges();
      fetchUserBadges();
    },
  };
};
