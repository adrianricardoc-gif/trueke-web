import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  is_secret: boolean;
  created_at: string;
  updated_at: string;
}

export function useAdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .order("key");

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from("admin_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);

      if (error) throw error;

      toast({
        title: "Configuración actualizada",
        description: `${key} ha sido actualizado.`,
      });

      await fetchSettings();
      return { error: null };
    } catch (error) {
      console.error("Error updating setting:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la configuración.",
      });
      return { error };
    }
  };

  const createSetting = async (key: string, value: string, description: string, isSecret: boolean = true) => {
    try {
      const { error } = await supabase
        .from("admin_settings")
        .insert({ key, value, description, is_secret: isSecret });

      if (error) throw error;

      toast({
        title: "Configuración creada",
        description: `${key} ha sido creado.`,
      });

      await fetchSettings();
      return { error: null };
    } catch (error) {
      console.error("Error creating setting:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la configuración.",
      });
      return { error };
    }
  };

  const deleteSetting = async (key: string) => {
    try {
      const { error } = await supabase
        .from("admin_settings")
        .delete()
        .eq("key", key);

      if (error) throw error;

      toast({
        title: "Configuración eliminada",
        description: `${key} ha sido eliminado.`,
      });

      await fetchSettings();
      return { error: null };
    } catch (error) {
      console.error("Error deleting setting:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la configuración.",
      });
      return { error };
    }
  };

  return {
    settings,
    loading,
    updateSetting,
    createSetting,
    deleteSetting,
    refetch: fetchSettings,
  };
}
