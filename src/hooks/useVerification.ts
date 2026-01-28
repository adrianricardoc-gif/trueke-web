import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface VerificationRequest {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  admin_notes: string | null;
}

export const useVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequest();
    }
  }, [user]);

  const fetchRequest = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setRequest(data as VerificationRequest);
    }
    setLoading(false);
  };

  const uploadFile = async (file: File, type: "document" | "selfie"): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("verification-docs")
      .upload(fileName, file);

    if (error) {
      console.error("Error uploading file:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("verification-docs")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const submitVerification = async (documentFile: File, selfieFile: File) => {
    if (!user) return false;
    setSubmitting(true);

    try {
      // Upload both files
      const [documentUrl, selfieUrl] = await Promise.all([
        uploadFile(documentFile, "document"),
        uploadFile(selfieFile, "selfie"),
      ]);

      if (!documentUrl || !selfieUrl) {
        throw new Error("Error al subir los archivos");
      }

      // Create verification request
      const { error } = await supabase.from("verification_requests").insert({
        user_id: user.id,
        document_url: documentUrl,
        selfie_url: selfieUrl,
      });

      if (error) throw error;

      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de verificación está siendo revisada",
      });

      await fetchRequest();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { request, loading, submitting, submitVerification, refetch: fetchRequest };
};
