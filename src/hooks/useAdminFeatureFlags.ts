import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

export function useAdminFeatureFlags() {
  const { toast } = useToast();
  const { allFlags, refetch } = useFeatureFlags();
  const [updating, setUpdating] = useState<string | null>(null);

  const toggleFeature = async (featureKey: string, enabled: boolean) => {
    setUpdating(featureKey);
    try {
      const { error } = await supabase
        .from("feature_flags")
        .update({ is_enabled: enabled })
        .eq("feature_key", featureKey);

      if (error) throw error;

      toast({
        title: enabled ? "Funcionalidad activada" : "Funcionalidad desactivada",
        description: `${featureKey} ha sido ${enabled ? "activada" : "desactivada"}.`,
      });

      await refetch();
    } catch (error) {
      console.error("Error toggling feature:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la funcionalidad.",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getFeaturesByCategory = () => {
    const categories: Record<string, typeof allFlags> = {};
    allFlags.forEach((flag) => {
      if (!categories[flag.category]) {
        categories[flag.category] = [];
      }
      categories[flag.category].push(flag);
    });
    return categories;
  };

  return {
    flags: allFlags,
    updating,
    toggleFeature,
    getFeaturesByCategory,
    refetch,
  };
}
