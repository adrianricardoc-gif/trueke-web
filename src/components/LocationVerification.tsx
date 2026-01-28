import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { MapPin, CheckCircle, Loader2, Navigation } from "lucide-react";
import { ECUADOR_CITIES } from "@/data/ecuadorCities";

// Ecuador city coordinates (approximate)
const CITY_COORDINATES: Record<string, { lat: number; lng: number; radius: number }> = {
  "Quito": { lat: -0.1807, lng: -78.4678, radius: 30 },
  "Guayaquil": { lat: -2.1894, lng: -79.8891, radius: 30 },
  "Cuenca": { lat: -2.9005, lng: -79.0045, radius: 20 },
  "Santo Domingo": { lat: -0.2532, lng: -79.1719, radius: 15 },
  "Machala": { lat: -3.2586, lng: -79.9554, radius: 15 },
  "Manta": { lat: -0.9677, lng: -80.7089, radius: 15 },
  "Portoviejo": { lat: -1.0547, lng: -80.4545, radius: 15 },
  "Loja": { lat: -3.9931, lng: -79.2042, radius: 15 },
  "Ambato": { lat: -1.2491, lng: -78.6168, radius: 15 },
  "Esmeraldas": { lat: 0.9592, lng: -79.6539, radius: 15 },
  "Riobamba": { lat: -1.6635, lng: -78.6545, radius: 15 },
  "Ibarra": { lat: 0.3517, lng: -78.1223, radius: 15 },
  "Salinas": { lat: -2.2249, lng: -80.9588, radius: 10 },
  "Tena": { lat: -0.9934, lng: -77.8141, radius: 10 },
  "Galápagos": { lat: -0.7429, lng: -90.3035, radius: 50 },
};

interface LocationVerificationProps {
  currentLocation?: string | null;
  onVerified?: (city: string) => void;
}

const LocationVerification = ({ currentLocation, onVerified }: LocationVerificationProps) => {
  const { user } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Find nearest city
  const findNearestCity = (lat: number, lng: number): string | null => {
    let nearestCity: string | null = null;
    let minDistance = Infinity;

    for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
      const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
      if (distance < coords.radius && distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    return nearestCity;
  };

  const handleVerifyLocation = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para verificar tu ubicación",
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tu navegador no soporta geolocalización",
      });
      return;
    }

    setVerifying(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      const city = findNearestCity(latitude, longitude);

      if (city) {
        // Update profile with coordinates
        const { error } = await supabase
          .from("profiles")
          .update({
            latitude,
            longitude,
            location: city,
            location_verified_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) throw error;

        setDetectedCity(city);
        setVerified(true);
        onVerified?.(city);

        toast({
          title: "¡Ubicación verificada!",
          description: `Tu ubicación en ${city} ha sido confirmada`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Ubicación no reconocida",
          description: "No pudimos identificar tu ciudad. Intenta desde una ciudad de Ecuador.",
        });
      }
    } catch (error: any) {
      console.error("Geolocation error:", error);
      toast({
        variant: "destructive",
        title: "Error de ubicación",
        description: error.message === "User denied Geolocation" 
          ? "Debes permitir el acceso a tu ubicación" 
          : "No pudimos obtener tu ubicación",
      });
    } finally {
      setVerifying(false);
    }
  };

  if (verified && detectedCity) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-trueke-green/10 border border-trueke-green/30">
        <CheckCircle className="h-5 w-5 text-trueke-green" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Ubicación verificada</p>
          <p className="text-xs text-muted-foreground">{detectedCity}, Ecuador</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span className="text-sm">
          {currentLocation ? `Ubicación actual: ${currentLocation}` : "Ubicación no verificada"}
        </span>
      </div>
      <Button
        onClick={handleVerifyLocation}
        disabled={verifying}
        variant="outline"
        className="w-full gap-2"
      >
        {verifying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando ubicación...
          </>
        ) : (
          <>
            <Navigation className="h-4 w-4" />
            Verificar mi ubicación con GPS
          </>
        )}
      </Button>
    </div>
  );
};

export default LocationVerification;
