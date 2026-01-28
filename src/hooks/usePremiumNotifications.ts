import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function usePremiumNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();

  const showBrowserNotification = useCallback((title: string, body: string, tag: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag,
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Subscribe to featured products changes
    const featuredChannel = supabase
      .channel("premium-featured-products")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "featured_products",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const featured = payload.new as {
            id: string;
            product_id: string;
            user_id: string;
          };

          // Get product title
          const { data: product } = await supabase
            .from("products")
            .select("title")
            .eq("id", featured.product_id)
            .maybeSingle();

          const productName = product?.title || "Tu producto";

          toast({
            title: "⭐ ¡Producto Destacado!",
            description: `"${productName}" ahora aparece con mayor visibilidad`,
          });

          showBrowserNotification(
            "⭐ Producto Destacado",
            `"${productName}" ahora aparece con mayor visibilidad`,
            `featured-${featured.id}`
          );
        }
      )
      .subscribe();

    // Subscribe to discount code uses
    const discountChannel = supabase
      .channel("premium-discount-codes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "discount_code_uses",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const usage = payload.new as {
            id: string;
            code_id: string;
            discount_applied: number;
          };

          // Get discount code info
          const { data: code } = await supabase
            .from("discount_codes")
            .select("code, description")
            .eq("id", usage.code_id)
            .maybeSingle();

          const codeName = code?.code || "código";
          const discount = usage.discount_applied;

          toast({
            title: "🎉 ¡Descuento Aplicado!",
            description: `Código "${codeName}" aplicado. Ahorraste $${discount.toFixed(2)}`,
          });

          showBrowserNotification(
            "🎉 Descuento Aplicado",
            `Código "${codeName}" aplicado. Ahorraste $${discount.toFixed(2)}`,
            `discount-${usage.id}`
          );
        }
      )
      .subscribe();

    // Subscribe to subscription changes
    const subscriptionChannel = supabase
      .channel("premium-subscriptions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const subscription = payload.new as {
            id: string;
            plan_id: string;
            status: string;
          };
          const oldSubscription = payload.old as { status?: string } | null;

          // Only notify on status changes
          if (oldSubscription?.status === subscription.status) return;

          // Get plan info
          const { data: plan } = await supabase
            .from("premium_plans")
            .select("name, price")
            .eq("id", subscription.plan_id)
            .maybeSingle();

          if (subscription.status === "active") {
            const planName = plan?.name || "Premium";
            
            toast({
              title: "👑 ¡Plan Activado!",
              description: `Tu plan ${planName} está ahora activo`,
            });

            showBrowserNotification(
              "👑 Plan Premium Activado",
              `Tu plan ${planName} está ahora activo`,
              `subscription-${subscription.id}`
            );
          } else if (subscription.status === "cancelled") {
            toast({
              title: "Suscripción Cancelada",
              description: "Tu suscripción premium ha sido cancelada",
            });
          } else if (subscription.status === "expired") {
            toast({
              variant: "destructive",
              title: "⚠️ Suscripción Expirada",
              description: "Tu plan premium ha expirado. ¡Renueva para seguir disfrutando!",
            });

            showBrowserNotification(
              "⚠️ Suscripción Expirada",
              "Tu plan premium ha expirado. ¡Renueva para seguir disfrutando!",
              `subscription-expired-${subscription.id}`
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(featuredChannel);
      supabase.removeChannel(discountChannel);
      supabase.removeChannel(subscriptionChannel);
    };
  }, [user, toast, showBrowserNotification]);
}
