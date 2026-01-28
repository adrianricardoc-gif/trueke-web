import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

interface UserStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  personUsers: number;
  companyUsers: number;
  verifiedUsers: number;
}

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  premiumPersons: number;
  premiumCompanies: number;
  monthlyRevenue: number;
}

interface ActivityStats {
  totalProducts: number;
  activeProducts: number;
  totalServices: number;
  totalMatches: number;
  completedTrades: number;
  pendingTrades: number;
  totalMessages: number;
  totalSwipes: number;
}

interface DailyActivityData {
  date: string;
  users: number;
  products: number;
  matches: number;
  messages: number;
}

export function useAdminStats() {
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    personUsers: 0,
    companyUsers: 0,
    verifiedUsers: 0,
  });

  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    cancelledSubscriptions: 0,
    premiumPersons: 0,
    premiumCompanies: 0,
    monthlyRevenue: 0,
  });

  const [activityStats, setActivityStats] = useState<ActivityStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalServices: 0,
    totalMatches: 0,
    completedTrades: 0,
    pendingTrades: 0,
    totalMessages: 0,
    totalSwipes: 0,
  });

  const [dailyActivity, setDailyActivity] = useState<DailyActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserStats(),
      fetchSubscriptionStats(),
      fetchActivityStats(),
      fetchDailyActivity(),
    ]);
    setLoading(false);
  };

  const fetchUserStats = async () => {
    try {
      const today = startOfDay(new Date());
      const weekAgo = subDays(today, 7);
      const monthAgo = subDays(today, 30);

      // Get all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_type, is_verified, created_at");

      if (!profiles) return;

      const totalUsers = profiles.length;
      const newUsersToday = profiles.filter(p => 
        new Date(p.created_at) >= today
      ).length;
      const newUsersThisWeek = profiles.filter(p => 
        new Date(p.created_at) >= weekAgo
      ).length;
      const newUsersThisMonth = profiles.filter(p => 
        new Date(p.created_at) >= monthAgo
      ).length;
      const personUsers = profiles.filter(p => p.user_type === "person").length;
      const companyUsers = profiles.filter(p => p.user_type === "company").length;
      const verifiedUsers = profiles.filter(p => p.is_verified).length;

      setUserStats({
        totalUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        personUsers,
        companyUsers,
        verifiedUsers,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const fetchSubscriptionStats = async () => {
    try {
      // Get all subscriptions with plan details
      const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select(`
          id, 
          status, 
          user_id,
          plan:premium_plans(id, price, target_user_type)
        `);

      if (!subscriptions) return;

      const activeSubscriptions = subscriptions.filter(s => s.status === "active");
      const cancelledSubscriptions = subscriptions.filter(s => s.status === "cancelled");
      
      // Count premium users by type (excluding free plans)
      const premiumPersons = activeSubscriptions.filter(s => 
        s.plan && (s.plan as any).price > 0 && (s.plan as any).target_user_type === "person"
      ).length;
      const premiumCompanies = activeSubscriptions.filter(s => 
        s.plan && (s.plan as any).price > 0 && (s.plan as any).target_user_type === "company"
      ).length;

      // Calculate monthly revenue from active paid subscriptions
      const monthlyRevenue = activeSubscriptions.reduce((acc, s) => {
        if (s.plan && (s.plan as any).price > 0) {
          return acc + (s.plan as any).price;
        }
        return acc;
      }, 0);

      setSubscriptionStats({
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeSubscriptions.length,
        cancelledSubscriptions: cancelledSubscriptions.length,
        premiumPersons,
        premiumCompanies,
        monthlyRevenue,
      });
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
    }
  };

  const fetchActivityStats = async () => {
    try {
      // Products
      const { data: products } = await supabase
        .from("products")
        .select("id, status, product_type");

      const totalProducts = products?.filter(p => p.product_type === "product").length || 0;
      const activeProducts = products?.filter(p => p.status === "active").length || 0;
      const totalServices = products?.filter(p => p.product_type === "service").length || 0;

      // Matches
      const { data: matches } = await supabase
        .from("matches")
        .select("id, status");

      const totalMatches = matches?.length || 0;
      const completedTrades = matches?.filter(m => m.status === "completed").length || 0;
      const pendingTrades = matches?.filter(m => m.status === "pending").length || 0;

      // Messages
      const { count: messagesCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true });

      // Swipes
      const { count: swipesCount } = await supabase
        .from("swipes")
        .select("id", { count: "exact", head: true });

      setActivityStats({
        totalProducts,
        activeProducts,
        totalServices,
        totalMatches,
        completedTrades,
        pendingTrades,
        totalMessages: messagesCount || 0,
        totalSwipes: swipesCount || 0,
      });
    } catch (error) {
      console.error("Error fetching activity stats:", error);
    }
  };

  const fetchDailyActivity = async () => {
    try {
      const days = 14;
      const startDate = subDays(new Date(), days - 1);
      const dayStart = startOfDay(startDate).toISOString();
      const dayEnd = endOfDay(new Date()).toISOString();

      // Fetch all data in parallel for the entire range
      const [profilesRes, productsRes, matchesRes, messagesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd),
        supabase
          .from("products")
          .select("created_at")
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd),
        supabase
          .from("matches")
          .select("created_at")
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd),
        supabase
          .from("messages")
          .select("created_at")
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd),
      ]);

      // Group by day
      const data: DailyActivityData[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStartLocal = startOfDay(day);
        const dayEndLocal = endOfDay(day);

        const countInDay = (items: { created_at: string }[] | null) => {
          if (!items) return 0;
          return items.filter(item => {
            const created = new Date(item.created_at);
            return created >= dayStartLocal && created <= dayEndLocal;
          }).length;
        };

        data.push({
          date: format(day, "dd/MM"),
          users: countInDay(profilesRes.data),
          products: countInDay(productsRes.data),
          matches: countInDay(matchesRes.data),
          messages: countInDay(messagesRes.data),
        });
      }

      setDailyActivity(data);
    } catch (error) {
      console.error("Error fetching daily activity:", error);
    }
  };

  return {
    userStats,
    subscriptionStats,
    activityStats,
    dailyActivity,
    loading,
    refetch: fetchAllStats,
  };
}
