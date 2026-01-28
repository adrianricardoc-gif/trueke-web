import { useState } from "react";
import { useAdminFeatureFlags } from "@/hooks/useAdminFeatureFlags";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Bot, Users, Coins, TrendingUp, Truck, Settings, Bell, Lock } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CATEGORY_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  monetization: { label: "Monetización", icon: <Coins className="h-4 w-4" />, color: "text-yellow-500" },
  social: { label: "Social", icon: <Users className="h-4 w-4" />, color: "text-blue-500" },
  ai: { label: "Inteligencia Artificial", icon: <Bot className="h-4 w-4" />, color: "text-purple-500" },
  gamification: { label: "Gamificación", icon: <TrendingUp className="h-4 w-4" />, color: "text-green-500" },
  trading: { label: "Trading", icon: <Zap className="h-4 w-4" />, color: "text-orange-500" },
  ux: { label: "Experiencia de Usuario", icon: <Settings className="h-4 w-4" />, color: "text-cyan-500" },
  logistics: { label: "Logística", icon: <Truck className="h-4 w-4" />, color: "text-amber-500" },
  technical: { label: "Técnico", icon: <Settings className="h-4 w-4" />, color: "text-slate-500" },
  notifications: { label: "Notificaciones", icon: <Bell className="h-4 w-4" />, color: "text-pink-500" },
};

export function AdminFeatureFlagsManager() {
  const { flags, updating, toggleFeature, getFeaturesByCategory } = useAdminFeatureFlags();
  const categorizedFlags = getFeaturesByCategory();

  if (flags.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const enabledCount = flags.filter((f) => f.is_enabled).length;
  const totalCount = flags.length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Control de Funcionalidades
          </CardTitle>
          <CardDescription>
            Activa o desactiva funcionalidades de la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-primary">{enabledCount}</div>
            <div className="text-muted-foreground">de {totalCount} funcionalidades activas</div>
          </div>
          <div className="w-full h-2 bg-muted rounded-full mt-2">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(enabledCount / totalCount) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags by Category */}
      <Accordion type="multiple" defaultValue={Object.keys(categorizedFlags)} className="space-y-4">
        {Object.entries(categorizedFlags).map(([category, categoryFlags]) => {
          const categoryInfo = CATEGORY_INFO[category] || {
            label: category,
            icon: <Settings className="h-4 w-4" />,
            color: "text-muted-foreground",
          };
          const enabledInCategory = categoryFlags.filter((f) => f.is_enabled).length;

          return (
            <AccordionItem key={category} value={category} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={categoryInfo.color}>{categoryInfo.icon}</div>
                  <span className="font-semibold">{categoryInfo.label}</span>
                  <Badge variant="secondary" className="ml-2">
                    {enabledInCategory}/{categoryFlags.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {categoryFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{flag.feature_name}</span>
                          {flag.requires_api_key && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Lock className="h-3 w-3" />
                              Requiere API Key
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {flag.description}
                        </p>
                        {flag.requires_api_key && (
                          <p className="text-xs text-amber-500 mt-1">
                            Configura {flag.requires_api_key} en API Keys para habilitar
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={flag.is_enabled}
                          disabled={updating === flag.feature_key}
                          onCheckedChange={(checked) =>
                            toggleFeature(flag.feature_key, checked)
                          }
                        />
                        {updating === flag.feature_key && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
