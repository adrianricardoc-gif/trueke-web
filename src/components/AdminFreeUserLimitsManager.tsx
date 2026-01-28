import { useState, useEffect } from "react";
import { UserCircle, Package, Star, Rocket, RotateCcw, Eye, Trophy, Gavel, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const AdminFreeUserLimitsManager = () => {
  const { settings, loading, updateSetting, createSetting, refetch } = useAdminSettings();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [limits, setLimits] = useState({
    free_max_products: 5,
    free_max_featured_products: 0,
    free_super_likes_per_day: 1,
    free_boosts_per_month: 0,
    free_rewinds_per_day: 1,
    free_can_see_likes: false,
    free_can_participate_tournaments: true,
    free_can_participate_auctions: true,
  });

  useEffect(() => {
    if (settings.length > 0) {
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => { settingsMap[s.key] = s.value || ""; });
      
      setLimits({
        free_max_products: parseInt(settingsMap.free_max_products) || 5,
        free_max_featured_products: parseInt(settingsMap.free_max_featured_products) || 0,
        free_super_likes_per_day: parseInt(settingsMap.free_super_likes_per_day) || 1,
        free_boosts_per_month: parseInt(settingsMap.free_boosts_per_month) || 0,
        free_rewinds_per_day: parseInt(settingsMap.free_rewinds_per_day) || 1,
        free_can_see_likes: settingsMap.free_can_see_likes === "true",
        free_can_participate_tournaments: settingsMap.free_can_participate_tournaments !== "false",
        free_can_participate_auctions: settingsMap.free_can_participate_auctions !== "false",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { key: "free_max_products", value: limits.free_max_products.toString() },
        { key: "free_max_featured_products", value: limits.free_max_featured_products.toString() },
        { key: "free_super_likes_per_day", value: limits.free_super_likes_per_day.toString() },
        { key: "free_boosts_per_month", value: limits.free_boosts_per_month.toString() },
        { key: "free_rewinds_per_day", value: limits.free_rewinds_per_day.toString() },
        { key: "free_can_see_likes", value: limits.free_can_see_likes.toString() },
        { key: "free_can_participate_tournaments", value: limits.free_can_participate_tournaments.toString() },
        { key: "free_can_participate_auctions", value: limits.free_can_participate_auctions.toString() },
      ];

      for (const update of updates) {
        const existing = settings.find(s => s.key === update.key);
        if (existing) {
          await updateSetting(update.key, update.value);
        } else {
          await createSetting(update.key, update.value, `Límite para usuarios gratuitos: ${update.key}`, false);
        }
      }

      toast({
        title: "Límites actualizados",
        description: "Los límites para usuarios gratuitos han sido guardados.",
      });
      
      await refetch();
    } catch (error) {
      console.error("Error saving limits:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los límites.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-muted-foreground" />
          Límites para Usuarios Gratuitos
        </CardTitle>
        <CardDescription>
          Configura las restricciones y permisos para usuarios sin plan premium
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Publication Limits */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Límites de Publicación
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Máx. Productos</Label>
              <Input
                type="number"
                min={0}
                value={limits.free_max_products}
                onChange={(e) => setLimits(prev => ({ ...prev, free_max_products: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">0 = ilimitado</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Máx. Productos Destacados</Label>
              <Input
                type="number"
                min={0}
                value={limits.free_max_featured_products}
                onChange={(e) => setLimits(prev => ({ ...prev, free_max_featured_products: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Feature Limits */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-trueke-yellow" />
            Límites de Funciones Premium
          </Label>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3" /> Super Likes/día
              </Label>
              <Input
                type="number"
                min={0}
                value={limits.free_super_likes_per_day}
                onChange={(e) => setLimits(prev => ({ ...prev, free_super_likes_per_day: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Rocket className="h-3 w-3" /> Boosts/mes
              </Label>
              <Input
                type="number"
                min={0}
                value={limits.free_boosts_per_month}
                onChange={(e) => setLimits(prev => ({ ...prev, free_boosts_per_month: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <RotateCcw className="h-3 w-3" /> Rewinds/día
              </Label>
              <Input
                type="number"
                min={0}
                value={limits.free_rewinds_per_day}
                onChange={(e) => setLimits(prev => ({ ...prev, free_rewinds_per_day: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Feature Access */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Acceso a Funciones</Label>
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-trueke-teal" />
                Ver quién te da like
              </Label>
              <Switch
                checked={limits.free_can_see_likes}
                onCheckedChange={(checked) => setLimits(prev => ({ ...prev, free_can_see_likes: checked }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-trueke-yellow" />
                Participar en torneos
              </Label>
              <Switch
                checked={limits.free_can_participate_tournaments}
                onCheckedChange={(checked) => setLimits(prev => ({ ...prev, free_can_participate_tournaments: checked }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label className="flex items-center gap-2 text-sm">
                <Gavel className="h-4 w-4 text-trueke-orange" />
                Participar en subastas
              </Label>
              <Switch
                checked={limits.free_can_participate_auctions}
                onCheckedChange={(checked) => setLimits(prev => ({ ...prev, free_can_participate_auctions: checked }))}
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar Límites"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminFreeUserLimitsManager;
