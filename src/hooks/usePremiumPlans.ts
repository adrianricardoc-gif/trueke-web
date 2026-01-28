import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface PremiumPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: string;
  target_user_type: string;
  features: string[];
  visibility_boost: number;
  max_products: number | null;
  max_featured_products: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Tinder-style limits
  super_likes_per_day?: number;
  boosts_per_month?: number;
  rewinds_per_day?: number;
  can_see_likes?: boolean;
  priority_in_hot?: boolean;
  // Feature toggles per plan
  enable_super_likes?: boolean;
  enable_boosts?: boolean;
  enable_rewinds?: boolean;
  enable_who_likes_me?: boolean;
  enable_hot_priority?: boolean;
  enable_missions?: boolean;
  enable_achievements?: boolean;
  enable_tournaments?: boolean;
  enable_auctions?: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  plan?: PremiumPlan;
}

export function usePremiumPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchUserSubscription();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("premium_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;
      
      // Parse features from JSONB
      const parsedPlans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as string || '[]')
      }));
      
      setPlans(parsedPlans as PremiumPlan[]);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          plan:premium_plans(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setUserSubscription({
          ...data,
          plan: data.plan ? {
            ...data.plan,
            features: Array.isArray(data.plan.features) 
              ? data.plan.features 
              : JSON.parse(data.plan.features as string || '[]')
          } : undefined
        } as UserSubscription);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const subscribeToPlan = async (planId: string) => {
    if (!user) return { error: new Error("No user") };

    try {
      // Check if already subscribed
      if (userSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .update({ 
            plan_id: planId, 
            started_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq("id", userSubscription.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: user.id,
            plan_id: planId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (error) throw error;
      }

      toast({
        title: "¡Suscripción activada!",
        description: "Tu plan premium ha sido activado exitosamente.",
      });

      await fetchUserSubscription();
      return { error: null };
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo activar la suscripción.",
      });
      return { error };
    }
  };

  const cancelSubscription = async () => {
    if (!userSubscription) return { error: new Error("No subscription") };

    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({ 
          status: "cancelled",
          cancelled_at: new Date().toISOString()
        })
        .eq("id", userSubscription.id);

      if (error) throw error;

      toast({
        title: "Suscripción cancelada",
        description: "Tu suscripción ha sido cancelada.",
      });

      setUserSubscription(null);
      return { error: null };
    } catch (error) {
      console.error("Error cancelling:", error);
      return { error };
    }
  };

  const getPlansForUserType = (userType: "person" | "company") => {
    return plans.filter(
      plan => plan.target_user_type === userType || plan.target_user_type === "all"
    );
  };

  const isPremium = userSubscription?.plan && (userSubscription.plan.price > 0);

  return {
    plans,
    userSubscription,
    loading,
    subscribeToPlan,
    cancelSubscription,
    getPlansForUserType,
    isPremium,
    refetch: fetchPlans,
  };
}
