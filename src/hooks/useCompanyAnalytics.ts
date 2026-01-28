import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface AnalyticsDataPoint {
  date: string;
  inquiries: number;
  conversions: number;
  views: number;
  likes: number;
}

interface AnalyticsSummary {
  totalInquiries: number;
  totalConversions: number;
  conversionRate: number;
  inquiriesChange: number;
  conversionsChange: number;
}

export type AnalyticsPeriod = "7d" | "30d" | "90d";

export function useCompanyAnalytics(period: AnalyticsPeriod = "30d") {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<AnalyticsDataPoint[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalInquiries: 0,
    totalConversions: 0,
    conversionRate: 0,
    inquiriesChange: 0,
    conversionsChange: 0,
  });
  const [loading, setLoading] = useState(true);

  const getDaysFromPeriod = useCallback((p: AnalyticsPeriod) => {
    switch (p) {
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
      default: return 30;
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const days = getDaysFromPeriod(period);
      const startDate = subDays(new Date(), days);
      const prevStartDate = subDays(startDate, days);

      // Fetch trade offers received (as inquiries)
      const { data: offers } = await supabase
        .from("trade_offers")
        .select("id, status, created_at")
        .eq("receiver_id", user.id)
        .gte("created_at", prevStartDate.toISOString());

      // Fetch matches (as conversions)
      const { data: matches } = await supabase
        .from("matches")
        .select("id, status, created_at")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .gte("created_at", prevStartDate.toISOString());

      // Fetch swipes on user's products (as engagement)
      const { data: userProducts } = await supabase
        .from("products")
        .select("id")
        .eq("user_id", user.id);

      const productIds = userProducts?.map(p => p.id) || [];

      const { data: swipes } = await supabase
        .from("swipes")
        .select("id, action, created_at, product_id")
        .in("product_id", productIds.length > 0 ? productIds : ['none'])
        .gte("created_at", prevStartDate.toISOString());

      // Process data into chart format
      const dataByDate: Record<string, AnalyticsDataPoint> = {};
      
      // Initialize all dates
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), i), "yyyy-MM-dd");
        dataByDate[date] = {
          date: format(subDays(new Date(), i), "dd/MM"),
          inquiries: 0,
          conversions: 0,
          views: 0,
          likes: 0,
        };
      }

      // Count inquiries per day
      offers?.forEach(offer => {
        const date = format(new Date(offer.created_at), "yyyy-MM-dd");
        if (dataByDate[date]) {
          dataByDate[date].inquiries += 1;
        }
      });

      // Count conversions per day (completed matches)
      matches?.filter(m => m.status === "completed").forEach(match => {
        const date = format(new Date(match.created_at), "yyyy-MM-dd");
        if (dataByDate[date]) {
          dataByDate[date].conversions += 1;
        }
      });

      // Count engagement per day
      swipes?.forEach(swipe => {
        const date = format(new Date(swipe.created_at), "yyyy-MM-dd");
        if (dataByDate[date]) {
          dataByDate[date].views += 1;
          if (swipe.action === "like") {
            dataByDate[date].likes += 1;
          }
        }
      });

      // Convert to array and sort by date
      const chartDataArray = Object.values(dataByDate).reverse();
      setChartData(chartDataArray);

      // Calculate summary
      const currentPeriodOffers = offers?.filter(o => 
        new Date(o.created_at) >= startDate
      ) || [];
      const prevPeriodOffers = offers?.filter(o => 
        new Date(o.created_at) >= prevStartDate && new Date(o.created_at) < startDate
      ) || [];

      const currentPeriodConversions = matches?.filter(m => 
        m.status === "completed" && new Date(m.created_at) >= startDate
      ) || [];
      const prevPeriodConversions = matches?.filter(m => 
        m.status === "completed" && new Date(m.created_at) >= prevStartDate && new Date(m.created_at) < startDate
      ) || [];

      const totalInquiries = currentPeriodOffers.length;
      const totalConversions = currentPeriodConversions.length;
      const conversionRate = totalInquiries > 0 
        ? Math.round((totalConversions / totalInquiries) * 100) 
        : 0;

      const inquiriesChange = prevPeriodOffers.length > 0
        ? Math.round(((totalInquiries - prevPeriodOffers.length) / prevPeriodOffers.length) * 100)
        : totalInquiries > 0 ? 100 : 0;

      const conversionsChange = prevPeriodConversions.length > 0
        ? Math.round(((totalConversions - prevPeriodConversions.length) / prevPeriodConversions.length) * 100)
        : totalConversions > 0 ? 100 : 0;

      setSummary({
        totalInquiries,
        totalConversions,
        conversionRate,
        inquiriesChange,
        conversionsChange,
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [user, period, getDaysFromPeriod]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    chartData,
    summary,
    loading,
    refetch: fetchAnalytics,
  };
}
