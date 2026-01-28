import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Plus, Loader2, Package, Star, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeaturedProducts } from "@/hooks/useFeaturedProducts";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Product {
  id: string;
  title: string;
  description: string | null;
  estimated_value: number;
  images: string[];
  category: string;
  status: string;
}

const MyProducts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);
  
  const {
    featureProduct,
    unfeatureProduct,
    isProductFeatured,
    canFeatureMore,
    maxFeaturedProducts,
    currentFeaturedCount,
  } = useFeaturedProducts();

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus productos",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (productId: string) => {
    setDeleting(productId);
    
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado correctamente",
      });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
    
    setDeleting(null);
  };

  const handleToggleFeatured = async (productId: string) => {
    setTogglingFeatured(productId);
    
    if (isProductFeatured(productId)) {
      await unfeatureProduct(productId);
    } else {
      await featureProduct(productId);
    }
    
    setTogglingFeatured(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Mis Productos</h1>
          <Button size="icon" variant="ghost" onClick={() => navigate("/new-product")}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Featured products counter */}
        {maxFeaturedProducts > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-trueke-yellow/10 border border-trueke-yellow/30">
            <div className="flex items-center gap-2 text-sm">
              <Crown className="h-4 w-4 text-trueke-yellow" />
              <span>
                Productos destacados: <strong>{currentFeaturedCount}/{maxFeaturedProducts}</strong>
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">No tienes productos publicados</p>
            <p className="text-muted-foreground">¡Publica tu primer producto para comenzar a truekear!</p>
            <Button onClick={() => navigate("/new-product")} className="gap-2">
              <Plus className="h-4 w-4" />
              Publicar Producto
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const isFeatured = isProductFeatured(product.id);
              
              return (
                <Card key={product.id} className={`overflow-hidden ${isFeatured ? "ring-2 ring-trueke-yellow" : ""}`}>
                  <CardContent className="p-0">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 shrink-0 relative">
                        <img
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                        {isFeatured && (
                          <Badge className="absolute -top-1 -right-1 bg-trueke-yellow text-white text-xs px-1 py-0">
                            <Star className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 py-3 pr-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{product.title}</h3>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                            <p className="text-sm font-medium text-primary">
                              ${product.estimated_value.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant={isFeatured ? "default" : "ghost"}
                                    onClick={() => handleToggleFeatured(product.id)}
                                    className={`h-8 w-8 ${isFeatured ? "bg-trueke-yellow hover:bg-trueke-yellow/90" : ""}`}
                                    disabled={togglingFeatured === product.id || (!isFeatured && !canFeatureMore)}
                                  >
                                    {togglingFeatured === product.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Star className={`h-4 w-4 ${isFeatured ? "fill-current" : ""}`} />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isFeatured 
                                    ? "Quitar de destacados"
                                    : canFeatureMore 
                                      ? "Marcar como destacado"
                                      : `Límite alcanzado (${maxFeaturedProducts})`}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => navigate(`/edit-product/${product.id}`)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El producto será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(product.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deleting === product.id}
                                  >
                                    {deleting === product.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Eliminar"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MyProducts;
