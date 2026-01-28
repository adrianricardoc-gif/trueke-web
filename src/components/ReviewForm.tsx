import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  reviewedUserId: string;
  reviewedUserName: string;
  onReviewSubmitted: () => void;
}

const ReviewForm = ({
  isOpen,
  onClose,
  matchId,
  reviewedUserId,
  reviewedUserName,
  onReviewSubmitted,
}: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || rating === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor selecciona una calificación",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").insert({
        match_id: matchId,
        reviewer_id: user.id,
        reviewed_id: reviewedUserId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "¡Reseña enviada!",
        description: "Gracias por tu valoración",
      });

      onReviewSubmitted();
      onClose();
      setRating(0);
      setComment("");
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar la reseña",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Valorar a {reviewedUserName}</DialogTitle>
          <DialogDescription>
            ¿Cómo fue tu experiencia con este trueke?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Calificación</Label>
            <div className="flex gap-1 justify-center py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentario (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Cuéntanos sobre tu experiencia..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-brand"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar reseña"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewForm;
