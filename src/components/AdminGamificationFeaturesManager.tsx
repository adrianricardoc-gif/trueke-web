import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Target, Trophy, Swords, Gavel, Settings } from "lucide-react";
import { useAdminFeatureFlags } from "@/hooks/useAdminFeatureFlags";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { useToast } from "@/hooks/use-toast";

const GAMIFICATION_FEATURES = [
  { 
    key: "gamification_missions", 
    name: "Misiones", 
    description: "Sistema de misiones diarias y semanales",
    icon: Target 
  },
  { 
    key: "gamification_achievements", 
    name: "Logros", 
    description: "Sistema de logros y recompensas",
    icon: Trophy 
  },
  { 
    key: "gamification_tournaments", 
    name: "Torneos", 
    description: "Torneos y competencias entre usuarios",
    icon: Swords 
  },
  { 
    key: "trading_auctions", 
    name: "Subastas", 
    description: "Sistema de subastas de productos",
    icon: Gavel 
  },
];

export function AdminGamificationFeaturesManager() {
  const { flags, updating, toggleFeature } = useAdminFeatureFlags();
  const { settings, updateSetting, createSetting, loading: settingsLoading } = useAdminSettings();
  const { toast } = useToast();
  
  const [auctionSettings, setAuctionSettings] = useState({
    min_bid_increment: 1,
    max_duration_days: 7,
    min_duration_hours: 1,
    max_starting_price: 10000,
  });

  const [missionSettings, setMissionSettings] = useState({
    daily_reset_hour: 0,
    max_daily_missions: 5,
    max_weekly_missions: 3,
  });

  useEffect(() => {
    const minIncrement = settings.find(s => s.key === 'auction_min_bid_increment');
    const maxDuration = settings.find(s => s.key === 'auction_max_duration_days');
    const dailyReset = settings.find(s => s.key === 'mission_daily_reset_hour');
    const maxDaily = settings.find(s => s.key === 'mission_max_daily');
    const maxWeekly = settings.find(s => s.key === 'mission_max_weekly');

    if (minIncrement?.value) setAuctionSettings(prev => ({ ...prev, min_bid_increment: parseFloat(minIncrement.value!) }));
    if (maxDuration?.value) setAuctionSettings(prev => ({ ...prev, max_duration_days: parseInt(maxDuration.value!) }));
    if (dailyReset?.value) setMissionSettings(prev => ({ ...prev, daily_reset_hour: parseInt(dailyReset.value!) }));
    if (maxDaily?.value) setMissionSettings(prev => ({ ...prev, max_daily_missions: parseInt(maxDaily.value!) }));
    if (maxWeekly?.value) setMissionSettings(prev => ({ ...prev, max_weekly_missions: parseInt(maxWeekly.value!) }));
  }, [settings]);

  const getFlag = (key: string) => flags.find(f => f.feature_key === key);

  const handleSaveAuctionSettings = async () => {
    try {
      const existingMin = settings.find(s => s.key === 'auction_min_bid_increment');
      const existingMax = settings.find(s => s.key === 'auction_max_duration_days');
      
      if (existingMin) {
        await updateSetting('auction_min_bid_increment', String(auctionSettings.min_bid_increment));
      } else {
        await createSetting('auction_min_bid_increment', String(auctionSettings.min_bid_increment), 'Incremento mínimo de puja en subastas', false);
      }
      
      if (existingMax) {
        await updateSetting('auction_max_duration_days', String(auctionSettings.max_duration_days));
      } else {
        await createSetting('auction_max_duration_days', String(auctionSettings.max_duration_days), 'Duración máxima de subastas en días', false);
      }
      
      toast({
        title: "Configuración guardada",
        description: "Los parámetros de subastas han sido actualizados.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración.",
      });
    }
  };

  const handleSaveMissionSettings = async () => {
    try {
      const existingReset = settings.find(s => s.key === 'mission_daily_reset_hour');
      const existingDaily = settings.find(s => s.key === 'mission_max_daily');
      const existingWeekly = settings.find(s => s.key === 'mission_max_weekly');
      
      if (existingReset) {
        await updateSetting('mission_daily_reset_hour', String(missionSettings.daily_reset_hour));
      } else {
        await createSetting('mission_daily_reset_hour', String(missionSettings.daily_reset_hour), 'Hora de reinicio de misiones diarias (0-23)', false);
      }
      
      if (existingDaily) {
        await updateSetting('mission_max_daily', String(missionSettings.max_daily_missions));
      } else {
        await createSetting('mission_max_daily', String(missionSettings.max_daily_missions), 'Máximo de misiones diarias activas', false);
      }
      
      if (existingWeekly) {
        await updateSetting('mission_max_weekly', String(missionSettings.max_weekly_missions));
      } else {
        await createSetting('mission_max_weekly', String(missionSettings.max_weekly_missions), 'Máximo de misiones semanales activas', false);
      }
      
      toast({
        title: "Configuración guardada",
        description: "Los parámetros de misiones han sido actualizados.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración.",
      });
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Módulos de Gamificación y Trading
          </CardTitle>
          <CardDescription>
            Activa o desactiva los módulos principales del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {GAMIFICATION_FEATURES.map((feature) => {
            const flag = getFlag(feature.key);
            const isEnabled = flag?.is_enabled ?? false;
            const isUpdating = updating === feature.key;
            const Icon = feature.icon;

            return (
              <div key={feature.key} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <Label className="text-base font-medium">{feature.name}</Label>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  disabled={isUpdating || !flag}
                  onCheckedChange={(checked) => {
                    if (flag) {
                      toggleFeature(feature.key, checked);
                    }
                  }}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Auction Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Configuración de Subastas
          </CardTitle>
          <CardDescription>
            Parámetros del sistema de subastas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Incremento mínimo de puja ($)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={auctionSettings.min_bid_increment}
                onChange={(e) => setAuctionSettings(prev => ({ 
                  ...prev, 
                  min_bid_increment: parseFloat(e.target.value) || 1 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Cantidad mínima que debe superar cada nueva puja
              </p>
            </div>

            <div className="space-y-2">
              <Label>Duración máxima (días)</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={auctionSettings.max_duration_days}
                onChange={(e) => setAuctionSettings(prev => ({ 
                  ...prev, 
                  max_duration_days: parseInt(e.target.value) || 7 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Tiempo máximo que puede durar una subasta
              </p>
            </div>

            <div className="space-y-2">
              <Label>Duración mínima (horas)</Label>
              <Input
                type="number"
                min="1"
                max="168"
                value={auctionSettings.min_duration_hours}
                onChange={(e) => setAuctionSettings(prev => ({ 
                  ...prev, 
                  min_duration_hours: parseInt(e.target.value) || 1 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Tiempo mínimo que debe durar una subasta
              </p>
            </div>

            <div className="space-y-2">
              <Label>Precio inicial máximo ($)</Label>
              <Input
                type="number"
                min="1"
                value={auctionSettings.max_starting_price}
                onChange={(e) => setAuctionSettings(prev => ({ 
                  ...prev, 
                  max_starting_price: parseInt(e.target.value) || 10000 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Precio de inicio máximo permitido
              </p>
            </div>
          </div>

          <Button onClick={handleSaveAuctionSettings} className="w-full sm:w-auto">
            Guardar configuración de subastas
          </Button>
        </CardContent>
      </Card>

      {/* Mission Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Configuración de Misiones
          </CardTitle>
          <CardDescription>
            Parámetros del sistema de misiones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Hora de reinicio diario (0-23)</Label>
              <Input
                type="number"
                min="0"
                max="23"
                value={missionSettings.daily_reset_hour}
                onChange={(e) => setMissionSettings(prev => ({ 
                  ...prev, 
                  daily_reset_hour: parseInt(e.target.value) || 0 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Hora UTC en que se reinician las misiones diarias
              </p>
            </div>

            <div className="space-y-2">
              <Label>Máx. misiones diarias</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={missionSettings.max_daily_missions}
                onChange={(e) => setMissionSettings(prev => ({ 
                  ...prev, 
                  max_daily_missions: parseInt(e.target.value) || 5 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Misiones diarias disponibles por usuario
              </p>
            </div>

            <div className="space-y-2">
              <Label>Máx. misiones semanales</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={missionSettings.max_weekly_missions}
                onChange={(e) => setMissionSettings(prev => ({ 
                  ...prev, 
                  max_weekly_missions: parseInt(e.target.value) || 3 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Misiones semanales disponibles por usuario
              </p>
            </div>
          </div>

          <Button onClick={handleSaveMissionSettings} className="w-full sm:w-auto">
            Guardar configuración de misiones
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
