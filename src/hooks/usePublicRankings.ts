import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyRanking {
  id: string;
  user_id: string;
  month: number;
  year: number;
  trades_count: number;
  trukoins_earned: number;
  rating_avg: number;
  rank_position: number | null;
  created_at: string;
  profile?: {
    display_name: string;
    avatar_url: string;
    is_verified: boolean;
  };
}

export function usePublicRankings() {
  const [rankings, setRankings] = useState<MonthlyRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchRankings();
  }, [currentMonth, currentYear]);

  const fetchRankings = async () => {
    try {
      const { data, error } = await supabase
        .from("monthly_rankings")
        .select("*")
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .order("rank_position", { ascending: true })
        .limit(100);

      if (error) throw error;
      setRankings(data || []);
    } catch (error) {
      console.error("Error fetching rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  const getTopTraders = (limit: number = 10) => {
    return rankings
      .sort((a, b) => b.trades_count - a.trades_count)
      .slice(0, limit);
  };

  const getTopEarners = (limit: number = 10) => {
    return rankings
      .sort((a, b) => b.trukoins_earned - a.trukoins_earned)
      .slice(0, limit);
  };

  const getTopRated = (limit: number = 10) => {
    return rankings
      .sort((a, b) => b.rating_avg - a.rating_avg)
      .slice(0, limit);
  };

  return {
    rankings,
    loading,
    currentMonth,
    currentYear,
    changeMonth,
    getTopTraders,
    getTopEarners,
    getTopRated,
    refetch: fetchRankings,
  };
}
