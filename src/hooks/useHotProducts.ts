import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface HotProduct {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  estimated_value: number;
  additional_value: number | null;
  category: string;
  product_type: string;
  condition: string | null;
  location: string | null;
  user_id: string;
  status: string;
  like_count: number;
  premium_boost: number;
  active_boost: number;
  featured_multiplier: number;
  hot_score: number;
}

export function useHotProducts(limit: number = 10) {
  const { user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const [hotProducts, setHotProducts] = useState<HotProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isHotSectionEnabled = isEnabled("premium_hot_section");

  useEffect(() => {
    if (isHotSectionEnabled) {
      fetchHotProducts();
    } else {
      setLoading(false);
    }
  }, [user, isHotSectionEnabled]);

  const fetchHotProducts = async () => {
    try {
      // Query the hot_products view
      const { data, error } = await supabase
        .from("hot_products")
        .select("*")
        .neq("user_id", user?.id || "")
        .limit(limit);

      if (error) throw error;

      setHotProducts(data as HotProduct[] || []);
    } catch (error) {
      console.error("Error fetching hot products:", error);
      // Fallback to regular products query if view fails
      await fetchFallbackHotProducts();
    } finally {
      setLoading(false);
    }
  };

  const fetchFallbackHotProducts = async () => {
    try {
      // Fallback: get products with most likes
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .neq("user_id", user?.id || "")
        .limit(limit);

      if (error) throw error;

      // Get like counts for each product
      const productIds = products?.map(p => p.id) || [];
      const { data: likeCounts } = await supabase
        .from("swipes")
        .select("product_id")
        .eq("action", "like")
        .in("product_id", productIds);

      // Count likes per product
      const likeMap: Record<string, number> = {};
      likeCounts?.forEach(s => {
        likeMap[s.product_id] = (likeMap[s.product_id] || 0) + 1;
      });

      // Sort by likes
      const sortedProducts = (products || [])
        .map(p => ({
          ...p,
          like_count: likeMap[p.id] || 0,
          premium_boost: 1,
          active_boost: 1,
          featured_multiplier: 1,
          hot_score: likeMap[p.id] || 0,
        }))
        .sort((a, b) => b.hot_score - a.hot_score);

      setHotProducts(sortedProducts as HotProduct[]);
    } catch (error) {
      console.error("Error in fallback hot products:", error);
    }
  };

  return {
    hotProducts,
    loading,
    isEnabled: isHotSectionEnabled,
    refetch: fetchHotProducts,
  };
}
