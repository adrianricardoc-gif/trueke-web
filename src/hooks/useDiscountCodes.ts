import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  current_uses: number;
  applicable_plans: string[] | null;
  min_plan_price: number | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export function useDiscountCodes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error("Error fetching discount codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateCode = async (code: string, planId: string, planPrice: number) => {
    try {
      const { data: codeData, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!codeData) {
        return { valid: false, error: "Código no válido o expirado" };
      }

      // Check if code is still valid
      if (codeData.valid_until && new Date(codeData.valid_until) < new Date()) {
        return { valid: false, error: "El código ha expirado" };
      }

      // Check max uses
      if (codeData.max_uses && codeData.current_uses >= codeData.max_uses) {
        return { valid: false, error: "El código ha alcanzado el límite de usos" };
      }

      // Check minimum plan price
      if (codeData.min_plan_price && planPrice < codeData.min_plan_price) {
        return { valid: false, error: `Este código requiere un plan de al menos $${codeData.min_plan_price}` };
      }

      // Check applicable plans
      if (codeData.applicable_plans && codeData.applicable_plans.length > 0) {
        if (!codeData.applicable_plans.includes(planId)) {
          return { valid: false, error: "Este código no aplica para el plan seleccionado" };
        }
      }

      // Check if user already used this code
      if (user) {
        const { data: existingUse } = await supabase
          .from("discount_code_uses")
          .select("id")
          .eq("code_id", codeData.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingUse) {
          return { valid: false, error: "Ya has usado este código" };
        }
      }

      // Calculate discount
      let discountAmount: number;
      if (codeData.discount_type === "percentage") {
        discountAmount = (planPrice * codeData.discount_value) / 100;
      } else {
        discountAmount = Math.min(codeData.discount_value, planPrice);
      }

      return {
        valid: true,
        code: codeData,
        discountAmount,
        finalPrice: Math.max(0, planPrice - discountAmount),
      };
    } catch (error) {
      console.error("Error validating code:", error);
      return { valid: false, error: "Error al validar el código" };
    }
  };

  const recordUsage = async (codeId: string, discountAmount: number, subscriptionId?: string) => {
    if (!user) return { error: new Error("No user") };

    try {
      // Record code use
      const { error: useError } = await supabase
        .from("discount_code_uses")
        .insert({
          code_id: codeId,
          user_id: user.id,
          subscription_id: subscriptionId || null,
          discount_applied: discountAmount,
        });

      if (useError) throw useError;

      // Increment usage count
      const currentCode = codes.find(c => c.id === codeId);
      if (currentCode) {
        await supabase
          .from("discount_codes")
          .update({ current_uses: currentCode.current_uses + 1 })
          .eq("id", codeId);
      }

      return { error: null };
    } catch (error) {
      console.error("Error recording code usage:", error);
      return { error };
    }
  };

  const applyCode = async (codeId: string, subscriptionId: string, discountAmount: number) => {
    if (!user) return { error: new Error("No user") };

    try {
      // Record code use
      const { error: useError } = await supabase
        .from("discount_code_uses")
        .insert({
          code_id: codeId,
          user_id: user.id,
          subscription_id: subscriptionId,
          discount_applied: discountAmount,
        });

      if (useError) throw useError;

      // Increment usage count
      const { error: updateError } = await supabase
        .from("discount_codes")
        .update({ current_uses: codes.find(c => c.id === codeId)!.current_uses + 1 })
        .eq("id", codeId);

      if (updateError) throw updateError;

      toast({
        title: "Código aplicado",
        description: `Has ahorrado $${discountAmount.toFixed(2)}`,
      });

      return { error: null };
    } catch (error) {
      console.error("Error applying code:", error);
      return { error };
    }
  };

  const createCode = async (codeData: Partial<DiscountCode>) => {
    try {
      const { error } = await supabase
        .from("discount_codes")
        .insert({
          code: codeData.code?.toUpperCase(),
          description: codeData.description,
          discount_type: codeData.discount_type || "percentage",
          discount_value: codeData.discount_value || 0,
          applicable_plans: codeData.applicable_plans || [],
          max_uses: codeData.max_uses,
          valid_from: codeData.valid_from || new Date().toISOString(),
          valid_until: codeData.valid_until,
          min_plan_price: codeData.min_plan_price || 0,
          is_active: codeData.is_active !== false,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Código creado",
        description: `Código ${codeData.code} creado exitosamente`,
      });

      await fetchCodes();
      return { error: null };
    } catch (error) {
      console.error("Error creating code:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el código",
      });
      return { error };
    }
  };

  const updateCode = async (codeId: string, updates: Partial<DiscountCode>) => {
    try {
      const { error } = await supabase
        .from("discount_codes")
        .update(updates)
        .eq("id", codeId);

      if (error) throw error;

      toast({
        title: "Código actualizado",
      });

      await fetchCodes();
      return { error: null };
    } catch (error) {
      console.error("Error updating code:", error);
      return { error };
    }
  };

  const deleteCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from("discount_codes")
        .update({ is_active: false })
        .eq("id", codeId);

      if (error) throw error;

      toast({
        title: "Código desactivado",
      });

      await fetchCodes();
      return { error: null };
    } catch (error) {
      console.error("Error deleting code:", error);
      return { error };
    }
  };

  return {
    codes,
    loading,
    validateCode,
    applyCode,
    recordUsage,
    createCode,
    updateCode,
    deleteCode,
    refetch: fetchCodes,
  };
}
