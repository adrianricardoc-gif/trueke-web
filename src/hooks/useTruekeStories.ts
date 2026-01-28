import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TruekeStory {
  id: string;
  user_id: string;
  product_id: string | null;
  media_url: string;
  media_type: string;
  caption: string | null;
  expires_at: string;
  views_count: number;
  created_at: string;
  product?: {
    id: string;
    title: string;
    images: string[];
  };
}

export function useTruekeStories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<TruekeStory[]>([]);
  const [myStories, setMyStories] = useState<TruekeStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
    if (user) {
      fetchMyStories();
    }
  }, [user]);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from("trueke_stories")
        .select(`
          *,
          product:products(id, title, images)
        `)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("trueke_stories")
        .select(`
          *,
          product:products(id, title, images)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyStories(data || []);
    } catch (error) {
      console.error("Error fetching my stories:", error);
    }
  };

  const createStory = async (
    mediaUrl: string,
    productId?: string,
    caption?: string,
    mediaType: string = "image"
  ) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await supabase
        .from("trueke_stories")
        .insert({
          user_id: user.id,
          product_id: productId || null,
          media_url: mediaUrl,
          media_type: mediaType,
          caption: caption || null,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Story publicada",
        description: "Tu story estará visible por 24 horas.",
      });

      await fetchMyStories();
      await fetchStories();
      return { data, error: null };
    } catch (error) {
      console.error("Error creating story:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo publicar la story.",
      });
      return { error };
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase
        .from("trueke_stories")
        .delete()
        .eq("id", storyId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Story eliminada",
      });

      await fetchMyStories();
      await fetchStories();
      return { error: null };
    } catch (error) {
      console.error("Error deleting story:", error);
      return { error };
    }
  };

  const incrementViews = async (storyId: string) => {
    try {
      const story = stories.find((s) => s.id === storyId);
      if (story) {
        await supabase
          .from("trueke_stories")
          .update({ views_count: story.views_count + 1 })
          .eq("id", storyId);
      }
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  // Group stories by user
  const getStoriesByUser = () => {
    const userStories: Record<string, TruekeStory[]> = {};
    stories.forEach((story) => {
      if (!userStories[story.user_id]) {
        userStories[story.user_id] = [];
      }
      userStories[story.user_id].push(story);
    });
    return userStories;
  };

  return {
    stories,
    myStories,
    loading,
    createStory,
    deleteStory,
    incrementViews,
    getStoriesByUser,
    refetch: () => {
      fetchStories();
      fetchMyStories();
    },
  };
}
