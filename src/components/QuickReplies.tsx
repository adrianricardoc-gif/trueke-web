import { useState } from "react";
import { MessageSquare, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface QuickReply {
  id: string;
  text: string;
  category: string;
}

const defaultReplies: QuickReply[] = [
  { id: "1", text: "¡Hola! Gracias por tu interés en nuestros servicios. ¿En qué puedo ayudarte?", category: "greeting" },
  { id: "2", text: "Claro, con gusto te envío más información sobre nuestros precios y disponibilidad.", category: "info" },
  { id: "3", text: "¡Perfecto! Podemos coordinar una cita. ¿Qué día y horario te conviene?", category: "appointment" },
  { id: "4", text: "Gracias por tu preferencia. ¡Esperamos verte pronto!", category: "thanks" },
  { id: "5", text: "Disculpa la demora en responder. ¿Aún estás interesado/a?", category: "followup" },
];

interface QuickRepliesProps {
  onSelectReply: (text: string) => void;
  compact?: boolean;
}

const QuickReplies = ({ onSelectReply, compact = false }: QuickRepliesProps) => {
  const { user } = useAuth();
  const [replies, setReplies] = useState<QuickReply[]>(() => {
    const saved = localStorage.getItem(`quick_replies_${user?.id}`);
    return saved ? JSON.parse(saved) : defaultReplies;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const saveReplies = (newReplies: QuickReply[]) => {
    setReplies(newReplies);
    localStorage.setItem(`quick_replies_${user?.id}`, JSON.stringify(newReplies));
  };

  const handleAddReply = () => {
    if (!newReply.trim()) return;
    
    const reply: QuickReply = {
      id: Date.now().toString(),
      text: newReply.trim(),
      category: "custom",
    };
    
    saveReplies([...replies, reply]);
    setNewReply("");
    toast({ title: "Respuesta agregada", description: "Tu respuesta rápida ha sido guardada." });
  };

  const handleDeleteReply = (id: string) => {
    saveReplies(replies.filter(r => r.id !== id));
    toast({ title: "Respuesta eliminada" });
  };

  const handleEditReply = (id: string) => {
    const reply = replies.find(r => r.id === id);
    if (reply) {
      setEditingId(id);
      setEditText(reply.text);
    }
  };

  const handleSaveEdit = () => {
    if (!editText.trim() || !editingId) return;
    
    saveReplies(replies.map(r => 
      r.id === editingId ? { ...r, text: editText.trim() } : r
    ));
    setEditingId(null);
    setEditText("");
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
        {replies.slice(0, 4).map((reply) => (
          <Button
            key={reply.id}
            variant="outline"
            size="sm"
            className="text-xs h-auto py-1 px-2 max-w-[150px] truncate"
            onClick={() => onSelectReply(reply.text)}
          >
            {reply.text}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setIsEditing(!isEditing)}
        >
          <MessageSquare className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-secondary" />
            Respuestas Rápidas
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Listo" : "Editar"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {replies.map((reply) => (
          <div
            key={reply.id}
            className={`p-3 rounded-lg border transition-all ${
              editingId === reply.id 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50 cursor-pointer"
            }`}
          >
            {editingId === reply.id ? (
              <div className="flex gap-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button size="sm" onClick={handleSaveEdit}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p 
                  className="text-sm text-foreground flex-1"
                  onClick={() => !isEditing && onSelectReply(reply.text)}
                >
                  {reply.text}
                </p>
                {isEditing && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleEditReply(reply.id)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => handleDeleteReply(reply.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {!isEditing && reply.category === "custom" && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Personalizado
                  </Badge>
                )}
              </div>
            )}
          </div>
        ))}

        {isEditing && (
          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Agregar nueva respuesta rápida..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddReply()}
            />
            <Button onClick={handleAddReply} disabled={!newReply.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickReplies;
