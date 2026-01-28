import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  product1_id: string;
  product2_id: string;
  status: string;
  created_at: string;
  otherUser?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount?: number;
}

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMatches();
      subscribeToMessages();
    }
  }, [user]);

  const fetchMatches = async () => {
    if (!user) return;

    try {
      // Fetch matches where user is involved
      const { data: matchesData, error } = await supabase
        .from("matches")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      if (!matchesData || matchesData.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Get other user IDs
      const otherUserIds = matchesData.map((m) =>
        m.user1_id === user.id ? m.user2_id : m.user1_id
      );

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", otherUserIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      // Fetch last messages for each match
      const matchIds = matchesData.map((m) => m.id);
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .in("match_id", matchIds)
        .order("created_at", { ascending: false });

      // Group messages by match and get last one
      const lastMessageMap = new Map<string, any>();
      const unreadCountMap = new Map<string, number>();
      
      messagesData?.forEach((msg) => {
        if (!lastMessageMap.has(msg.match_id)) {
          lastMessageMap.set(msg.match_id, msg);
        }
        if (msg.sender_id !== user.id && !msg.read_at) {
          unreadCountMap.set(
            msg.match_id,
            (unreadCountMap.get(msg.match_id) || 0) + 1
          );
        }
      });

      const enrichedMatches = matchesData.map((match) => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        return {
          ...match,
          otherUser: profileMap.get(otherUserId),
          lastMessage: lastMessageMap.get(match.id),
          unreadCount: unreadCountMap.get(match.id) || 0,
        };
      });

      // Sort by last message or match creation
      enrichedMatches.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at;
        const bTime = b.lastMessage?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setMatches(enrichedMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Mensajes</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="divide-y">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Sin conversaciones</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Cuando hagas match con alguien, podrás chatear aquí
            </p>
          </div>
        ) : (
          matches.map((match) => (
            <button
              key={match.id}
              onClick={() => navigate(`/chat/${match.id}`)}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="relative">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={match.otherUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {match.otherUser?.display_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {match.unreadCount && match.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    {match.unreadCount}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold truncate">
                    {match.otherUser?.display_name || "Usuario"}
                  </h3>
                  {match.lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(match.lastMessage.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {match.lastMessage ? (
                    <>
                      {match.lastMessage.sender_id === user?.id && "Tú: "}
                      {match.lastMessage.content}
                    </>
                  ) : (
                    "¡Nuevo match! Envía un mensaje"
                  )}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Messages;
