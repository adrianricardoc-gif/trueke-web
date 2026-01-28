import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/hooks/useUserType";
import { useToast } from "@/hooks/use-toast";

export function useServiceInquiryNotifications() {
  const { user } = useAuth();
  const { isCompany } = useUserType();
  const { toast } = useToast();

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
    // Only set up for company users
    if (!user || !isCompany) return;

    // Request permission on mount
    requestPermission();

    // Subscribe to new trade offers (inquiries) for this company user
    const inquiriesChannel = supabase
      .channel(`company-inquiries-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trade_offers",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const offer = payload.new as {
            id: string;
            sender_id: string;
            message: string | null;
            proposed_products: string[];
          };

          // Get sender's profile
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", offer.sender_id)
            .maybeSingle();

          const senderName = senderProfile?.display_name || "Alguien";

          // Get product info if available
          let productTitle = "tu servicio";
          if (offer.proposed_products.length > 0) {
            const { data: product } = await supabase
              .from("products")
              .select("title")
              .eq("id", offer.proposed_products[0])
              .maybeSingle();
            if (product) {
              productTitle = product.title;
            }
          }

          // Show browser notification
          showNotification("¡Nueva consulta de servicio! 📩", {
            body: `${senderName} está interesado en ${productTitle}`,
            tag: `inquiry-${offer.id}`,
          });

          // Show in-app toast
          toast({
            title: "Nueva consulta recibida",
            description: `${senderName} quiere saber más sobre tu servicio`,
          });
        }
      )
      .subscribe();

    // Subscribe to new matches involving company's products
    const matchesChannel = supabase
      .channel(`company-matches-${user.id}`)
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

          // Only notify if company is part of this match
          if (match.user1_id !== user.id && match.user2_id !== user.id) return;

          // Get the other user's product (their interest in our service)
          const otherProductId = match.user1_id === user.id ? match.product1_id : match.product2_id;
          
          const { data: product } = await supabase
            .from("products")
            .select("title")
            .eq("id", otherProductId)
            .maybeSingle();

          showNotification("¡Nuevo match de servicio! 🎉", {
            body: product 
              ? `Alguien quiere intercambiar "${product.title}" por tu servicio` 
              : "Tienes un nuevo match para tu servicio",
            tag: `match-${match.id}`,
          });

          toast({
            title: "¡Nuevo match!",
            description: "Alguien está interesado en tu servicio",
          });
        }
      )
      .subscribe();

    // Subscribe to new messages in matches
    const messagesChannel = supabase
      .channel(`company-messages-${user.id}`)
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

          // Check if this match involves the company user
          const { data: match } = await supabase
            .from("matches")
            .select("user1_id, user2_id")
            .eq("id", message.match_id)
            .maybeSingle();

          if (!match) return;
          if (match.user1_id !== user.id && match.user2_id !== user.id) return;

          // Get sender info
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", message.sender_id)
            .maybeSingle();

          const senderName = profile?.display_name || "Un cliente";

          showNotification(`Mensaje de ${senderName} 💬`, {
            body: message.content.substring(0, 100),
            tag: `message-${message.id}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inquiriesChannel);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, isCompany, requestPermission, showNotification, toast]);

  return { requestPermission, showNotification };
}
