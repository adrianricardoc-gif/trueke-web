import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface TradeOffer {
  id: string;
  match_id: string | null;
  sender_id: string;
  receiver_id: string;
  proposed_products: string[];
  additional_value_offered: number;
  additional_value_requested: number;
  message: string | null;
  status: string;
  parent_offer_id: string | null;
  created_at: string;
  responded_at: string | null;
}

interface CreateOfferParams {
  matchId?: string;
  receiverId: string;
  proposedProducts: string[];
  additionalValueOffered?: number;
  additionalValueRequested?: number;
  message?: string;
  parentOfferId?: string;
}

export function useTradeOffers(matchId?: string) {
  const { user } = useAuth();
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from("trade_offers")
        .select("*")
        .order("created_at", { ascending: false });

      if (matchId) {
        query = query.eq("match_id", matchId);
      } else {
        query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  }, [user, matchId]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("trade-offers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trade_offers",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOffer = payload.new as TradeOffer;
            if (newOffer.sender_id === user.id || newOffer.receiver_id === user.id) {
              setOffers((prev) => [newOffer, ...prev]);
              if (newOffer.receiver_id === user.id) {
                toast({
                  title: "¡Nueva oferta!",
                  description: "Has recibido una nueva propuesta de trueke.",
                });
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedOffer = payload.new as TradeOffer;
            setOffers((prev) =>
              prev.map((o) => (o.id === updatedOffer.id ? updatedOffer : o))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createOffer = async ({
    matchId: offerMatchId,
    receiverId,
    proposedProducts,
    additionalValueOffered = 0,
    additionalValueRequested = 0,
    message,
    parentOfferId,
  }: CreateOfferParams) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("trade_offers")
        .insert({
          match_id: offerMatchId || null,
          sender_id: user.id,
          receiver_id: receiverId,
          proposed_products: proposedProducts,
          additional_value_offered: additionalValueOffered,
          additional_value_requested: additionalValueRequested,
          message: message || null,
          parent_offer_id: parentOfferId || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "¡Oferta enviada!",
        description: "Tu propuesta ha sido enviada exitosamente.",
      });

      return data;
    } catch (error) {
      console.error("Error creating offer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la oferta.",
      });
      return null;
    }
  };

  const respondToOffer = async (
    offerId: string,
    status: "accepted" | "rejected" | "countered"
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("trade_offers")
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq("id", offerId);

      if (error) throw error;

      const statusMessages = {
        accepted: "Has aceptado la oferta. ¡Felicidades!",
        rejected: "Has rechazado la oferta.",
        countered: "Has enviado una contraoferta.",
      };

      toast({
        title: status === "accepted" ? "¡Trueke confirmado!" : "Oferta actualizada",
        description: statusMessages[status],
      });

      return true;
    } catch (error) {
      console.error("Error responding to offer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar la respuesta.",
      });
      return false;
    }
  };

  const pendingOffers = offers.filter(
    (o) => o.status === "pending" && o.receiver_id === user?.id
  );

  return {
    offers,
    pendingOffers,
    loading,
    createOffer,
    respondToOffer,
    refetch: fetchOffers,
  };
}
