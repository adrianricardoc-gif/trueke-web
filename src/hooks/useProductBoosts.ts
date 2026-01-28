import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTrukoins } from "./useTrukoins";

interface ProductBoost {
  id: string;
  product_id: string;
  user_id: string;
  trukoins_spent: number;
  boost_type: string;
  starts_at: string;
  ends_at: string;
  impressions: number;
  created_at: string;
}

const BOOST_COSTS = {
  standard: 50,
  premium: 100,
  featured: 200,
};

const BOOST_DURATIONS = {
  standard: 24,
  premium: 48,
  featured: 72,
};

export function useProductBoosts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { wallet, spendTrukoins } = useTrukoins();
  const [activeBoosts, setActiveBoosts] = useState<ProductBoost[]>([]);
  const [myBoosts, setMyBoosts] = useState<ProductBoost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveBoosts();
    if (user) {
      fetchMyBoosts();
    }
  }, [user]);

  const fetchActiveBoosts = async () => {
    try {
      const { data, error } = await supabase
        .from("product_boosts")
        .select("*")
        .gt("ends_at", new Date().toISOString())
        .order("trukoins_spent", { ascending: false });

      if (error) throw error;
      setActiveBoosts(data || []);
    } catch (error) {
      console.error("Error fetching active boosts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBoosts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("product_boosts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyBoosts(data || []);
    } catch (error) {
      console.error("Error fetching my boosts:", error);
    }
  };

  const boostProduct = async (
    productId: string,
    boostType: "standard" | "premium" | "featured" = "standard"
  ) => {
    if (!user) return { error: "Not authenticated" };

    const cost = BOOST_COSTS[boostType];
    const durationHours = BOOST_DURATIONS[boostType];

    if (!wallet || wallet.balance < cost) {
      toast({
        variant: "destructive",
        title: "Saldo insuficiente",
        description: `Necesitas ${cost} TrueKoins para este boost.`,
      });
      return { error: "Insufficient balance" };
    }

    try {
      // Spend trukoins
      const { error: spendError } = await spendTrukoins(
        cost,
        `Boost ${boostType} para producto`,
        productId
      );

      if (spendError) throw spendError;

      // Create boost
      const endsAt = new Date();
      endsAt.setHours(endsAt.getHours() + durationHours);

      const { error } = await supabase.from("product_boosts").insert({
        product_id: productId,
        user_id: user.id,
        trukoins_spent: cost,
        boost_type: boostType,
        ends_at: endsAt.toISOString(),
      });

      if (error) throw error;

      toast({
        title: "¡Producto destacado!",
        description: `Tu producto aparecerá destacado por ${durationHours} horas.`,
      });

      await fetchMyBoosts();
      await fetchActiveBoosts();
      return { error: null };
    } catch (error) {
      console.error("Error boosting product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo destacar el producto.",
      });
      return { error };
    }
  };

  const isProductBoosted = (productId: string) => {
    return activeBoosts.some((b) => b.product_id === productId);
  };

  const getBoostInfo = (productId: string) => {
    return activeBoosts.find((b) => b.product_id === productId);
  };

  return {
    activeBoosts,
    myBoosts,
    loading,
    boostProduct,
    isProductBoosted,
    getBoostInfo,
    boostCosts: BOOST_COSTS,
    boostDurations: BOOST_DURATIONS,
    refetch: () => {
      fetchActiveBoosts();
      fetchMyBoosts();
    },
  };
}
