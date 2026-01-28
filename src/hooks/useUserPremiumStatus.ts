import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PremiumStatus {
  isPremium: boolean;
  planName: string | null;
  planPrice: number;
  expiresAt: string | null;
  visibilityBoost: number;
  maxFeaturedProducts: number;
}

export function useUserPremiumStatus(userId?: string) {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>({
    isPremium: false,
    planName: null,
    planPrice: 0,
    expiresAt: null,
    visibilityBoost: 1,
    maxFeaturedProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchPremiumStatus();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchPremiumStatus = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          status,
          expires_at,
          plan:premium_plans(
            id,
            name,
            price,
            visibility_boost,
            max_featured_products
          )
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;

      if (data && data.plan) {
        const plan = data.plan as any;
        setPremiumStatus({
          isPremium: plan.price > 0,
          planName: plan.name,
          planPrice: plan.price,
          expiresAt: data.expires_at,
          visibilityBoost: plan.visibility_boost || 1,
          maxFeaturedProducts: plan.max_featured_products || 0,
        });
      } else {
        setPremiumStatus({
          isPremium: false,
          planName: null,
          planPrice: 0,
          expiresAt: null,
          visibilityBoost: 1,
          maxFeaturedProducts: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching premium status:", error);
    } finally {
      setLoading(false);
    }
  };

  return { ...premiumStatus, loading, refetch: fetchPremiumStatus };
}
