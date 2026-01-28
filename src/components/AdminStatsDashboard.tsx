import { Users, Building2, UserCircle, BadgeCheck, Crown, DollarSign, Package, Briefcase, MessageSquare, Handshake, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { useAdminStats } from "@/hooks/useAdminStats";
import { formatCurrency } from "@/lib/utils";

const AdminStatsDashboard = () => {
  const { userStats, subscriptionStats, activityStats, dailyActivity, loading } = useAdminStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const verificationRate = userStats.totalUsers > 0 
    ? Math.round((userStats.verifiedUsers / userStats.totalUsers) * 100) 
    : 0;

  const premiumRate = subscriptionStats.totalSubscriptions > 0
    ? Math.round(((subscriptionStats.premiumPersons + subscriptionStats.premiumCompanies) / subscriptionStats.activeSubscriptions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* User Stats Row */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Usuarios
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-primary">{userStats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Total Usuarios</p>
                </div>
                <Users className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-trueke-green">+{userStats.newUsersThisWeek}</p>
                  <p className="text-sm text-muted-foreground">Esta Semana</p>
                </div>
                <TrendingUp className="h-8 w-8 text-trueke-green/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <UserCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">{userStats.personUsers}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-secondary" />
                    <span className="text-sm">{userStats.companyUsers}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Personas</p>
                  <p className="text-xs text-muted-foreground">Empresas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <BadgeCheck className="h-4 w-4 text-trueke-cyan" />
                    <span className="text-sm">Verificados</span>
                  </div>
                  <span className="text-sm font-bold">{userStats.verifiedUsers}</span>
                </div>
                <Progress value={verificationRate} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{verificationRate}% del total</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Subscription Stats Row */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Crown className="h-5 w-5 text-trueke-yellow" />
          Suscripciones Premium
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-trueke-yellow/10 to-trueke-orange/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-trueke-yellow">{subscriptionStats.activeSubscriptions}</p>
                  <p className="text-sm text-muted-foreground">Activas</p>
                </div>
                <Crown className="h-8 w-8 text-trueke-yellow/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <UserCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{subscriptionStats.premiumPersons}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-medium">{subscriptionStats.premiumCompanies}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Premium</p>
                  <p className="text-xs text-muted-foreground">Premium</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tasa Premium</span>
                  <span className="text-sm font-bold text-trueke-yellow">{premiumRate}%</span>
                </div>
                <Progress value={premiumRate} className="h-2 [&>div]:bg-trueke-yellow" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-trueke-green/10 to-trueke-cyan/10">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-trueke-green">{formatCurrency(subscriptionStats.monthlyRevenue)}</p>
                  <p className="text-sm text-muted-foreground">Ingreso Mensual</p>
                </div>
                <DollarSign className="h-8 w-8 text-trueke-green/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Stats Row */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5 text-secondary" />
          Actividad de la Plataforma
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{activityStats.totalProducts}</p>
                  <p className="text-xs text-muted-foreground">Productos</p>
                </div>
                <Package className="h-6 w-6 text-primary/30" />
              </div>
              <p className="text-xs text-trueke-green mt-1">{activityStats.activeProducts} activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{activityStats.totalServices}</p>
                  <p className="text-xs text-muted-foreground">Servicios</p>
                </div>
                <Briefcase className="h-6 w-6 text-secondary/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{activityStats.totalMatches}</p>
                  <p className="text-xs text-muted-foreground">Matches</p>
                </div>
                <Handshake className="h-6 w-6 text-trueke-pink/30" />
              </div>
              <p className="text-xs text-trueke-green mt-1">{activityStats.completedTrades} completados</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{activityStats.totalMessages}</p>
                  <p className="text-xs text-muted-foreground">Mensajes</p>
                </div>
                <MessageSquare className="h-6 w-6 text-trueke-cyan/30" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{activityStats.totalSwipes} swipes</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad Diaria (Últimos 14 días)</CardTitle>
          <CardDescription>Nuevos usuarios, productos, matches y mensajes por día</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Bar dataKey="users" name="Usuarios" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="products" name="Productos" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="matches" name="Matches" fill="hsl(346 77% 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="messages" name="Mensajes" fill="hsl(187 71% 49%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatsDashboard;
