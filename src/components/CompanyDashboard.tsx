import { Building2, Briefcase, TrendingUp, Users, Clock, Eye, Heart, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCompanyStats } from "@/hooks/useCompanyStats";
import { Skeleton } from "@/components/ui/skeleton";

const CompanyDashboard = () => {
  const { stats, loading } = useCompanyStats();

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-secondary" />
          Dashboard Empresarial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span className="text-xs">Servicios Activos</span>
            </div>
            <p className="text-2xl font-bold text-secondary">{stats.activeServices}</p>
            <p className="text-xs text-muted-foreground">de {stats.totalServices} totales</p>
          </div>

          <div className="bg-background/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs">Consultas</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.totalInquiries}</p>
            <p className="text-xs text-muted-foreground">{stats.pendingOffers} pendientes</p>
          </div>

          <div className="bg-background/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Tratos Cerrados</span>
            </div>
            <p className="text-2xl font-bold text-trueke-green">{stats.completedDeals}</p>
            <p className="text-xs text-muted-foreground">{stats.acceptedOffers} en proceso</p>
          </div>

          <div className="bg-background/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Tiempo Respuesta</span>
            </div>
            <p className="text-2xl font-bold text-accent">{stats.averageResponseTime}</p>
            <p className="text-xs text-muted-foreground">promedio</p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-background/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Tasa de Conversión</span>
            </div>
            <span className="text-sm font-bold text-secondary">{stats.conversionRate}%</span>
          </div>
          <Progress value={stats.conversionRate} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Consultas convertidas en tratos cerrados
          </p>
        </div>

        {/* Engagement Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/80 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-trueke-pink/10">
              <Heart className="h-4 w-4 text-trueke-pink" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.likesReceived}</p>
              <p className="text-xs text-muted-foreground">Likes recibidos</p>
            </div>
          </div>

          <div className="bg-background/80 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-trueke-cyan/10">
              <Eye className="h-4 w-4 text-trueke-cyan" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.totalViews}</p>
              <p className="text-xs text-muted-foreground">Vistas aprox.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyDashboard;
