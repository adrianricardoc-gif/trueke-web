import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, RefreshCw, AlertTriangle, Package, Bell, Save, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const AdminProductExpiryManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [defaultDays, setDefaultDays] = useState<string>("30");

  // Fetch current expiry setting
  const { data: expirySetting, isLoading: loadingSetting } = useQuery({
    queryKey: ["admin-expiry-setting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("key", "default_product_expiry_days")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) setDefaultDays(data.value || "30");
      return data;
    },
  });

  // Fetch expiring products stats
  const { data: expiryStats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-expiry-stats"],
    queryFn: async () => {
      const now = new Date();
      const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Products expiring soon
      const { data: expiringSoon, error: e1 } = await supabase
        .from("products")
        .select("id, title, expires_at, user_id")
        .eq("status", "active")
        .lte("expires_at", threeDays.toISOString())
        .gt("expires_at", now.toISOString())
        .order("expires_at", { ascending: true })
        .limit(10);

      if (e1) throw e1;

      // Expired products count
      const { count: expiredCount, error: e2 } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "expired");

      if (e2) throw e2;

      // Products expiring within 7 days
      const { count: expiring7Days, error: e3 } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .lte("expires_at", sevenDays.toISOString())
        .gt("expires_at", now.toISOString());

      if (e3) throw e3;

      // Active products without expiry (legacy)
      const { count: noExpiryCount, error: e4 } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .is("expires_at", null);

      if (e4) throw e4;

      return {
        expiringSoon: expiringSoon || [],
        expiredCount: expiredCount || 0,
        expiring7Days: expiring7Days || 0,
        noExpiryCount: noExpiryCount || 0,
      };
    },
  });

  // Update expiry setting
  const updateSettingMutation = useMutation({
    mutationFn: async (days: number) => {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          key: "default_product_expiry_days",
          value: days.toString(),
          description: "Días por defecto antes de que expire una publicación",
          is_secret: false,
        }, { onConflict: "key" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expiry-setting"] });
      toast({
        title: "Configuración guardada",
        description: `Las publicaciones ahora expirarán en ${defaultDays} días por defecto.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set expiry for legacy products
  const setLegacyExpiryMutation = useMutation({
    mutationFn: async () => {
      const days = parseInt(defaultDays) || 30;
      const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from("products")
        .update({ expires_at: expiryDate })
        .eq("status", "active")
        .is("expires_at", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expiry-stats"] });
      toast({
        title: "Productos actualizados",
        description: "Se ha establecido fecha de expiración a todos los productos sin fecha.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveSetting = () => {
    const days = parseInt(defaultDays);
    if (isNaN(days) || days < 1 || days > 365) {
      toast({
        title: "Valor inválido",
        description: "Los días deben estar entre 1 y 365.",
        variant: "destructive",
      });
      return;
    }
    updateSettingMutation.mutate(days);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configuración de Expiración
          </CardTitle>
          <CardDescription>
            Configura cuántos días duran las publicaciones antes de expirar automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="expiry-days">Días de duración por defecto</Label>
              <Input
                id="expiry-days"
                type="number"
                min="1"
                max="365"
                value={defaultDays}
                onChange={(e) => setDefaultDays(e.target.value)}
                className="max-w-[150px]"
              />
            </div>
            <Button
              onClick={handleSaveSetting}
              disabled={updateSettingMutation.isPending}
              className="gap-2"
            >
              {updateSettingMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </Button>
          </div>

          <Separator />

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-primary" />
              Notificaciones automáticas
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>3 días antes:</strong> Email recordatorio amigable</li>
              <li>• <strong>1 día antes:</strong> Email urgente de última oportunidad</li>
              <li>• <strong>Al expirar:</strong> El producto pasa a estado "Expirado"</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiryStats?.expiring7Days || 0}</p>
                <p className="text-xs text-muted-foreground">Expiran en 7 días</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Clock className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiryStats?.expiredCount || 0}</p>
                <p className="text-xs text-muted-foreground">Productos expirados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiryStats?.noExpiryCount || 0}</p>
                <p className="text-xs text-muted-foreground">Sin fecha (legacy)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setLegacyExpiryMutation.mutate()}
              disabled={setLegacyExpiryMutation.isPending || (expiryStats?.noExpiryCount || 0) === 0}
            >
              {setLegacyExpiryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Asignar fechas
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Añade expiración a productos antiguos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Productos por expirar (próximos 3 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : expiryStats?.expiringSoon && expiryStats.expiringSoon.length > 0 ? (
            <div className="space-y-2">
              {expiryStats.expiringSoon.map((product: any) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.title}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {product.id.slice(0, 8)}...
                    </p>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    {product.expires_at
                      ? formatDistanceToNow(new Date(product.expires_at), {
                          addSuffix: true,
                          locale: es,
                        })
                      : "Sin fecha"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay productos por expirar próximamente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
