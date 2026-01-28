import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CompanyStats {
  totalServices: number;
  activeServices: number;
  totalInquiries: number;
  pendingOffers: number;
  acceptedOffers: number;
  completedDeals: number;
  conversionRate: number;
  averageResponseTime: string;
  totalViews: number;
  likesReceived: number;
}

export const useCompanyStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CompanyStats>({
    totalServices: 0,
    activeServices: 0,
    totalInquiries: 0,
    pendingOffers: 0,
    acceptedOffers: 0,
    completedDeals: 0,
    conversionRate: 0,
    averageResponseTime: "-",
    totalViews: 0,
    likesReceived: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCompanyStats();
    }
  }, [user]);

  const fetchCompanyStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch all services (products with type = 'service')
      const { data: products } = await supabase
        .from("products")
        .select("id, status, product_type")
        .eq("user_id", user.id);

      const services = products?.filter(p => p.product_type === "service") || [];
      const totalServices = services.length;
      const activeServices = services.filter(p => p.status === "active").length;

      // Fetch trade offers received
      const { data: offersReceived } = await supabase
        .from("trade_offers")
        .select("id, status, created_at, responded_at")
        .eq("receiver_id", user.id);

      const pendingOffers = offersReceived?.filter(o => o.status === "pending").length || 0;
      const acceptedOffers = offersReceived?.filter(o => o.status === "accepted").length || 0;

      // Fetch matches for completed deals
      const { data: matches } = await supabase
        .from("matches")
        .select("id, status")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      const completedDeals = matches?.filter(m => m.status === "completed").length || 0;

      // Fetch likes received on user's products
      const { data: swipes } = await supabase
        .from("swipes")
        .select("id, product_id")
        .eq("action", "like");

      const userProductIds = products?.map(p => p.id) || [];
      const likesReceived = swipes?.filter(s => userProductIds.includes(s.product_id)).length || 0;

      // Calculate conversion rate
      const totalInquiries = offersReceived?.length || 0;
      const conversionRate = totalInquiries > 0 
        ? Math.round((completedDeals / totalInquiries) * 100) 
        : 0;

      // Calculate average response time
      const respondedOffers = offersReceived?.filter(o => o.responded_at && o.created_at) || [];
      let avgResponseTime = "-";
      
      if (respondedOffers.length > 0) {
        const totalMs = respondedOffers.reduce((acc, offer) => {
          const created = new Date(offer.created_at).getTime();
          const responded = new Date(offer.responded_at!).getTime();
          return acc + (responded - created);
        }, 0);
        
        const avgMs = totalMs / respondedOffers.length;
        const hours = Math.floor(avgMs / (1000 * 60 * 60));
        
        if (hours < 1) {
          avgResponseTime = "< 1h";
        } else if (hours < 24) {
          avgResponseTime = `${hours}h`;
        } else {
          const days = Math.floor(hours / 24);
          avgResponseTime = `${days}d`;
        }
      }

      setStats({
        totalServices,
        activeServices,
        totalInquiries,
        pendingOffers,
        acceptedOffers,
        completedDeals,
        conversionRate,
        averageResponseTime: avgResponseTime,
        totalViews: likesReceived * 3, // Approximate views
        likesReceived,
      });
    } catch (error) {
      console.error("Error fetching company stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchCompanyStats };
};
