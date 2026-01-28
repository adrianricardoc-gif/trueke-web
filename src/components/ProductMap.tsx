import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MapPin, Filter, Navigation, ExternalLink, Loader2 } from "lucide-react";

// Ecuador center coordinates
const ECUADOR_CENTER: [number, number] = [-1.8312, -78.1834];

// City coordinates
const CITY_COORDS: Record<string, [number, number]> = {
  "Quito": [-0.1807, -78.4678],
  "Guayaquil": [-2.1894, -79.8891],
  "Cuenca": [-2.9001, -79.0059],
  "Santo Domingo": [-0.2532, -79.1719],
  "Machala": [-3.2581, -79.9554],
  "Manta": [-0.9676, -80.7089],
  "Portoviejo": [-1.0546, -80.4545],
  "Loja": [-3.9931, -79.2042],
  "Ambato": [-1.2543, -78.6229],
  "Esmeraldas": [0.9592, -79.6539],
  "Riobamba": [-1.6635, -78.6548],
  "Ibarra": [0.3392, -78.1223],
};

interface MapProduct {
  id: string;
  title: string;
  images: string[];
  estimated_value: number;
  location: string | null;
  category: string;
  latitude: number | null;
  longitude: number | null;
}

// Custom marker icon
const createCustomIcon = (category: string) => {
  const colors: Record<string, string> = {
    electronics: "#3B82F6",
    fashion: "#EC4899",
    home: "#10B981",
    gaming: "#8B5CF6",
    music: "#F59E0B",
    sports: "#EF4444",
    books: "#6366F1",
    art: "#14B8A6",
    other: "#6B7280",
  };

  const color = colors[category] || colors.other;

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to fit bounds
const FitBoundsToMarkers = ({ products }: { products: MapProduct[] }) => {
  const map = useMap();

  useEffect(() => {
    if (products.length === 0) return;

    const validProducts = products.filter(
      (p) => p.latitude !== null && p.longitude !== null
    );

    if (validProducts.length === 0) return;

    const bounds = new LatLngBounds(
      validProducts.map((p) => [p.latitude!, p.longitude!])
    );

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [products, map]);

  return null;
};

interface ProductMapProps {
  onProductSelect?: (productId: string) => void;
}

const ProductMap = ({ onProductSelect }: ProductMapProps) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<MapProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [distanceFilter, setDistanceFilter] = useState(100);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, images, estimated_value, location, category, latitude, longitude")
        .neq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;

      // Assign coordinates based on city if not set
      const productsWithCoords = (data || []).map((product) => {
        if (product.latitude && product.longitude) {
          return product;
        }

        // Try to get coordinates from city
        if (product.location) {
          const cityCoords = CITY_COORDS[product.location];
          if (cityCoords) {
            // Add slight randomness for visual separation
            return {
              ...product,
              latitude: cityCoords[0] + (Math.random() - 0.5) * 0.05,
              longitude: cityCoords[1] + (Math.random() - 0.5) * 0.05,
            };
          }
        }

        return product;
      });

      setProducts(productsWithCoords);
    } catch (error) {
      console.error("Error fetching products for map:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(
      (p) => p.latitude !== null && p.longitude !== null
    );

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    return filtered;
  }, [products, selectedCategory]);

  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category))];
  }, [products]);

  if (loading) {
    return (
      <div className="h-[400px] rounded-xl bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {/* Filter controls */}
        <div className="absolute top-3 right-3 z-[1000] flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="secondary" className="shadow-lg">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros del Mapa</SheetTitle>
                <SheetDescription>
                  Ajusta los filtros para encontrar productos cercanos
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Distance filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Radio de búsqueda: {distanceFilter} km
                  </label>
                  <Slider
                    value={[distanceFilter]}
                    onValueChange={(v) => setDistanceFilter(v[0])}
                    min={5}
                    max={200}
                    step={5}
                  />
                </div>

                {/* Category filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Categoría</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedCategory === null ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(null)}
                    >
                      Todas
                    </Badge>
                    {categories.map((cat) => (
                      <Badge
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Products count */}
        <div className="absolute top-3 left-3 z-[1000]">
          <Badge variant="secondary" className="shadow-lg">
            <MapPin className="h-3 w-3 mr-1" />
            {filteredProducts.length} productos
          </Badge>
        </div>

        {/* Map */}
        <MapContainer
          center={ECUADOR_CENTER}
          zoom={7}
          style={{ height: "400px", width: "100%" }}
          className="rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBoundsToMarkers products={filteredProducts} />

          {filteredProducts.map((product) => (
            <Marker
              key={product.id}
              position={[product.latitude!, product.longitude!]}
              icon={createCustomIcon(product.category)}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <img
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {product.title}
                  </h3>
                  <p className="text-trueke-green font-bold">
                    {formatCurrency(product.estimated_value)}
                  </p>
                  {product.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Navigation className="h-3 w-3" />
                      {product.location}
                    </p>
                  )}
                  {onProductSelect && (
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => onProductSelect(product.id)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver producto
                    </Button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
};

export default ProductMap;
