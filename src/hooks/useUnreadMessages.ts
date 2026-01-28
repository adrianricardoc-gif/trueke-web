import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      subscribeToMessages();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      // Get all matches where user is participant
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (!matches || matches.length === 0) {
        setUnreadCount(0);
        return;
      }

      const matchIds = matches.map(m => m.id);

      // Count unread messages
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("match_id", matchIds)
        .neq("sender_id", user.id)
        .is("read_at", null);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return { unreadCount, refetch: fetchUnreadCount };
}
