import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TradeStats {
  totalTrades: number;
  completedTrades: number;
  pendingTrades: number;
  acceptedTrades: number;
  successRate: number;
  averageRating: number;
  totalReviews: number;
}

interface CompletedTrade {
  id: string;
  status: string;
  created_at: string;
  myProduct: {
    id: string;
    title: string;
    images: string[];
  } | null;
  theirProduct: {
    id: string;
    title: string;
    images: string[];
  } | null;
  otherUser: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useTradeStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TradeStats>({
    totalTrades: 0,
    completedTrades: 0,
    pendingTrades: 0,
    acceptedTrades: 0,
    successRate: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [completedTrades, setCompletedTrades] = useState<CompletedTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch all matches for this user
      const { data: matches } = await supabase
        .from("matches")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matches) {
        const total = matches.length;
        const completed = matches.filter((m) => m.status === "completed").length;
        const pending = matches.filter((m) => m.status === "pending").length;
        const accepted = matches.filter((m) => m.status === "accepted").length;

        // Fetch reviews for this user
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("reviewed_id", user.id);

        const totalReviews = reviews?.length || 0;
        const avgRating = totalReviews > 0
          ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

        setStats({
          totalTrades: total,
          completedTrades: completed,
          pendingTrades: pending,
          acceptedTrades: accepted,
          successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews,
        });

        // Fetch completed trades with details
        const completedMatches = matches.filter((m) => m.status === "completed");
        if (completedMatches.length > 0) {
          const productIds = [
            ...new Set(completedMatches.flatMap((m) => [m.product1_id, m.product2_id])),
          ];
          const userIds = [
            ...new Set(
              completedMatches.map((m) =>
                m.user1_id === user.id ? m.user2_id : m.user1_id
              )
            ),
          ];

          const [productsRes, profilesRes] = await Promise.all([
            supabase.from("products").select("id, title, images").in("id", productIds),
            supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds),
          ]);

          const products = productsRes.data || [];
          const profiles = profilesRes.data || [];

          const tradesWithDetails: CompletedTrade[] = completedMatches.map((match) => {
            const isUser1 = match.user1_id === user.id;
            const myProductId = isUser1 ? match.product1_id : match.product2_id;
            const theirProductId = isUser1 ? match.product2_id : match.product1_id;
            const otherUserId = isUser1 ? match.user2_id : match.user1_id;

            return {
              id: match.id,
              status: match.status,
              created_at: match.created_at,
              myProduct: products.find((p) => p.id === myProductId) || null,
              theirProduct: products.find((p) => p.id === theirProductId) || null,
              otherUser: profiles.find((p) => p.user_id === otherUserId)
                ? {
                    id: otherUserId,
                    ...profiles.find((p) => p.user_id === otherUserId)!,
                  }
                : null,
            };
          });

          setCompletedTrades(tradesWithDetails);
        }
      }
    } catch (error) {
      console.error("Error fetching trade stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, completedTrades, loading, refetch: fetchStats };
};
