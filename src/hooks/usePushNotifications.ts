import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumNotifications } from "./usePremiumNotifications";

export function usePushNotifications() {
  const { user } = useAuth();
  
  // Include premium notifications
  usePremiumNotifications();

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Request permission on mount
    requestPermission();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel("push-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const message = payload.new as {
            id: string;
            match_id: string;
            sender_id: string;
            content: string;
          };

          // Don't notify for own messages
          if (message.sender_id === user.id) return;

          // Check if this match involves the current user
          const { data: match } = await supabase
            .from("matches")
            .select("user1_id, user2_id")
            .eq("id", message.match_id)
            .maybeSingle();

          if (!match) return;

          const isInMatch = match.user1_id === user.id || match.user2_id === user.id;
          if (!isInMatch) return;

          // Get sender's profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", message.sender_id)
            .maybeSingle();

          const senderName = profile?.display_name || "Alguien";

          showNotification(`Nuevo mensaje de ${senderName}`, {
            body: message.content.substring(0, 100),
            tag: `message-${message.id}`,
          });
        }
      )
      .subscribe();

    // Subscribe to new matches
    const matchesChannel = supabase
      .channel("push-matches")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
        },
        async (payload) => {
          const match = payload.new as {
            id: string;
            user1_id: string;
            user2_id: string;
            product1_id: string;
            product2_id: string;
          };

          // Only notify if user is part of this match
          if (match.user1_id !== user.id && match.user2_id !== user.id) return;

          // Get the product that matched
          const productId = match.user1_id === user.id ? match.product2_id : match.product1_id;
          const { data: product } = await supabase
            .from("products")
            .select("title")
            .eq("id", productId)
            .maybeSingle();

          showNotification("¡Nuevo Match! 🎉", {
            body: product ? `Tu producto hizo match con "${product.title}"` : "Tienes un nuevo match",
            tag: `match-${match.id}`,
          });
        }
      )
      .subscribe();

    // Subscribe to match status changes (accepted/rejected)
    const matchStatusChannel = supabase
      .channel("push-match-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
        },
        async (payload) => {
          const match = payload.new as {
            id: string;
            user1_id: string;
            user2_id: string;
            status: string;
          };
          const oldMatch = payload.old as { status: string };

          // Only notify if status changed
          if (match.status === oldMatch.status) return;

          // Only notify the other user (not the one who made the change)
          // We don't know who made the change, so notify both parties
          if (match.user1_id !== user.id && match.user2_id !== user.id) return;

          if (match.status === "accepted") {
            showNotification("¡Propuesta aceptada! ✅", {
              body: "Tu propuesta de trueke ha sido aceptada",
              tag: `match-status-${match.id}`,
            });
          } else if (match.status === "rejected") {
            showNotification("Propuesta rechazada", {
              body: "Tu propuesta de trueke ha sido rechazada",
              tag: `match-status-${match.id}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(matchStatusChannel);
    };
  }, [user, requestPermission, showNotification]);

  return { requestPermission, showNotification };
}
