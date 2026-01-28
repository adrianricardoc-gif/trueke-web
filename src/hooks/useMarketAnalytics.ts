import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MarketAnalytics {
  id: string;
  category: string;
  city: string | null;
  avg_price: number | null;
  min_price: number | null;
  max_price: number | null;
  total_listings: number;
  total_trades: number;
  demand_score: number;
  trend: string;
  period_start: string;
  period_end: string;
}

export function useMarketAnalytics() {
  const [analytics, setAnalytics] = useState<MarketAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from("market_analytics")
        .select("*")
        .order("demand_score", { ascending: false });

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error("Error fetching market analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAnalyticsByCategory = (category: string) => {
    return analytics.filter((a) => a.category === category);
  };

  const getAnalyticsByCity = (city: string) => {
    return analytics.filter((a) => a.city === city);
  };

  const getTrendingCategories = (limit: number = 5) => {
    return analytics
      .filter((a) => a.trend === "rising")
      .sort((a, b) => b.demand_score - a.demand_score)
      .slice(0, limit);
  };

  return {
    analytics,
    loading,
    getAnalyticsByCategory,
    getAnalyticsByCity,
    getTrendingCategories,
    refetch: fetchAnalytics,
  };
}
