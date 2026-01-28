import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CircularTrade {
  id: string;
  initiator_id: string;
  status: string;
  min_participants: number;
  max_participants: number;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  participants?: CircularTradeParticipant[];
}

interface CircularTradeParticipant {
  id: string;
  trade_id: string;
  user_id: string;
  product_id: string | null;
  position: number | null;
  receives_from_user_id: string | null;
  gives_to_user_id: string | null;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  product?: {
    id: string;
    title: string;
    images: string[];
  };
}

export function useCircularTrades() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trades, setTrades] = useState<CircularTrade[]>([]);
  const [myTrades, setMyTrades] = useState<CircularTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
    if (user) {
      fetchMyTrades();
    }
  }, [user]);

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from("circular_trades")
        .select(`
          *,
          participants:circular_trade_participants(
            *,
            product:products(id, title, images)
          )
        `)
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error("Error fetching circular trades:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTrades = async () => {
    if (!user) return;

    try {
      // Get trades where user is initiator
      const { data: initiatedTrades, error: error1 } = await supabase
        .from("circular_trades")
        .select(`
          *,
          participants:circular_trade_participants(
            *,
            product:products(id, title, images)
          )
        `)
        .eq("initiator_id", user.id)
        .order("created_at", { ascending: false });

      if (error1) throw error1;

      // Get trades where user is participant
      const { data: participatingTrades, error: error2 } = await supabase
        .from("circular_trade_participants")
        .select(`
          trade:circular_trades(
            *,
            participants:circular_trade_participants(
              *,
              product:products(id, title, images)
            )
          )
        `)
        .eq("user_id", user.id);

      if (error2) throw error2;

      const allTrades = [
        ...(initiatedTrades || []),
        ...(participatingTrades?.map(p => p.trade).filter(Boolean) || []),
      ];

      // Remove duplicates
      const uniqueTrades = allTrades.filter(
        (trade, index, self) =>
          trade && index === self.findIndex(t => t?.id === trade.id)
      );

      setMyTrades(uniqueTrades as CircularTrade[]);
    } catch (error) {
      console.error("Error fetching my circular trades:", error);
    }
  };

  const createCircularTrade = async (
    productId: string,
    minParticipants: number = 3,
    maxParticipants: number = 10,
    expiresInHours: number = 48
  ) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      // Create the circular trade
      const { data: trade, error: tradeError } = await supabase
        .from("circular_trades")
        .insert({
          initiator_id: user.id,
          min_participants: minParticipants,
          max_participants: maxParticipants,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Add initiator as first participant
      const { error: participantError } = await supabase
        .from("circular_trade_participants")
        .insert({
          trade_id: trade.id,
          user_id: user.id,
          product_id: productId,
          position: 1,
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        });

      if (participantError) throw participantError;

      toast({
        title: "Trueke circular creado",
        description: "Otros usuarios pueden unirse ahora.",
      });

      await fetchMyTrades();
      await fetchTrades();
      return { data: trade, error: null };
    } catch (error) {
      console.error("Error creating circular trade:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el trueke circular.",
      });
      return { error };
    }
  };

  const joinCircularTrade = async (tradeId: string, productId: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      // Check if trade is still open
      const { data: trade, error: tradeError } = await supabase
        .from("circular_trades")
        .select(`
          *,
          participants:circular_trade_participants(id)
        `)
        .eq("id", tradeId)
        .single();

      if (tradeError) throw tradeError;

      if (trade.status !== "pending") {
        toast({
          variant: "destructive",
          title: "No disponible",
          description: "Este trueke circular ya no está disponible.",
        });
        return { error: "Trade not available" };
      }

      const currentParticipants = trade.participants?.length || 0;
      if (currentParticipants >= trade.max_participants) {
        toast({
          variant: "destructive",
          title: "Completo",
          description: "Este trueke circular ya está completo.",
        });
        return { error: "Trade full" };
      }

      // Join the trade
      const { error: joinError } = await supabase
        .from("circular_trade_participants")
        .insert({
          trade_id: tradeId,
          user_id: user.id,
          product_id: productId,
          position: currentParticipants + 1,
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        });

      if (joinError) throw joinError;

      // Check if we have enough participants to start
      if (currentParticipants + 1 >= trade.min_participants) {
        await supabase
          .from("circular_trades")
          .update({ status: "in_progress" })
          .eq("id", tradeId);
      }

      toast({
        title: "¡Te uniste!",
        description: "Ahora eres parte del trueke circular.",
      });

      await fetchMyTrades();
      await fetchTrades();
      return { error: null };
    } catch (error) {
      console.error("Error joining circular trade:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo unir al trueke circular.",
      });
      return { error };
    }
  };

  const completeCircularTrade = async (tradeId: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase
        .from("circular_trades")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", tradeId)
        .eq("initiator_id", user.id);

      if (error) throw error;

      toast({
        title: "¡Trueke completado!",
        description: "El trueke circular ha sido completado exitosamente.",
      });

      await fetchMyTrades();
      await fetchTrades();
      return { error: null };
    } catch (error) {
      console.error("Error completing circular trade:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo completar el trueke circular.",
      });
      return { error };
    }
  };

  return {
    trades,
    myTrades,
    loading,
    createCircularTrade,
    joinCircularTrade,
    completeCircularTrade,
    refetch: () => {
      fetchTrades();
      fetchMyTrades();
    },
  };
}
