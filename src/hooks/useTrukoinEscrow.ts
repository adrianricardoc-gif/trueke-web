import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTrukoins } from "@/hooks/useTrukoins";

interface TrukoinEscrow {
  id: string;
  match_id: string | null;
  payer_id: string;
  receiver_id: string;
  amount: number;
  status: string;
  released_at: string | null;
  dispute_reason: string | null;
  created_at: string;
}

export function useTrukoinEscrow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { spendTrukoins, earnTrukoins } = useTrukoins();
  const [escrows, setEscrows] = useState<TrukoinEscrow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEscrows();
    }
  }, [user]);

  const fetchEscrows = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("trukoin_escrow")
        .select("*")
        .or(`payer_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEscrows(data || []);
    } catch (error) {
      console.error("Error fetching escrows:", error);
    } finally {
      setLoading(false);
    }
  };

  const createEscrow = async (
    matchId: string,
    receiverId: string,
    amount: number
  ) => {
    if (!user) return { error: "Not authenticated" };

    try {
      // First spend the trukoins
      const { error: spendError } = await spendTrukoins(
        amount,
        "Escrow para trueke",
        matchId
      );

      if (spendError) return { error: spendError };

      // Create escrow record
      const { error } = await supabase.from("trukoin_escrow").insert({
        match_id: matchId,
        payer_id: user.id,
        receiver_id: receiverId,
        amount,
        status: "held",
      });

      if (error) throw error;

      toast({
        title: "Escrow creado",
        description: `${amount} TrueKoins retenidos hasta confirmar el trueke`,
      });

      await fetchEscrows();
      return { error: null };
    } catch (error) {
      console.error("Error creating escrow:", error);
      return { error };
    }
  };

  const releaseEscrow = async (escrowId: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const escrow = escrows.find((e) => e.id === escrowId);
      if (!escrow) return { error: "Escrow not found" };

      // Update escrow status
      const { error: updateError } = await supabase
        .from("trukoin_escrow")
        .update({
          status: "released",
          released_at: new Date().toISOString(),
        })
        .eq("id", escrowId);

      if (updateError) throw updateError;

      // Award trukoins to receiver
      await earnTrukoins(
        escrow.amount,
        "escrow_release",
        "TrueKoins liberados de escrow",
        escrowId
      );

      toast({
        title: "Escrow liberado",
        description: `${escrow.amount} TrueKoins transferidos`,
      });

      await fetchEscrows();
      return { error: null };
    } catch (error) {
      console.error("Error releasing escrow:", error);
      return { error };
    }
  };

  const disputeEscrow = async (escrowId: string, reason: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase
        .from("trukoin_escrow")
        .update({
          status: "disputed",
          dispute_reason: reason,
        })
        .eq("id", escrowId);

      if (error) throw error;

      toast({
        variant: "destructive",
        title: "Disputa abierta",
        description: "Un administrador revisará el caso",
      });

      await fetchEscrows();
      return { error: null };
    } catch (error) {
      console.error("Error disputing escrow:", error);
      return { error };
    }
  };

  return {
    escrows,
    loading,
    createEscrow,
    releaseEscrow,
    disputeEscrow,
    refetch: fetchEscrows,
  };
}
