import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserPremiumStatus } from "./useUserPremiumStatus";

interface FeaturedProduct {
  id: string;
  product_id: string;
  user_id: string;
  priority: number;
  featured_until: string | null;
  created_at: string;
}

export function useFeaturedProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { maxFeaturedProducts } = useUserPremiumStatus(user?.id);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserFeaturedProducts();
    }
  }, [user]);

  const fetchUserFeaturedProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("featured_products")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error("Error fetching featured products:", error);
    } finally {
      setLoading(false);
    }
  };

  const featureProduct = async (productId: string, priority: number = 1) => {
    if (!user) return { error: new Error("No user") };

    // Check if user can feature more products
    if (featuredProducts.length >= maxFeaturedProducts) {
      toast({
        variant: "destructive",
        title: "Límite alcanzado",
        description: `Tu plan permite destacar hasta ${maxFeaturedProducts} productos. Actualiza tu plan para más.`,
      });
      return { error: new Error("Limit reached") };
    }

    try {
      const { error } = await supabase
        .from("featured_products")
        .insert({
          product_id: productId,
          user_id: user.id,
          priority,
          featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (error) throw error;

      toast({
        title: "Producto destacado",
        description: "Tu producto ahora aparecerá con mayor prioridad",
      });

      await fetchUserFeaturedProducts();
      return { error: null };
    } catch (error) {
      console.error("Error featuring product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo destacar el producto",
      });
      return { error };
    }
  };

  const unfeatureProduct = async (productId: string) => {
    if (!user) return { error: new Error("No user") };

    try {
      const { error } = await supabase
        .from("featured_products")
        .delete()
        .eq("product_id", productId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Producto removido de destacados",
      });

      await fetchUserFeaturedProducts();
      return { error: null };
    } catch (error) {
      console.error("Error unfeaturing product:", error);
      return { error };
    }
  };

  const isProductFeatured = (productId: string) => {
    return featuredProducts.some(fp => fp.product_id === productId);
  };

  const canFeatureMore = featuredProducts.length < maxFeaturedProducts;

  return {
    featuredProducts,
    loading,
    featureProduct,
    unfeatureProduct,
    isProductFeatured,
    canFeatureMore,
    maxFeaturedProducts,
    currentFeaturedCount: featuredProducts.length,
    refetch: fetchUserFeaturedProducts,
  };
}
