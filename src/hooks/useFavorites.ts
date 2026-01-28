import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Favorite {
  id: string;
  product_id: string;
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("favorites")
      .select("product_id")
      .eq("user_id", user.id);

    if (!error && data) {
      setFavorites(new Set(data.map((f) => f.product_id)));
    }
    setLoading(false);
  };

  const addFavorite = useCallback(async (productId: string) => {
    if (!user) return false;

    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      product_id: productId,
    });

    if (!error) {
      setFavorites((prev) => new Set([...prev, productId]));
      return true;
    }
    return false;
  }, [user]);

  const removeFavorite = useCallback(async (productId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (!error) {
      setFavorites((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      return true;
    }
    return false;
  }, [user]);

  const toggleFavorite = useCallback(async (productId: string) => {
    if (favorites.has(productId)) {
      return removeFavorite(productId);
    } else {
      return addFavorite(productId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((productId: string) => {
    return favorites.has(productId);
  }, [favorites]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
}
