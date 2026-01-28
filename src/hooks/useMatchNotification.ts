import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MatchData {
  matchId: string;
  myProduct: {
    title: string;
    image: string;
  };
  theirProduct: {
    title: string;
    image: string;
  };
  otherUser: {
    name: string;
    avatar: string | null;
  };
}

export function useMatchNotification() {
  const { user } = useAuth();
  const [newMatch, setNewMatch] = useState<MatchData | null>(null);

  const clearMatch = useCallback(() => {
    setNewMatch(null);
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("match-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `user1_id=eq.${user.id}`,
        },
        async (payload) => {
          const match = payload.new as {
            id: string;
            user1_id: string;
            user2_id: string;
            product1_id: string;
            product2_id: string;
          };

          try {
            // Fetch products
            const { data: products } = await supabase
              .from("products")
              .select("id, title, images")
              .in("id", [match.product1_id, match.product2_id]);

            const myProduct = products?.find((p) => p.id === match.product1_id);
            const theirProduct = products?.find((p) => p.id === match.product2_id);

            // Fetch other user profile
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("user_id", match.user2_id)
              .maybeSingle();

            if (myProduct && theirProduct) {
              setNewMatch({
                matchId: match.id,
                myProduct: {
                  title: myProduct.title,
                  image: myProduct.images[0] || "/placeholder.svg",
                },
                theirProduct: {
                  title: theirProduct.title,
                  image: theirProduct.images[0] || "/placeholder.svg",
                },
                otherUser: {
                  name: profile?.display_name || "Usuario",
                  avatar: profile?.avatar_url || null,
                },
              });
            }
          } catch (error) {
            console.error("Error fetching match details:", error);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `user2_id=eq.${user.id}`,
        },
        async (payload) => {
          const match = payload.new as {
            id: string;
            user1_id: string;
            user2_id: string;
            product1_id: string;
            product2_id: string;
          };

          try {
            // Fetch products
            const { data: products } = await supabase
              .from("products")
              .select("id, title, images")
              .in("id", [match.product1_id, match.product2_id]);

            const myProduct = products?.find((p) => p.id === match.product2_id);
            const theirProduct = products?.find((p) => p.id === match.product1_id);

            // Fetch other user profile
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("user_id", match.user1_id)
              .maybeSingle();

            if (myProduct && theirProduct) {
              setNewMatch({
                matchId: match.id,
                myProduct: {
                  title: myProduct.title,
                  image: myProduct.images[0] || "/placeholder.svg",
                },
                theirProduct: {
                  title: theirProduct.title,
                  image: theirProduct.images[0] || "/placeholder.svg",
                },
                otherUser: {
                  name: profile?.display_name || "Usuario",
                  avatar: profile?.avatar_url || null,
                },
              });
            }
          } catch (error) {
            console.error("Error fetching match details:", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { newMatch, clearMatch };
}
