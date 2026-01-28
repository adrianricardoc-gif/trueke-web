import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface PremiumLimits {
  superLikesPerDay: number;
  boostsPerMonth: number;
  rewindsPerDay: number;
  canSeeLikes: boolean;
  priorityInHot: boolean;
}

interface UsageCount {
  superLikes: number;
  boosts: number;
  rewinds: number;
}

interface FeatureEnabledState {
  superLikes: boolean;
  boosts: boolean;
  rewinds: boolean;
  whoLikesMe: boolean;
  hotSection: boolean;
  priorityRanking: boolean;
}

export function usePremiumFeatures() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isEnabled } = useFeatureFlags();
  
  // Feature flags to control visibility
  const featureEnabled: FeatureEnabledState = {
    superLikes: isEnabled("premium_super_likes"),
    boosts: isEnabled("premium_boosts"),
    rewinds: isEnabled("premium_rewinds"),
    whoLikesMe: isEnabled("premium_who_likes_me"),
    hotSection: isEnabled("premium_hot_section"),
    priorityRanking: isEnabled("premium_priority_ranking"),
  };

  const [limits, setLimits] = useState<PremiumLimits>({
    superLikesPerDay: 1,
    boostsPerMonth: 0,
    rewindsPerDay: 1,
    canSeeLikes: false,
    priorityInHot: false,
  });
  const [usage, setUsage] = useState<UsageCount>({
    superLikes: 0,
    boosts: 0,
    rewinds: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLimitsAndUsage();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchLimitsAndUsage = async () => {
    if (!user) return;

    try {
      // Fetch user's plan limits
      const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select(`
          plan:premium_plans(
            super_likes_per_day,
            boosts_per_month,
            rewinds_per_day,
            can_see_likes,
            priority_in_hot
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (subscription?.plan) {
        const plan = subscription.plan as any;
        setLimits({
          superLikesPerDay: plan.super_likes_per_day || 1,
          boostsPerMonth: plan.boosts_per_month || 0,
          rewindsPerDay: plan.rewinds_per_day || 1,
          canSeeLikes: plan.can_see_likes || false,
          priorityInHot: plan.priority_in_hot || false,
        });
      }

      // Fetch today's usage
      const today = new Date().toISOString().split('T')[0];
      const { data: usageData } = await supabase
        .from("premium_usage")
        .select("usage_type, count")
        .eq("user_id", user.id)
        .eq("usage_date", today);

      const usageCounts: UsageCount = { superLikes: 0, boosts: 0, rewinds: 0 };
      usageData?.forEach(u => {
        if (u.usage_type === 'super_like') usageCounts.superLikes = u.count;
        if (u.usage_type === 'boost') usageCounts.boosts = u.count;
        if (u.usage_type === 'rewind') usageCounts.rewinds = u.count;
      });
      setUsage(usageCounts);

    } catch (error) {
      console.error("Error fetching premium features:", error);
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (usageType: 'super_like' | 'boost' | 'rewind') => {
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data: existing } = await supabase
        .from("premium_usage")
        .select("*")
        .eq("user_id", user.id)
        .eq("usage_type", usageType)
        .eq("usage_date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("premium_usage")
          .update({ count: existing.count + 1 })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("premium_usage")
          .insert({
            user_id: user.id,
            usage_type: usageType,
            usage_date: today,
            count: 1,
          });
      }

      await fetchLimitsAndUsage();
      return true;
    } catch (error) {
      console.error("Error incrementing usage:", error);
      return false;
    }
  };

  const canUseSuperLike = usage.superLikes < limits.superLikesPerDay;
  const canUseBoost = usage.boosts < limits.boostsPerMonth;
  const canUseRewind = usage.rewinds < limits.rewindsPerDay;

  const sendSuperLike = useCallback(async (receiverId: string, productId: string) => {
    if (!user) return { success: false, error: "Not authenticated" };
    
    if (!canUseSuperLike) {
      toast({
        variant: "destructive",
        title: "Límite alcanzado",
        description: "Has agotado tus Super Likes de hoy. Hazte Premium para más.",
      });
      return { success: false, error: "Limit reached" };
    }

    try {
      // Create super like record
      const { error: superLikeError } = await supabase
        .from("super_likes")
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          product_id: productId,
        });

      if (superLikeError) throw superLikeError;

      // Also create a regular swipe with super_like flag
      const { error: swipeError } = await supabase
        .from("swipes")
        .insert({
          user_id: user.id,
          product_id: productId,
          action: 'like',
          is_super_like: true,
        });

      if (swipeError) throw swipeError;

      await incrementUsage('super_like');

      toast({
        title: "⭐ Super Like enviado",
        description: "El usuario será notificado de tu interés especial.",
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error sending super like:", error);
      return { success: false, error: error.message };
    }
  }, [user, canUseSuperLike, toast]);

  const activateBoost = useCallback(async (durationMinutes: number = 30) => {
    if (!user) return { success: false, error: "Not authenticated" };

    if (!canUseBoost) {
      toast({
        variant: "destructive",
        title: "Sin Boosts disponibles",
        description: "Has usado todos tus boosts este mes. Mejora tu plan para más.",
      });
      return { success: false, error: "Limit reached" };
    }

    try {
      const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);

      const { error } = await supabase
        .from("user_boosts")
        .insert({
          user_id: user.id,
          boost_type: 'standard',
          multiplier: 10,
          ends_at: endsAt.toISOString(),
        });

      if (error) throw error;

      await incrementUsage('boost');

      toast({
        title: "🚀 Boost activado",
        description: `Tu visibilidad x10 por ${durationMinutes} minutos.`,
      });

      return { success: true, endsAt };
    } catch (error: any) {
      console.error("Error activating boost:", error);
      return { success: false, error: error.message };
    }
  }, [user, canUseBoost, toast]);

  const useRewind = useCallback(async () => {
    if (!user) return false;

    if (!canUseRewind) {
      toast({
        variant: "destructive",
        title: "Sin Rewinds disponibles",
        description: "Has usado todos tus rewinds hoy.",
      });
      return false;
    }

    await incrementUsage('rewind');
    return true;
  }, [user, canUseRewind, toast]);

  // Respect feature flags in availability checks
  const canUseSuperLikeWithFlag = featureEnabled.superLikes && canUseSuperLike;
  const canUseBoostWithFlag = featureEnabled.boosts && canUseBoost;
  const canUseRewindWithFlag = featureEnabled.rewinds && canUseRewind;

  return {
    limits,
    usage,
    loading,
    featureEnabled,
    canUseSuperLike: canUseSuperLikeWithFlag,
    canUseBoost: canUseBoostWithFlag,
    canUseRewind: canUseRewindWithFlag,
    canSeeLikes: featureEnabled.whoLikesMe && limits.canSeeLikes,
    sendSuperLike,
    activateBoost,
    useRewind,
    remainingSuperLikes: featureEnabled.superLikes ? Math.max(0, limits.superLikesPerDay - usage.superLikes) : 0,
    remainingBoosts: featureEnabled.boosts ? Math.max(0, limits.boostsPerMonth - usage.boosts) : 0,
    remainingRewinds: featureEnabled.rewinds ? Math.max(0, limits.rewindsPerDay - usage.rewinds) : 0,
    refetch: fetchLimitsAndUsage,
  };
}
