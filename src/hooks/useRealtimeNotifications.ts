import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "match" | "message" | "trade_update";
  title: string;
  description: string;
  read: boolean;
  created_at: string;
  data?: {
    matchId?: string;
    productTitle?: string;
  };
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const showNotification = useCallback((notif: Omit<Notification, "id" | "read" | "created_at">) => {
    const newNotif: Notification = {
      ...notif,
      id: crypto.randomUUID(),
      read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    toast({
      title: notif.title,
      description: notif.description,
    });

    // Try browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notif.title, {
        body: notif.description,
        icon: "/favicon.ico",
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new matches
    const matchChannel = supabase
      .channel("realtime-matches")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `user2_id=eq.${user.id}`,
        },
        async (payload) => {
          const match = payload.new as any;
          
          // Fetch product info
          const { data: product } = await supabase
            .from("products")
            .select("title")
            .eq("id", match.product1_id)
            .maybeSingle();

          showNotification({
            type: "match",
            title: "¡Nuevo Match! 🎉",
            description: `Alguien quiere truekear por ${product?.title || "tu producto"}`,
            data: { matchId: match.id, productTitle: product?.title },
          });
        }
      )
      .subscribe();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const message = payload.new as any;
          
          // Only notify if message is not from current user
          if (message.sender_id === user.id) return;

          // Check if this match involves the user
          const { data: match } = await supabase
            .from("matches")
            .select("*")
            .eq("id", message.match_id)
            .maybeSingle();

          if (!match || (match.user1_id !== user.id && match.user2_id !== user.id)) {
            return;
          }

          // Get sender name
          const { data: sender } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", message.sender_id)
            .maybeSingle();

          showNotification({
            type: "message",
            title: `Mensaje de ${sender?.display_name || "Usuario"}`,
            description: message.content.length > 50 
              ? message.content.slice(0, 50) + "..." 
              : message.content,
            data: { matchId: message.match_id },
          });
        }
      )
      .subscribe();

    // Subscribe to trade status updates
    const tradeChannel = supabase
      .channel("realtime-trades")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
        },
        async (payload) => {
          const match = payload.new as any;
          const oldMatch = payload.old as any;

          // Only notify if status changed and user is part of match
          if (
            match.status === oldMatch.status ||
            (match.user1_id !== user.id && match.user2_id !== user.id)
          ) {
            return;
          }

          const statusMessages: Record<string, { title: string; desc: string }> = {
            accepted: { title: "¡Trueke aceptado! 🤝", desc: "Tu propuesta de trueke ha sido aceptada" },
            completed: { title: "¡Trueke completado! ✅", desc: "El trueke se ha marcado como completado" },
            rejected: { title: "Trueke rechazado", desc: "La propuesta de trueke ha sido rechazada" },
            cancelled: { title: "Trueke cancelado", desc: "El trueke ha sido cancelado" },
          };

          const msg = statusMessages[match.status];
          if (msg) {
            showNotification({
              type: "trade_update",
              title: msg.title,
              description: msg.desc,
              data: { matchId: match.id },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(tradeChannel);
    };
  }, [user, showNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
};
