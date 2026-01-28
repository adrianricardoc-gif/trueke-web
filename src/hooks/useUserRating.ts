import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserRating {
  averageRating: number;
  reviewCount: number;
}

export function useUserRating(userId: string | undefined) {
  const [rating, setRating] = useState<UserRating>({ averageRating: 0, reviewCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchRating();
    }
  }, [userId]);

  const fetchRating = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewed_id", userId);

      if (error) throw error;

      if (data && data.length > 0) {
        const total = data.reduce((sum, review) => sum + review.rating, 0);
        const average = total / data.length;
        setRating({
          averageRating: Math.round(average * 10) / 10,
          reviewCount: data.length,
        });
      } else {
        setRating({ averageRating: 0, reviewCount: 0 });
      }
    } catch (error) {
      console.error("Error fetching user rating:", error);
    } finally {
      setLoading(false);
    }
  };

  return { ...rating, loading, refetch: fetchRating };
}
