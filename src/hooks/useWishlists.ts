import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Wishlist {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  min_value: number;
  max_value: number | null;
  is_public: boolean;
  fulfilled_at: string | null;
  fulfilled_by_product_id: string | null;
  created_at: string;
}

export function useWishlists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [publicWishlists, setPublicWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlists();
    fetchPublicWishlists();
  }, [user]);

  const fetchWishlists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWishlists(data || []);
    } catch (error) {
      console.error("Error fetching wishlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicWishlists = async () => {
    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("is_public", true)
        .is("fulfilled_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setPublicWishlists(data || []);
    } catch (error) {
      console.error("Error fetching public wishlists:", error);
    }
  };

  const addWishlistItem = async (item: Omit<Wishlist, "id" | "user_id" | "created_at" | "fulfilled_at" | "fulfilled_by_product_id">) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase.from("wishlists").insert({
        ...item,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "¡Agregado a tu wishlist!",
        description: "Otros usuarios podrán ver lo que buscas.",
      });

      await fetchWishlists();
      return { error: null };
    } catch (error) {
      console.error("Error adding wishlist item:", error);
      return { error };
    }
  };

  const removeWishlistItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      await fetchWishlists();
    } catch (error) {
      console.error("Error removing wishlist item:", error);
    }
  };

  return {
    wishlists,
    publicWishlists,
    loading,
    addWishlistItem,
    removeWishlistItem,
    refetch: fetchWishlists,
  };
}
