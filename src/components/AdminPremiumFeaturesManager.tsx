import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Crown, Star, Rocket, RotateCcw, Eye, Flame, Settings, Save } from "lucide-react";
import { useAdminFeatureFlags } from "@/hooks/useAdminFeatureFlags";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PREMIUM_FEATURES = [
  {
    key: "premium_super_likes",
    name: "Super Likes",
    description: "Permite a usuarios enviar Super Likes que destacan su interés",
    icon: Star,
    color: "text-trueke-yellow",
    bgColor: "bg-trueke-yellow/10",
  },
  {
    key: "premium_boosts",
    name: "Boosts de Visibilidad",
    description: "Permite impulsar temporalmente la visibilidad de productos",
    icon: Rocket,
    color: "text-trueke-orange",
    bgColor: "bg-trueke-orange/10",
  },
  {
    key: "premium_rewinds",
    name: "Deshacer (Rewind)",
    description: "Permite deshacer el último swipe negativo",
    icon: RotateCcw,
    color: "text-trueke-green",
    bgColor: "bg-trueke-green/10",
  },
  {
    key: "premium_who_likes_me",
    name: "Ver Quién Me Da Like",
    description: "Permite ver la lista de usuarios que han dado like",
    icon: Eye,
    color: "text-trueke-teal",
    bgColor: "bg-trueke-teal/10",
  },
  {
    key: "premium_hot_section",
    name: "Sección HOT 🔥",
    description: "Muestra la sección de productos más populares",
    icon: Flame,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    key: "premium_priority_ranking",
    name: "Prioridad en Ranking",
    description: "Da prioridad a productos premium en el algoritmo",
    icon: Crown,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

export function AdminPremiumFeaturesManager() {
  const { toast } = useToast();
  const { flags, updating, toggleFeature } = useAdminFeatureFlags();
  const { settings, updateSetting, createSetting } = useAdminSettings();
  const [savingDefaults, setSavingDefaults] = useState(false);
  
  // Helper to get setting value
  const getSettingValue = (key: string, defaultValue: string = "0") => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };
  
  // Default limits for free users
  const [defaultLimits, setDefaultLimits] = useState({
    free_super_likes_per_day: 1,
    free_boosts_per_month: 0,
    free_rewinds_per_day: 1,
    boost_duration_hours: 24,
    hot_section_limit: 10,
  });

  // Load settings when they're available
  useState(() => {
    if (settings.length > 0) {
      setDefaultLimits({
        free_super_likes_per_day: parseInt(getSettingValue("free_super_likes_per_day", "1")),
        free_boosts_per_month: parseInt(getSettingValue("free_boosts_per_month", "0")),
        free_rewinds_per_day: parseInt(getSettingValue("free_rewinds_per_day", "1")),
        boost_duration_hours: parseInt(getSettingValue("boost_duration_hours", "24")),
        hot_section_limit: parseInt(getSettingValue("hot_section_limit", "10")),
      });
    }
  });

  const premiumFlags = flags.filter(f => f.category === "premium");
  const enabledCount = premiumFlags.filter(f => f.is_enabled).length;

  const handleSaveDefaults = async () => {
    setSavingDefaults(true);
    try {
      const updates = Object.entries(defaultLimits).map(async ([key, value]) => {
        const exists = settings.find(s => s.key === key);
        if (exists) {
          return updateSetting(key, value.toString());
        } else {
          return createSetting(key, value.toString(), `Límite por defecto: ${key}`, false);
        }
      });
      await Promise.all(updates);
      toast({
        title: "Configuración guardada",
        description: "Los límites por defecto han sido actualizados.",
      });
    } catch (error) {
      console.error("Error saving defaults:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración.",
      });
    } finally {
      setSavingDefaults(false);
    }
  };

  const getFeatureFlag = (key: string) => {
    return premiumFlags.find(f => f.feature_key === key);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-trueke-yellow" />
            Control de Funciones Premium
          </CardTitle>
          <CardDescription>
            Activa/desactiva funciones premium y configura límites por defecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-primary">{enabledCount}</div>
            <div className="text-muted-foreground">de {PREMIUM_FEATURES.length} funciones activas</div>
          </div>
          <div className="w-full h-2 bg-muted rounded-full mt-2">
            <div
              className="h-full bg-trueke-yellow rounded-full transition-all"
              style={{ width: `${(enabledCount / PREMIUM_FEATURES.length) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funciones Disponibles</CardTitle>
          <CardDescription>
            Activa o desactiva cada función para todos los usuarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {PREMIUM_FEATURES.map((feature) => {
            const flag = getFeatureFlag(feature.key);
            const isEnabled = flag?.is_enabled ?? false;
            const isUpdating = updating === feature.key;

            return (
              <div
                key={feature.key}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                    <feature.icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{feature.name}</span>
                      {isEnabled && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                          Activo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={isEnabled}
                    disabled={isUpdating || !flag}
                    onCheckedChange={(checked) => {
                      if (flag) {
                        toggleFeature(feature.key, checked);
                      }
                    }}
                  />
                  {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Default Limits Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Límites por Defecto (Usuarios Gratis)
          </CardTitle>
          <CardDescription>
            Configura los límites para usuarios sin plan premium
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Star className="h-4 w-4 text-trueke-yellow" />
                Super Likes por día
              </Label>
              <Input
                type="number"
                min="0"
                value={defaultLimits.free_super_likes_per_day}
                onChange={(e) => setDefaultLimits(prev => ({
                  ...prev,
                  free_super_likes_per_day: parseInt(e.target.value) || 0
                }))}
              />
              <p className="text-xs text-muted-foreground">0 = deshabilitado para usuarios gratis</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-trueke-orange" />
                Boosts por mes
              </Label>
              <Input
                type="number"
                min="0"
                value={defaultLimits.free_boosts_per_month}
                onChange={(e) => setDefaultLimits(prev => ({
                  ...prev,
                  free_boosts_per_month: parseInt(e.target.value) || 0
                }))}
              />
              <p className="text-xs text-muted-foreground">0 = solo premium</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-trueke-green" />
                Rewinds por día
              </Label>
              <Input
                type="number"
                min="0"
                value={defaultLimits.free_rewinds_per_day}
                onChange={(e) => setDefaultLimits(prev => ({
                  ...prev,
                  free_rewinds_per_day: parseInt(e.target.value) || 0
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-muted-foreground" />
                Duración del Boost (horas)
              </Label>
              <Input
                type="number"
                min="1"
                value={defaultLimits.boost_duration_hours}
                onChange={(e) => setDefaultLimits(prev => ({
                  ...prev,
                  boost_duration_hours: parseInt(e.target.value) || 24
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-red-500" />
                Productos en HOT
              </Label>
              <Input
                type="number"
                min="1"
                value={defaultLimits.hot_section_limit}
                onChange={(e) => setDefaultLimits(prev => ({
                  ...prev,
                  hot_section_limit: parseInt(e.target.value) || 10
                }))}
              />
              <p className="text-xs text-muted-foreground">Cantidad de productos en la sección HOT</p>
            </div>
          </div>

          <Separator />

          <Button onClick={handleSaveDefaults} disabled={savingDefaults} className="gap-2">
            {savingDefaults ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar Configuración
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
