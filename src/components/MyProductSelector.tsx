import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Check, Eye, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  title: string;
  images: string[];
  estimated_value: number;
  category: string;
}

interface MyProductSelectorProps {
  selectedProductId: string | null;
  onSelect: (product: Product | null) => void;
  browseOnlyMode: boolean;
  onBrowseOnlyChange: (value: boolean) => void;
}

const MyProductSelector = ({ selectedProductId, onSelect, browseOnlyMode, onBrowseOnlyChange }: MyProductSelectorProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMyProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, title, images, estimated_value, category")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setMyProducts(data || []);
        
        // Auto-select first product if none selected and products exist
        if (!selectedProductId && data && data.length > 0) {
          onSelect(data[0]);
        }
      } catch (error) {
        console.error("Error fetching my products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyProducts();
  }, [user, selectedProductId, onSelect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <Package className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
        <span className="text-xs text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  if (myProducts.length === 0) {
    return (
      <div className="flex items-center justify-center gap-3 py-2">
        <Button 
          onClick={() => navigate("/new-product")}
          size="sm"
          className="h-8 text-xs gradient-brand text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Subir producto
        </Button>
        <Button
          variant={browseOnlyMode ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => onBrowseOnlyChange(!browseOnlyMode)}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Solo miro
        </Button>
      </div>
    );
  }

  return (
    <div className="py-1.5 md:py-2">
      {/* Compact header row */}
      <div className="flex items-center justify-center gap-3 mb-2 md:mb-3">
        <span className="text-xs md:text-sm text-muted-foreground">Ofrezco:</span>
        <button
          onClick={() => {
            onSelect(null);
            onBrowseOnlyChange(!browseOnlyMode);
          }}
          className={cn(
            "flex items-center gap-1 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium transition-all touch-manipulation",
            browseOnlyMode
              ? "bg-primary text-primary-foreground"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          )}
        >
          <Eye className="h-2.5 w-2.5 md:h-3 md:w-3" />
          Solo miro
        </button>
      </div>
      
      {/* Compact horizontal scroll */}
      <div className="flex items-center justify-center gap-2 md:gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {myProducts.slice(0, 5).map((product) => (
          <button
            key={product.id}
            onClick={() => onSelect(selectedProductId === product.id ? null : product)}
            className={cn(
              "relative shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden border-2 transition-all touch-manipulation",
              selectedProductId === product.id 
                ? "border-primary ring-1 ring-primary/30 scale-105" 
                : "border-transparent opacity-70 hover:opacity-100"
            )}
          >
            <img
              src={product.images[0] || "/placeholder.svg"}
              alt={product.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {selectedProductId === product.id && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Check className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
            )}
          </button>
        ))}
        
        {/* Add button - only if less than 5 products */}
        {myProducts.length < 5 && (
          <button
            onClick={() => navigate("/new-product")}
            className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors touch-manipulation"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </button>
        )}
      </div>
      
      {/* Selected product name - subtle */}
      {selectedProductId && (
        <p className="text-[10px] text-center text-muted-foreground mt-1.5 truncate px-4">
          {myProducts.find(p => p.id === selectedProductId)?.title}
        </p>
      )}
    </div>
  );
};

export default MyProductSelector;
