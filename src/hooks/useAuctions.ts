import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface Auction {
  id: string;
  product_id: string;
  seller_id: string;
  starting_price: number;
  current_price: number;
  min_increment: number;
  ends_at: string;
  status: string;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    title: string;
    images: string[];
    description: string;
  };
  bids_count?: number;
}

interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  is_winning: boolean;
  created_at: string;
}

export function useAuctions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isEnabled } = useFeatureFlags();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  const auctionsEnabled = isEnabled('trading_auctions');

  useEffect(() => {
    if (auctionsEnabled) {
      fetchAuctions();
      if (user) {
        fetchMyAuctions();
      }
    } else {
      setLoading(false);
    }
  }, [user, auctionsEnabled]);

  const fetchAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from("auctions")
        .select(`
          *,
          product:products(id, title, images, description)
        `)
        .eq("status", "active")
        .gt("ends_at", new Date().toISOString())
        .order("ends_at", { ascending: true });

      if (error) throw error;
      setAuctions(data || []);
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAuctions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("auctions")
        .select(`
          *,
          product:products(id, title, images, description)
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyAuctions(data || []);
    } catch (error) {
      console.error("Error fetching my auctions:", error);
    }
  };

  const createAuction = async (
    productId: string,
    startingPrice: number,
    minIncrement: number,
    durationHours: number
  ) => {
    if (!user || !auctionsEnabled) return { error: "Not authenticated or disabled" };

    try {
      const endsAt = new Date();
      endsAt.setHours(endsAt.getHours() + durationHours);

      const { data, error } = await supabase
        .from("auctions")
        .insert({
          product_id: productId,
          seller_id: user.id,
          starting_price: startingPrice,
          current_price: startingPrice,
          min_increment: minIncrement,
          ends_at: endsAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Subasta creada",
        description: `Tu subasta terminará en ${durationHours} horas.`,
      });

      await fetchMyAuctions();
      await fetchAuctions();
      return { data, error: null };
    } catch (error) {
      console.error("Error creating auction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la subasta.",
      });
      return { error };
    }
  };

  const placeBid = async (auctionId: string, amount: number) => {
    if (!user) return { error: "Not authenticated" };

    try {
      // Get current auction state
      const { data: auction, error: auctionError } = await supabase
        .from("auctions")
        .select("*")
        .eq("id", auctionId)
        .single();

      if (auctionError) throw auctionError;

      if (auction.seller_id === user.id) {
        toast({
          variant: "destructive",
          title: "No permitido",
          description: "No puedes ofertar en tu propia subasta.",
        });
        return { error: "Own auction" };
      }

      if (new Date(auction.ends_at) < new Date()) {
        toast({
          variant: "destructive",
          title: "Subasta terminada",
          description: "Esta subasta ya ha finalizado.",
        });
        return { error: "Auction ended" };
      }

      const minBid = auction.current_price + auction.min_increment;
      if (amount < minBid) {
        toast({
          variant: "destructive",
          title: "Oferta muy baja",
          description: `La oferta mínima es $${minBid.toFixed(2)}.`,
        });
        return { error: "Bid too low" };
      }

      // Mark all previous bids as not winning
      await supabase
        .from("auction_bids")
        .update({ is_winning: false })
        .eq("auction_id", auctionId);

      // Insert new bid
      const { error: bidError } = await supabase
        .from("auction_bids")
        .insert({
          auction_id: auctionId,
          bidder_id: user.id,
          amount,
          is_winning: true,
        });

      if (bidError) throw bidError;

      // Update auction current price
      await supabase
        .from("auctions")
        .update({ current_price: amount })
        .eq("id", auctionId);

      toast({
        title: "¡Oferta realizada!",
        description: `Tu oferta de $${amount.toFixed(2)} ha sido registrada.`,
      });

      await fetchAuctions();
      return { error: null };
    } catch (error) {
      console.error("Error placing bid:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo realizar la oferta.",
      });
      return { error };
    }
  };

  const getAuctionBids = async (auctionId: string) => {
    try {
      const { data, error } = await supabase
        .from("auction_bids")
        .select("*")
        .eq("auction_id", auctionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Error fetching bids:", error);
      return { data: [], error };
    }
  };

  const cancelAuction = async (auctionId: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase
        .from("auctions")
        .update({ status: "cancelled" })
        .eq("id", auctionId)
        .eq("seller_id", user.id);

      if (error) throw error;

      toast({
        title: "Subasta cancelada",
        description: "Tu subasta ha sido cancelada.",
      });

      await fetchMyAuctions();
      await fetchAuctions();
      return { error: null };
    } catch (error) {
      console.error("Error cancelling auction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar la subasta.",
      });
      return { error };
    }
  };

  return {
    auctions,
    myAuctions,
    loading,
    auctionsEnabled,
    createAuction,
    placeBid,
    getAuctionBids,
    cancelAuction,
    refetch: () => {
      fetchAuctions();
      fetchMyAuctions();
    },
  };
}
