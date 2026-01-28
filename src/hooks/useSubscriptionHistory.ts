import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionHistoryItem {
  id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  plan: {
    id: string;
    name: string;
    price: number;
    billing_period: string;
  } | null;
}

export interface DiscountUsageItem {
  id: string;
  code_id: string;
  discount_applied: number;
  used_at: string;
  code: {
    code: string;
    description: string | null;
    discount_type: string;
    discount_value: number;
  } | null;
}

export function useSubscriptionHistory() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<SubscriptionHistoryItem[]>([]);
  const [discountUsages, setDiscountUsages] = useState<DiscountUsageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch all subscriptions (not just active)
      const { data: subsData, error: subsError } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          plan_id,
          status,
          started_at,
          expires_at,
          cancelled_at,
          created_at,
          plan:premium_plans(id, name, price, billing_period)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (subsError) throw subsError;

      // Fetch discount code usages
      const { data: discountData, error: discountError } = await supabase
        .from("discount_code_uses")
        .select(`
          id,
          code_id,
          discount_applied,
          used_at,
          code:discount_codes(code, description, discount_type, discount_value)
        `)
        .eq("user_id", user.id)
        .order("used_at", { ascending: false });

      if (discountError) throw discountError;

      setSubscriptions((subsData || []) as SubscriptionHistoryItem[]);
      setDiscountUsages((discountData || []) as DiscountUsageItem[]);
    } catch (error) {
      console.error("Error fetching subscription history:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalSaved = discountUsages.reduce((acc, usage) => acc + Number(usage.discount_applied), 0);

  return {
    subscriptions,
    discountUsages,
    loading,
    totalSaved,
    refetch: fetchHistory,
  };
}
