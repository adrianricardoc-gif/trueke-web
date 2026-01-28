import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, Image, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface OtherUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const Chat = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);

  useEffect(() => {
    if (user && matchId) {
      fetchChatData();
      fetchMyProducts();
      const unsubMessages = subscribeToMessages();
      const unsubTyping = subscribeToTyping();
      
      return () => {
        unsubMessages?.();
        unsubTyping?.();
      };
    }
  }, [user, matchId]);

  const fetchMyProducts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("products")
      .select("id, title, images, estimated_value")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(10);
    setMyProducts(data || []);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatData = async () => {
    if (!user || !matchId) return;

    try {
      // Fetch match to get other user
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();

      if (matchError || !match) {
        navigate("/messages");
        return;
      }

      const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

      // Fetch other user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .eq("user_id", otherUserId)
        .maybeSingle();

      setOtherUser(profile);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      setMessages(messagesData || []);

      // Mark unread messages as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("match_id", matchId)
        .neq("sender_id", user.id)
        .is("read_at", null);
    } catch (error) {
      console.error("Error fetching chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read if from other user
          if (newMsg.sender_id !== user?.id) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToTyping = () => {
    const channel = supabase
      .channel(`typing-${matchId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.user_id !== user?.id) {
          setOtherUserTyping(true);
          
          // Clear typing after 3 seconds
          setTimeout(() => {
            setOtherUserTyping(false);
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const broadcastTyping = () => {
    if (!matchId || !user) return;

    supabase.channel(`typing-${matchId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user.id },
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Broadcast typing status
    if (!isTyping) {
      setIsTyping(true);
      broadcastTyping();
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !matchId || sending) return;

    setSending(true);
    setIsTyping(false);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      const { error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: user.id,
        content,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !matchId) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Solo puedes enviar imágenes", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "La imagen es muy grande (máx 5MB)", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      // Send image as message
      await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: user.id,
        content: `[IMAGE]${urlData.publicUrl}[/IMAGE]`,
      });

      toast({ title: "Imagen enviada" });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "Error", description: "No se pudo enviar la imagen", variant: "destructive" });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const shareProduct = async (product: any) => {
    if (!user || !matchId) return;

    try {
      await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: user.id,
        content: `[PRODUCT]${JSON.stringify({
          id: product.id,
          title: product.title,
          image: product.images?.[0] || "/placeholder.svg",
          value: product.estimated_value,
        })}[/PRODUCT]`,
      });
      
      setShowProductPicker(false);
      toast({ title: "Producto compartido" });
    } catch (error) {
      console.error("Error sharing product:", error);
    }
  };

  const renderMessageContent = (content: string) => {
    // Check for image
    const imageMatch = content.match(/\[IMAGE\](.*?)\[\/IMAGE\]/);
    if (imageMatch) {
      return (
        <img 
          src={imageMatch[1]} 
          alt="Imagen" 
          className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setPreviewImage(imageMatch[1])}
        />
      );
    }

    // Check for product
    const productMatch = content.match(/\[PRODUCT\](.*?)\[\/PRODUCT\]/);
    if (productMatch) {
      try {
        const product = JSON.parse(productMatch[1]);
        return (
          <div className="bg-card border rounded-xl p-3 min-w-[180px]">
            <img 
              src={product.image} 
              alt={product.title}
              className="w-full h-24 object-cover rounded-lg mb-2"
            />
            <p className="font-medium text-sm truncate">{product.title}</p>
            <p className="text-primary font-bold text-sm">${product.value?.toLocaleString()}</p>
          </div>
        );
      } catch {
        return <p className="break-words">{content}</p>;
      }
    }

    return <p className="break-words">{content}</p>;
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Hoy";
    if (isYesterday(date)) return "Ayer";
    return format(date, "d 'de' MMMM", { locale: es });
  };

  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), "HH:mm");
  };

  const groupMessagesByDate = () => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    messages.forEach((msg) => {
      const msgDate = formatMessageDate(msg.created_at);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/messages")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {otherUser?.display_name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">
              {otherUser?.display_name || "Usuario"}
            </h1>
            {otherUserTyping && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-primary"
              >
                escribiendo...
              </motion.p>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              ¡Envía el primer mensaje para iniciar la conversación!
            </p>
          </div>
        ) : (
          groupMessagesByDate().map((group) => (
            <div key={group.date} className="space-y-3">
              <div className="flex justify-center">
                <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                  {group.date}
                </span>
              </div>
              <AnimatePresence>
                {group.messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={cn("flex", isMe ? "justify-end" : "justify-start")}
                    >
                        <div
                          className={cn(
                            "max-w-[80%] px-4 py-2 rounded-2xl",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          )}
                        >
                          {renderMessageContent(msg.content)}
                        <p
                          className={cn(
                            "text-[10px] mt-1",
                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {formatMessageTime(msg.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        <AnimatePresence>
          {otherUserTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start"
            >
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-full rounded-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Picker */}
      <AnimatePresence>
        {showProductPicker && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-40 bg-background border-t rounded-t-3xl p-4 max-h-[60vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Compartir producto</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowProductPicker(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {myProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => shareProduct(product)}
                  className="bg-card border rounded-xl p-3 text-left hover:border-primary transition-colors"
                >
                  <img 
                    src={product.images?.[0] || "/placeholder.svg"} 
                    alt={product.title}
                    className="w-full h-20 object-cover rounded-lg mb-2"
                  />
                  <p className="font-medium text-sm truncate">{product.title}</p>
                  <p className="text-primary font-bold text-xs">${product.estimated_value?.toLocaleString()}</p>
                </button>
              ))}
            </div>
            {myProducts.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No tienes productos para compartir</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <form onSubmit={sendMessage} className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Image className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setShowProductPicker(true)}
          >
            <Package className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Escribe un mensaje..."
            className="flex-1 h-10 rounded-full px-4"
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
