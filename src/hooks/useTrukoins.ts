import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TrukoinWallet {
  id: string;
  user_id: string;
  balance: number;
  lifetime_earned: number;
  created_at: string;
  updated_at: string;
}

interface TrukoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export function useTrukoins() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<TrukoinWallet | null>(null);
  const [transactions, setTransactions] = useState<TrukoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchTransactions();
    }
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("trukoin_wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create wallet if doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from("trukoin_wallets")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        setWallet(newWallet);
      } else {
        setWallet(data);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("trukoin_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const earnTrukoins = async (
    amount: number,
    transactionType: string,
    description: string,
    referenceId?: string
  ) => {
    if (!user || !wallet) return { error: "No wallet found" };

    try {
      // Insert transaction
      const { error: txError } = await supabase
        .from("trukoin_transactions")
        .insert({
          user_id: user.id,
          amount,
          transaction_type: transactionType,
          description,
          reference_id: referenceId || null,
        });

      if (txError) throw txError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from("trukoin_wallets")
        .update({
          balance: wallet.balance + amount,
          lifetime_earned: wallet.lifetime_earned + amount,
        })
        .eq("user_id", user.id);

      if (walletError) throw walletError;

      toast({
        title: `+${amount} TrueKoins!`,
        description,
      });

      await fetchWallet();
      await fetchTransactions();
      return { error: null };
    } catch (error) {
      console.error("Error earning trukoins:", error);
      return { error };
    }
  };

  const spendTrukoins = async (
    amount: number,
    description: string,
    referenceId?: string
  ) => {
    if (!user || !wallet) return { error: "No wallet found" };
    if (wallet.balance < amount) {
      toast({
        variant: "destructive",
        title: "Saldo insuficiente",
        description: `Necesitas ${amount} TrueKoins pero solo tienes ${wallet.balance}.`,
      });
      return { error: "Insufficient balance" };
    }

    try {
      // Insert transaction (negative amount)
      const { error: txError } = await supabase
        .from("trukoin_transactions")
        .insert({
          user_id: user.id,
          amount: -amount,
          transaction_type: "spend",
          description,
          reference_id: referenceId || null,
        });

      if (txError) throw txError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from("trukoin_wallets")
        .update({
          balance: wallet.balance - amount,
        })
        .eq("user_id", user.id);

      if (walletError) throw walletError;

      toast({
        title: `Gastaste ${amount} TrueKoins`,
        description,
      });

      await fetchWallet();
      await fetchTransactions();
      return { error: null };
    } catch (error) {
      console.error("Error spending trukoins:", error);
      return { error };
    }
  };

  return {
    wallet,
    transactions,
    loading,
    earnTrukoins,
    spendTrukoins,
    refetch: () => {
      fetchWallet();
      fetchTransactions();
    },
  };
}
