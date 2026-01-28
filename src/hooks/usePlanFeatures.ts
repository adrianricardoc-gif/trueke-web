import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PlanFeatures {
  // Limits
  maxProducts: number | null;
  maxFeaturedProducts: number;
  superLikesPerDay: number;
  boostsPerMonth: number;
  rewindsPerDay: number;
  visibilityBoost: number;
  
  // Feature toggles
  canSeeLikes: boolean;
  priorityInHot: boolean;
  enableSuperLikes: boolean;
  enableBoosts: boolean;
  enableRewinds: boolean;
  enableWhoLikesMe: boolean;
  enableHotPriority: boolean;
  enableMissions: boolean;
  enableAchievements: boolean;
  enableTournaments: boolean;
  enableAuctions: boolean;
  
  // Meta
  isPremium: boolean;
  planName: string | null;
}

const DEFAULT_FREE_FEATURES: PlanFeatures = {
  maxProducts: 5,
  maxFeaturedProducts: 0,
  superLikesPerDay: 1,
  boostsPerMonth: 0,
  rewindsPerDay: 1,
  visibilityBoost: 1,
  canSeeLikes: false,
  priorityInHot: false,
  enableSuperLikes: true,
  enableBoosts: false,
  enableRewinds: true,
  enableWhoLikesMe: false,
  enableHotPriority: false,
  enableMissions: true,
  enableAchievements: true,
  enableTournaments: true,
  enableAuctions: true,
  isPremium: false,
  planName: "Gratuito",
};

export function usePlanFeatures() {
  const { user } = useAuth();
  const [features, setFeatures] = useState<PlanFeatures>(DEFAULT_FREE_FEATURES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlanFeatures();
    } else {
      loadFreeDefaults();
    }
  }, [user]);

  const loadFreeDefaults = async () => {
    try {
      // Fetch free user settings from admin_settings
      const { data: settings } = await supabase
        .from("admin_settings")
        .select("key, value")
        .in("key", [
          "free_max_products",
          "free_max_featured_products", 
          "free_super_likes_per_day",
          "free_boosts_per_month",
          "free_rewinds_per_day",
          "free_can_see_likes",
          "free_can_participate_tournaments",
          "free_can_participate_auctions",
        ]);

      const settingsMap: Record<string, string> = {};
      settings?.forEach(s => { settingsMap[s.key] = s.value || ""; });

      setFeatures({
        ...DEFAULT_FREE_FEATURES,
        maxProducts: parseInt(settingsMap.free_max_products) || 5,
        maxFeaturedProducts: parseInt(settingsMap.free_max_featured_products) || 0,
        superLikesPerDay: parseInt(settingsMap.free_super_likes_per_day) || 1,
        boostsPerMonth: parseInt(settingsMap.free_boosts_per_month) || 0,
        rewindsPerDay: parseInt(settingsMap.free_rewinds_per_day) || 1,
        canSeeLikes: settingsMap.free_can_see_likes === "true",
        enableTournaments: settingsMap.free_can_participate_tournaments !== "false",
        enableAuctions: settingsMap.free_can_participate_auctions !== "false",
      });
    } catch (error) {
      console.error("Error loading free defaults:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanFeatures = async () => {
    if (!user) {
      await loadFreeDefaults();
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          status,
          plan:premium_plans(
            name,
            price,
            max_products,
            max_featured_products,
            super_likes_per_day,
            boosts_per_month,
            rewinds_per_day,
            visibility_boost,
            can_see_likes,
            priority_in_hot,
            enable_super_likes,
            enable_boosts,
            enable_rewinds,
            enable_who_likes_me,
            enable_hot_priority,
            enable_missions,
            enable_achievements,
            enable_tournaments,
            enable_auctions
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;

      if (data?.plan) {
        const plan = data.plan as any;
        setFeatures({
          maxProducts: plan.max_products,
          maxFeaturedProducts: plan.max_featured_products || 0,
          superLikesPerDay: plan.super_likes_per_day || 1,
          boostsPerMonth: plan.boosts_per_month || 0,
          rewindsPerDay: plan.rewinds_per_day || 1,
          visibilityBoost: plan.visibility_boost || 1,
          canSeeLikes: plan.can_see_likes || false,
          priorityInHot: plan.priority_in_hot || false,
          enableSuperLikes: plan.enable_super_likes !== false,
          enableBoosts: plan.enable_boosts !== false,
          enableRewinds: plan.enable_rewinds !== false,
          enableWhoLikesMe: plan.enable_who_likes_me || false,
          enableHotPriority: plan.enable_hot_priority || false,
          enableMissions: plan.enable_missions !== false,
          enableAchievements: plan.enable_achievements !== false,
          enableTournaments: plan.enable_tournaments !== false,
          enableAuctions: plan.enable_auctions !== false,
          isPremium: plan.price > 0,
          planName: plan.name,
        });
      } else {
        await loadFreeDefaults();
      }
    } catch (error) {
      console.error("Error fetching plan features:", error);
      await loadFreeDefaults();
    } finally {
      setLoading(false);
    }
  };

  return {
    ...features,
    loading,
    refetch: fetchPlanFeatures,
  };
}
