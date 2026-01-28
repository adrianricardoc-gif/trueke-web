import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Star, Loader2, Check } from "lucide-react";

const CATEGORIES = [
  { id: "tech", name: "Tecnología", emoji: "💻" },
  { id: "fashion", name: "Moda", emoji: "👗" },
  { id: "home", name: "Hogar", emoji: "🏠" },
  { id: "sports", name: "Deportes", emoji: "⚽" },
  { id: "vehicles", name: "Vehículos", emoji: "🚗" },
  { id: "books", name: "Libros", emoji: "📚" },
  { id: "services", name: "Servicios", emoji: "🛠️" },
];

interface FavoriteCategoriesManagerProps {
  onCategoriesChange?: (categories: string[]) => void;
}

const FavoriteCategoriesManager = ({ onCategoriesChange }: FavoriteCategoriesManagerProps) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("user_favorite_categories")
      .select("category")
      .eq("user_id", user.id)
      .order("priority", { ascending: true });

    if (!error && data) {
      const cats = data.map(d => d.category);
      setFavorites(cats);
      onCategoriesChange?.(cats);
    }
    setLoading(false);
  };

  const toggleCategory = async (categoryId: string) => {
    if (!user) return;
    
    setSaving(true);
    const isCurrentlyFavorite = favorites.includes(categoryId);

    if (isCurrentlyFavorite) {
      // Remove from favorites
      const { error } = await supabase
        .from("user_favorite_categories")
        .delete()
        .eq("user_id", user.id)
        .eq("category", categoryId);

      if (!error) {
        const newFavorites = favorites.filter(c => c !== categoryId);
        setFavorites(newFavorites);
        onCategoriesChange?.(newFavorites);
      }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from("user_favorite_categories")
        .insert({
          user_id: user.id,
          category: categoryId,
          priority: favorites.length + 1,
        });

      if (!error) {
        const newFavorites = [...favorites, categoryId];
        setFavorites(newFavorites);
        onCategoriesChange?.(newFavorites);
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-foreground">
        <Star className="h-4 w-4 text-trueke-yellow" />
        <span className="text-sm font-medium">Categorías favoritas</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Selecciona tus categorías favoritas para ver esos productos primero
      </p>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((category) => {
          const isFavorite = favorites.includes(category.id);
          return (
            <Button
              key={category.id}
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              className={`justify-start gap-2 h-auto py-2 ${
                isFavorite ? "bg-primary/90" : ""
              }`}
              onClick={() => toggleCategory(category.id)}
              disabled={saving}
            >
              <span>{category.emoji}</span>
              <span className="flex-1 text-left text-xs">{category.name}</span>
              {isFavorite && <Check className="h-3 w-3" />}
            </Button>
          );
        })}
      </div>
      {favorites.length > 0 && (
        <p className="text-xs text-trueke-green text-center">
          {favorites.length} categoría(s) seleccionada(s)
        </p>
      )}
    </div>
  );
};

export default FavoriteCategoriesManager;
