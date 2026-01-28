import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "./useAdminRole";
import { toast } from "@/hooks/use-toast";

interface VerificationRequest {
  id: string;
  user_id: string;
  document_url: string;
  selfie_url: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
}

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_product_id: string | null;
  report_type: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
}

export const useAdminData = () => {
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin && !roleLoading) {
      fetchVerificationRequests();
      fetchReports();
    }
  }, [isAdmin, roleLoading]);

  const fetchVerificationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("verification_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVerificationRequests(data || []);
    } catch (error) {
      console.error("Error fetching verification requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const updateVerificationStatus = async (
    id: string,
    status: "approved" | "rejected",
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from("verification_requests")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null,
        })
        .eq("id", id);

      if (error) throw error;

      // If approved, update user's verified status
      if (status === "approved") {
        const request = verificationRequests.find((r) => r.id === id);
        if (request) {
          await supabase
            .from("profiles")
            .update({
              is_verified: true,
              verified_at: new Date().toISOString(),
            })
            .eq("user_id", request.user_id);
        }
      }

      toast({
        title: status === "approved" ? "Verificación aprobada" : "Verificación rechazada",
        description: "El estado ha sido actualizado",
      });

      fetchVerificationRequests();
    } catch (error) {
      console.error("Error updating verification:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const updateReportStatus = async (id: string, status: "reviewed" | "resolved" | "dismissed") => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Reporte actualizado",
        description: `Estado cambiado a ${status}`,
      });

      fetchReports();
    } catch (error) {
      console.error("Error updating report:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el reporte",
        variant: "destructive",
      });
    }
  };

  return {
    isAdmin,
    verificationRequests,
    reports,
    loading: loading || roleLoading,
    updateVerificationStatus,
    updateReportStatus,
    refetch: () => {
      fetchVerificationRequests();
      fetchReports();
    },
  };
};
