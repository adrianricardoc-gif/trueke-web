import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumFeatures } from "./usePremiumFeatures";

interface LikeInfo {
  id: string;
  product_id: string;
  product_title: string;
  product_image: string | null;
  liker_id: string;
  liker_name: string | null;
  liker_avatar: string | null;
  is_super_like: boolean;
  created_at: string;
}

export function useWhoLikesMe() {
  const { user } = useAuth();
  const { limits } = usePremiumFeatures();
  const [likes, setLikes] = useState<LikeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [blurredCount, setBlurredCount] = useState(0);

  const canSeeLikes = limits.canSeeLikes;

  useEffect(() => {
    if (user) {
      fetchLikes();
    }
  }, [user, canSeeLikes]);

  const fetchLikes = async () => {
    if (!user) return;

    try {
      // Get my products
      const { data: myProducts } = await supabase
        .from("products")
        .select("id, title, images")
        .eq("user_id", user.id);

      if (!myProducts || myProducts.length === 0) {
        setLikes([]);
        setLoading(false);
        return;
      }

      const myProductIds = myProducts.map(p => p.id);

      // Get swipes on my products that are likes
      const { data: swipes, error } = await supabase
        .from("swipes")
        .select(`
          id,
          product_id,
          user_id,
          is_super_like,
          created_at
        `)
        .in("product_id", myProductIds)
        .eq("action", "like")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get profiles for likers
      const likerIds = [...new Set(swipes?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", likerIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => {
        profileMap[p.user_id] = p;
      });

      const productMap: Record<string, any> = {};
      myProducts.forEach(p => {
        productMap[p.id] = p;
      });

      const likeInfos: LikeInfo[] = (swipes || []).map(s => ({
        id: s.id,
        product_id: s.product_id,
        product_title: productMap[s.product_id]?.title || "Producto",
        product_image: productMap[s.product_id]?.images?.[0] || null,
        liker_id: s.user_id,
        liker_name: profileMap[s.user_id]?.display_name || "Usuario",
        liker_avatar: profileMap[s.user_id]?.avatar_url || null,
        is_super_like: s.is_super_like || false,
        created_at: s.created_at,
      }));

      // If can't see likes, only show super likes clearly
      if (!canSeeLikes) {
        const superLikes = likeInfos.filter(l => l.is_super_like);
        const regularLikes = likeInfos.filter(l => !l.is_super_like);
        setBlurredCount(regularLikes.length);
        setLikes(superLikes);
      } else {
        setBlurredCount(0);
        setLikes(likeInfos);
      }

    } catch (error) {
      console.error("Error fetching likes:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    likes,
    loading,
    canSeeLikes,
    blurredCount,
    totalLikes: likes.length + blurredCount,
    refetch: fetchLikes,
  };
}
