import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTrukoins } from "./useTrukoins";

interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  uses_count: number;
  max_uses: number | null;
  reward_trukoins: number;
  is_active: boolean;
  created_at: string;
}

interface ReferralUse {
  id: string;
  code_id: string;
  referred_user_id: string;
  referrer_user_id: string;
  trukoins_earned: number;
  created_at: string;
}

export function useReferrals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { earnTrukoins } = useTrukoins();
  const [myCode, setMyCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<ReferralUse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyCode();
      fetchMyReferrals();
    }
  }, [user]);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "TK-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const fetchMyCode = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create referral code if doesn't exist
        const newCode = generateCode();
        const { data: createdCode, error: createError } = await supabase
          .from("referral_codes")
          .insert({
            user_id: user.id,
            code: newCode,
          })
          .select()
          .single();

        if (createError) throw createError;
        setMyCode(createdCode);
      } else {
        setMyCode(data);
      }
    } catch (error) {
      console.error("Error fetching referral code:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReferrals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("referral_uses")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    }
  };

  const applyReferralCode = async (code: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      // Check if user already used a referral code
      const { data: existingUse } = await supabase
        .from("referral_uses")
        .select("id")
        .eq("referred_user_id", user.id)
        .maybeSingle();

      if (existingUse) {
        toast({
          variant: "destructive",
          title: "Código ya usado",
          description: "Ya has usado un código de referido anteriormente.",
        });
        return { error: "Already used referral code" };
      }

      // Find the referral code
      const { data: referralCode, error: codeError } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (codeError) throw codeError;

      if (!referralCode) {
        toast({
          variant: "destructive",
          title: "Código inválido",
          description: "El código de referido no existe o está inactivo.",
        });
        return { error: "Invalid code" };
      }

      if (referralCode.user_id === user.id) {
        toast({
          variant: "destructive",
          title: "Código propio",
          description: "No puedes usar tu propio código de referido.",
        });
        return { error: "Own code" };
      }

      if (referralCode.max_uses && referralCode.uses_count >= referralCode.max_uses) {
        toast({
          variant: "destructive",
          title: "Código agotado",
          description: "Este código ya alcanzó el máximo de usos.",
        });
        return { error: "Max uses reached" };
      }

      // Create referral use record
      const { error: useError } = await supabase
        .from("referral_uses")
        .insert({
          code_id: referralCode.id,
          referred_user_id: user.id,
          referrer_user_id: referralCode.user_id,
          trukoins_earned: referralCode.reward_trukoins,
        });

      if (useError) throw useError;

      // Update uses count
      await supabase
        .from("referral_codes")
        .update({ uses_count: referralCode.uses_count + 1 })
        .eq("id", referralCode.id);

      // Award TrueKoins to both users
      await earnTrukoins(
        referralCode.reward_trukoins,
        "referral",
        "Bonus por usar código de referido"
      );

      toast({
        title: "¡Código aplicado!",
        description: `Has ganado ${referralCode.reward_trukoins} TrueKoins.`,
      });

      return { error: null };
    } catch (error) {
      console.error("Error applying referral code:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo aplicar el código de referido.",
      });
      return { error };
    }
  };

  const copyCodeToClipboard = async () => {
    if (!myCode) return;

    try {
      await navigator.clipboard.writeText(myCode.code);
      toast({
        title: "Código copiado",
        description: "Compártelo con tus amigos para ganar TrueKoins.",
      });
    } catch (error) {
      console.error("Error copying code:", error);
    }
  };

  return {
    myCode,
    referrals,
    loading,
    applyReferralCode,
    copyCodeToClipboard,
    refetch: () => {
      fetchMyCode();
      fetchMyReferrals();
    },
  };
}
