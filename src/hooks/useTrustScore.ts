import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TrustData {
  completedTrades: number;
  isVerified: boolean;
  level: number;
  trustScore: number;
  trustTier: "new" | "active" | "verified" | "trusted" | "elite";
}

export function useTrustScore(userId?: string) {
  const [trustData, setTrustData] = useState<TrustData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchTrustData = async () => {
      try {
        // Fetch profile verification status
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_verified")
          .eq("user_id", userId)
          .maybeSingle();

        // Fetch user level
        const { data: userLevel } = await supabase
          .from("user_levels")
          .select("level, total_trades")
          .eq("user_id", userId)
          .maybeSingle();

        // Count completed trades (matches with status = 'completed')
        const { count: completedTradesCount } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed")
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

        const completedTrades = completedTradesCount || userLevel?.total_trades || 0;
        const isVerified = profile?.is_verified || false;
        const level = userLevel?.level || 1;

        // Calculate trust score
        let score = 0;
        score += Math.min(completedTrades * 4, 40);
        if (isVerified) score += 30;
        score += Math.min(level * 2, 30);

        let trustTier: TrustData["trustTier"] = "new";
        if (score >= 80) trustTier = "elite";
        else if (score >= 60) trustTier = "trusted";
        else if (score >= 40) trustTier = "verified";
        else if (score >= 20) trustTier = "active";

        setTrustData({
          completedTrades,
          isVerified,
          level,
          trustScore: score,
          trustTier,
        });
      } catch (error) {
        console.error("Error fetching trust data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrustData();
  }, [userId]);

  return { trustData, loading };
}
