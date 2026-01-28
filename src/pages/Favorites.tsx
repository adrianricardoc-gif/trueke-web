import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Loader2, Package, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

interface Product {
  id: string;
  title: string;
  description: string | null;
  estimated_value: number;
  images: string[];
  category: string;
  location: string | null;
  product_type: string;
}

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFavoriteProducts();
    }
  }, [user]);

  const fetchFavoriteProducts = async () => {
    if (!user) return;

    setLoading(true);
    const { data: favorites, error: favError } = await supabase
      .from("favorites")
      .select("product_id")
      .eq("user_id", user.id);

    if (favError || !favorites || favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const productIds = favorites.map((f) => f.product_id);
    const { data: productsData, error: prodError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (!prodError && productsData) {
      setProducts(productsData);
    }
    setLoading(false);
  };

  const handleRemoveFavorite = async (productId: string) => {
    const success = await toggleFavorite(productId);
    if (success) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast({
        title: "Eliminado de favoritos",
        description: "El producto ha sido removido de tus favoritos",
      });
    }
  };

  // Get unique categories from favorites
  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category))];
  }, [products]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = searchQuery === "" || 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b safe-area-inset-top">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Mis Favoritos</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en favoritos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer shrink-0"
              onClick={() => setSelectedCategory(null)}
            >
              Todos ({products.length})
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer shrink-0"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} ({products.filter((p) => p.category === cat).length})
              </Badge>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">No tienes favoritos</p>
            <p className="text-muted-foreground">Guarda los productos que te interesen para verlos después</p>
            <Button onClick={() => navigate("/")} className="gap-2">
              <Package className="h-4 w-4" />
              Explorar Productos
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">No se encontraron resultados</p>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-3">
                    <div className="w-24 h-24 shrink-0">
                      <img
                        src={product.images[0] || "/placeholder.svg"}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 py-2 pr-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate text-sm">{product.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {product.category}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {product.product_type === "service" ? "Servicio" : "Producto"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-1">{product.location}</p>
                          <p className="text-sm font-medium text-primary mt-1">
                            ${product.estimated_value.toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveFavorite(product.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Favorites;
