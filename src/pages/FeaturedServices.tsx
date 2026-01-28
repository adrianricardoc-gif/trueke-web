import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, BadgeCheck, Building2, MapPin, Briefcase, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import { formatCurrency } from "@/lib/utils";

interface FeaturedService {
  id: string;
  title: string;
  description: string | null;
  estimated_value: number;
  images: string[];
  location: string | null;
  category: string;
  user_id: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
}

const FeaturedServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState<FeaturedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchFeaturedServices();
  }, []);

  const fetchFeaturedServices = async () => {
    try {
      // Fetch services from verified companies
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("product_type", "service")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (products && products.length > 0) {
        const userIds = [...new Set(products.map(p => p.user_id))];
        
        // Fetch profiles to check verification status
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, is_verified, user_type")
          .in("user_id", userIds)
          .eq("user_type", "company");

        const verifiedUserIds = profiles?.filter(p => p.is_verified).map(p => p.user_id) || [];
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Prioritize verified companies
        const servicesWithProfiles = products
          .filter(p => profileMap.has(p.user_id))
          .map(product => ({
            ...product,
            profile: profileMap.get(product.user_id) || null,
          }))
          .sort((a, b) => {
            const aVerified = verifiedUserIds.includes(a.user_id);
            const bVerified = verifiedUserIds.includes(b.user_id);
            if (aVerified && !bVerified) return -1;
            if (!aVerified && bVerified) return 1;
            return 0;
          });

        setServices(servicesWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching featured services:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const verifiedServices = filteredServices.filter(s => s.profile?.is_verified);
  const otherServices = filteredServices.filter(s => !s.profile?.is_verified);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-secondary/10 to-primary/10 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-secondary" />
            <h1 className="text-lg font-semibold">Servicios Destacados</h1>
          </div>
        </div>
        
        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar servicios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Verified Companies Section */}
        {verifiedServices.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Empresas Verificadas</h2>
              <Badge variant="secondary" className="text-xs">
                {verifiedServices.length}
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {verifiedServices.map((service) => (
                <ServiceCard key={service.id} service={service} featured />
              ))}
            </div>
          </section>
        )}

        {/* Other Services */}
        {otherServices.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Más Servicios</h2>
              <Badge variant="outline" className="text-xs">
                {otherServices.length}
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {otherServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        )}

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hay servicios disponibles</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Intenta con otra búsqueda" : "Vuelve pronto para ver nuevos servicios"}
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

interface ServiceCardProps {
  service: FeaturedService;
  featured?: boolean;
}

const ServiceCard = ({ service, featured }: ServiceCardProps) => {
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg ${
      featured ? "border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5" : ""
    }`}>
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* Service Image */}
          <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
            <img
              src={service.images[0] || "/placeholder.svg"}
              alt={service.title}
              className="w-full h-full object-cover"
            />
            {featured && (
              <div className="absolute top-1 right-1">
                <Star className="h-4 w-4 text-trueke-yellow fill-trueke-yellow" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {service.title}
              </h3>
              <span className="text-sm font-bold text-primary shrink-0">
                {formatCurrency(service.estimated_value)}
              </span>
            </div>

            {service.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {service.description}
              </p>
            )}

            {/* Provider Info */}
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={service.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {service.profile?.display_name?.[0] || "E"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {service.profile?.display_name || "Empresa"}
              </span>
              {service.profile?.is_verified && (
                <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
              )}
            </div>

            {service.location && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {service.location}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturedServices;
