import { useState } from "react";
import { ArrowLeft, Crown, Calendar, CreditCard, Tag, AlertTriangle, Check, X, Loader2, Sparkles, History, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { usePremiumPlans } from "@/hooks/usePremiumPlans";
import { useSubscriptionHistory } from "@/hooks/useSubscriptionHistory";
import { useFeaturedProducts } from "@/hooks/useFeaturedProducts";
import { formatCurrency } from "@/lib/utils";
import PremiumPlansDisplay from "@/components/PremiumPlansDisplay";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Subscription = () => {
  const navigate = useNavigate();
  const { userSubscription, isPremium, cancelSubscription, loading: plansLoading } = usePremiumPlans();
  const { subscriptions, discountUsages, totalSaved, loading: historyLoading } = useSubscriptionHistory();
  const { featuredProducts, maxFeaturedProducts, currentFeaturedCount } = useFeaturedProducts();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    await cancelSubscription();
    setCancelling(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-trueke-green text-white"><Check className="h-3 w-3 mr-1" />Activo</Badge>;
      case "cancelled":
        return <Badge variant="secondary"><X className="h-3 w-3 mr-1" />Cancelado</Badge>;
      case "expired":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "d MMM yyyy", { locale: es });
  };

  const loading = plansLoading || historyLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-trueke-yellow" />
            <h1 className="text-lg font-semibold">Mi Suscripción</h1>
          </div>
          {isPremium && (
            <Badge className="ml-auto bg-gradient-to-r from-trueke-yellow to-trueke-orange text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="p-4 space-y-6 pb-24">
          {/* Current Plan Card */}
          {userSubscription && userSubscription.plan && (
            <Card className="border-trueke-yellow/50 bg-gradient-to-br from-trueke-yellow/5 to-trueke-orange/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Crown className="h-5 w-5 text-trueke-yellow" />
                    Plan Actual
                  </CardTitle>
                  {getStatusBadge(userSubscription.status)}
                </div>
                <CardDescription>
                  {userSubscription.plan.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> Precio
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(userSubscription.plan.price)}
                      <span className="text-xs text-muted-foreground">
                        /{userSubscription.plan.billing_period === "monthly" ? "mes" : "año"}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Desde
                    </p>
                    <p className="font-semibold">{formatDate(userSubscription.started_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Expira
                    </p>
                    <p className="font-semibold">{formatDate(userSubscription.expires_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3" /> Destacados
                    </p>
                    <p className="font-semibold">{currentFeaturedCount}/{maxFeaturedProducts}</p>
                  </div>
                </div>

                {userSubscription.status === "active" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                        Cancelar Suscripción
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tu plan {userSubscription.plan.name} seguirá activo hasta {formatDate(userSubscription.expires_at)}. Después perderás acceso a las funciones premium.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Mantener Plan</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleCancel}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={cancelling}
                        >
                          {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Cancelar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
          )}

          {/* Savings Summary */}
          {totalSaved > 0 && (
            <Card className="bg-trueke-green/10 border-trueke-green/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-trueke-green/20 flex items-center justify-center">
                    <Tag className="h-6 w-6 text-trueke-green" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total ahorrado</p>
                    <p className="text-2xl font-bold text-trueke-green">
                      {formatCurrency(totalSaved)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs for History */}
          <Tabs defaultValue="plans" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="plans" className="flex items-center gap-1">
                <Crown className="h-4 w-4" />
                Planes
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plans" className="mt-4">
              <PremiumPlansDisplay />
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-4">
              {/* Subscription History */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Historial de Suscripciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : subscriptions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No tienes historial de suscripciones
                    </p>
                  ) : (
                    subscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{sub.plan?.name || "Plan"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(sub.started_at)} - {formatDate(sub.expires_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(sub.status)}
                          <p className="text-sm font-medium mt-1">
                            {formatCurrency(sub.plan?.price || 0)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Discount Codes Used */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Códigos de Descuento Usados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : discountUsages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No has usado códigos de descuento
                    </p>
                  ) : (
                    discountUsages.map((usage) => (
                      <div key={usage.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-trueke-green" />
                            <span className="font-mono font-medium">{usage.code?.code}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(usage.used_at)}
                          </p>
                        </div>
                        <Badge className="bg-trueke-green/10 text-trueke-green">
                          -{formatCurrency(usage.discount_applied)}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Subscription;
