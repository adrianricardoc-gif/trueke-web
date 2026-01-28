import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type ReportReason = "spam" | "inappropriate" | "fake" | "offensive" | "scam" | "other";
export type ReportType = "product" | "user";

interface CreateReportParams {
  reportType: ReportType;
  productId?: string;
  userId?: string;
  reason: ReportReason;
  description?: string;
}

export const useReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createReport = async (params: CreateReportParams) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para reportar",
      });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        report_type: params.reportType,
        reported_product_id: params.productId || null,
        reported_user_id: params.userId || null,
        reason: params.reason,
        description: params.description || null,
      });

      if (error) throw error;

      toast({
        title: "Reporte enviado",
        description: "Gracias por ayudarnos a mantener la comunidad segura",
      });
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al enviar reporte",
        description: error.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { createReport, loading };
};
