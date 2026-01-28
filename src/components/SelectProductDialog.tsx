import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Check, Loader2, Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  title: string;
  images: string[];
  estimated_value: number;
  category: string;
}

interface SelectProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (product: Product) => void;
  title?: string;
  description?: string;
}

export const SelectProductDialog = ({ 
  open, 
  onOpenChange, 
  onSelect,
  title = "Selecciona tu producto",
  description = "Elige qué producto quieres ofrecer a cambio para poder hacer match"
}: SelectProductDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchMyProducts();
    }
  }, [open, user]);

  const fetchMyProducts = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("products")
      .select("id, title, images, estimated_value, category")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setMyProducts(data);
    }
    setLoading(false);
  };

  const handleSelect = (product: Product) => {
    onSelect(product);
    onOpenChange(false);
  };

  const handleCreateProduct = () => {
    onOpenChange(false);
    navigate("/new-product");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : myProducts.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">No tienes productos</p>
              <p className="text-sm text-muted-foreground">
                Publica un producto para poder hacer truekes
              </p>
            </div>
            <Button onClick={handleCreateProduct} className="gradient-brand">
              <Plus className="h-4 w-4 mr-2" />
              Publicar producto
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] -mx-6 px-6">
            <div className="space-y-2 pb-4">
              {myProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <img
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.title}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{product.title}</p>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                    <p className="text-sm font-semibold text-trueke-green">
                      ${product.estimated_value}
                    </p>
                  </div>
                  <Check className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleCreateProduct} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectProductDialog;
