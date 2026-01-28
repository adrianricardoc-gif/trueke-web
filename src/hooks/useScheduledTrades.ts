import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ScheduledTrade {
  id: string;
  match_id: string | null;
  proposed_by: string;
  scheduled_date: string;
  location: string | null;
  meeting_point_id: string | null;
  reminder_sent: boolean;
  status: string;
  notes: string | null;
  created_at: string;
}

export function useScheduledTrades() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scheduledTrades, setScheduledTrades] = useState<ScheduledTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchScheduledTrades();
    }
  }, [user]);

  const fetchScheduledTrades = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("scheduled_trades")
        .select("*")
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      setScheduledTrades(data || []);
    } catch (error) {
      console.error("Error fetching scheduled trades:", error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleTrade = async (
    matchId: string,
    scheduledDate: string,
    location?: string,
    meetingPointId?: string,
    notes?: string
  ) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase.from("scheduled_trades").insert({
        match_id: matchId,
        proposed_by: user.id,
        scheduled_date: scheduledDate,
        location,
        meeting_point_id: meetingPointId,
        notes,
      });

      if (error) throw error;

      toast({
        title: "Trueke programado",
        description: "Se notificará a la otra persona",
      });

      await fetchScheduledTrades();
      return { error: null };
    } catch (error) {
      console.error("Error scheduling trade:", error);
      return { error };
    }
  };

  const confirmScheduledTrade = async (id: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase
        .from("scheduled_trades")
        .update({ status: "confirmed" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Trueke confirmado",
        description: "¡Nos vemos en el punto de encuentro!",
      });

      await fetchScheduledTrades();
      return { error: null };
    } catch (error) {
      console.error("Error confirming scheduled trade:", error);
      return { error };
    }
  };

  const cancelScheduledTrade = async (id: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase
        .from("scheduled_trades")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;

      toast({
        variant: "destructive",
        title: "Trueke cancelado",
      });

      await fetchScheduledTrades();
      return { error: null };
    } catch (error) {
      console.error("Error cancelling scheduled trade:", error);
      return { error };
    }
  };

  return {
    scheduledTrades,
    loading,
    scheduleTrade,
    confirmScheduledTrade,
    cancelScheduledTrade,
    refetch: fetchScheduledTrades,
  };
}
