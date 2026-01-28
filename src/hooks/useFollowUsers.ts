import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export function useFollowUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFollowing();
      fetchFollowers();
    }
  }, [user]);

  const fetchFollowing = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (error) throw error;
      setFollowing((data || []).map((f) => f.following_id));
    } catch (error) {
      console.error("Error fetching following:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("following_id", user.id);

      if (error) throw error;
      setFollowers((data || []).map((f) => f.follower_id));
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  };

  const followUser = async (userId: string) => {
    if (!user) return { error: "Not authenticated" };
    if (userId === user.id) return { error: "Cannot follow yourself" };

    try {
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: user.id, following_id: userId });

      if (error) throw error;

      setFollowing((prev) => [...prev, userId]);
      toast({
        title: "Siguiendo",
        description: "Ahora sigues a este usuario.",
      });
      return { error: null };
    } catch (error) {
      console.error("Error following user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo seguir al usuario.",
      });
      return { error };
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);

      if (error) throw error;

      setFollowing((prev) => prev.filter((id) => id !== userId));
      toast({
        title: "Dejaste de seguir",
        description: "Ya no sigues a este usuario.",
      });
      return { error: null };
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return { error };
    }
  };

  const isFollowing = (userId: string) => following.includes(userId);

  return {
    following,
    followers,
    followingCount: following.length,
    followersCount: followers.length,
    loading,
    followUser,
    unfollowUser,
    isFollowing,
    refetch: () => {
      fetchFollowing();
      fetchFollowers();
    },
  };
}
