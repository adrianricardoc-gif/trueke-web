import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  id: string;
  user_id: string;
  wishlist_matches: boolean;
  price_drops: boolean;
  new_in_categories: boolean;
  streak_reminders: boolean;
  mission_reminders: boolean;
  tournament_updates: boolean;
  trade_reminders: boolean;
  weekly_digest: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create default preferences
        const { data: newPrefs, error: createError } = await supabase
          .from("notification_preferences")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs);
      } else {
        setPreferences(data);
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (
    updates: Partial<Omit<NotificationPreferences, "id" | "user_id">>
  ) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase
        .from("notification_preferences")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Preferencias actualizadas",
      });

      await fetchPreferences();
      return { error: null };
    } catch (error) {
      console.error("Error updating preferences:", error);
      return { error };
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
