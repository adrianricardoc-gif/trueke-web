import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PremiumPlan } from "./usePremiumPlans";

export function useAdminPlans() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllPlans();
  }, []);

  const fetchAllPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("premium_plans")
        .select("*")
        .order("target_user_type", { ascending: true })
        .order("price", { ascending: true });

      if (error) throw error;
      
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

  const createPlan = async (planData: Partial<PremiumPlan>) => {
    try {
      const { error } = await supabase
        .from("premium_plans")
        .insert({
          name: planData.name,
          description: planData.description,
          price: planData.price || 0,
          billing_period: planData.billing_period || "monthly",
          target_user_type: planData.target_user_type || "all",
          features: planData.features || [],
          visibility_boost: planData.visibility_boost || 1,
          max_products: planData.max_products,
          max_featured_products: planData.max_featured_products || 0,
          is_active: planData.is_active !== false,
          super_likes_per_day: planData.super_likes_per_day || 1,
          boosts_per_month: planData.boosts_per_month || 0,
          rewinds_per_day: planData.rewinds_per_day || 1,
          can_see_likes: planData.can_see_likes || false,
          priority_in_hot: planData.priority_in_hot || false,
          enable_super_likes: planData.enable_super_likes !== false,
          enable_boosts: planData.enable_boosts !== false,
          enable_rewinds: planData.enable_rewinds !== false,
          enable_who_likes_me: planData.enable_who_likes_me || false,
          enable_hot_priority: planData.enable_hot_priority || false,
          enable_missions: planData.enable_missions !== false,
          enable_achievements: planData.enable_achievements !== false,
          enable_tournaments: planData.enable_tournaments !== false,
          enable_auctions: planData.enable_auctions !== false,
        });

      if (error) throw error;

      toast({
        title: "Plan creado",
        description: "El plan ha sido creado exitosamente.",
      });

      await fetchAllPlans();
      return { error: null };
    } catch (error) {
      console.error("Error creating plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el plan.",
      });
      return { error };
    }
  };

  const updatePlan = async (planId: string, updates: Partial<PremiumPlan>) => {
    try {
      const { error } = await supabase
        .from("premium_plans")
        .update({
          name: updates.name,
          description: updates.description,
          price: updates.price,
          billing_period: updates.billing_period,
          target_user_type: updates.target_user_type,
          features: updates.features,
          visibility_boost: updates.visibility_boost,
          max_products: updates.max_products,
          max_featured_products: updates.max_featured_products,
          is_active: updates.is_active,
          super_likes_per_day: updates.super_likes_per_day,
          boosts_per_month: updates.boosts_per_month,
          rewinds_per_day: updates.rewinds_per_day,
          can_see_likes: updates.can_see_likes,
          priority_in_hot: updates.priority_in_hot,
          enable_super_likes: updates.enable_super_likes,
          enable_boosts: updates.enable_boosts,
          enable_rewinds: updates.enable_rewinds,
          enable_who_likes_me: updates.enable_who_likes_me,
          enable_hot_priority: updates.enable_hot_priority,
          enable_missions: updates.enable_missions,
          enable_achievements: updates.enable_achievements,
          enable_tournaments: updates.enable_tournaments,
          enable_auctions: updates.enable_auctions,
        })
        .eq("id", planId);

      if (error) throw error;

      toast({
        title: "Plan actualizado",
        description: "El plan ha sido actualizado exitosamente.",
      });

      await fetchAllPlans();
      return { error: null };
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el plan.",
      });
      return { error };
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from("premium_plans")
        .update({ is_active: false })
        .eq("id", planId);

      if (error) throw error;

      toast({
        title: "Plan desactivado",
        description: "El plan ha sido desactivado.",
      });

      await fetchAllPlans();
      return { error: null };
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo desactivar el plan.",
      });
      return { error };
    }
  };

  return {
    plans,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    refetch: fetchAllPlans,
  };
}
