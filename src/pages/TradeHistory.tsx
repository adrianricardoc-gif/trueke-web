import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, CheckCircle, Clock, Star, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTradeStats } from "@/hooks/useTradeStats";
import { Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const TradeHistory = () => {
  const navigate = useNavigate();
  const { stats, completedTrades, loading } = useTradeStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Historial de Truekes</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <section className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedTrades}</p>
                <p className="text-xs text-muted-foreground">Completados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-secondary/20">
                <TrendingUp className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
                <p className="text-xs text-muted-foreground">Éxito</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/20">
                <Star className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageRating || "-"}</p>
                <p className="text-xs text-muted-foreground">Calificación</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-muted to-muted/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-foreground/10">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalReviews}</p>
                <p className="text-xs text-muted-foreground">Reseñas</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progreso de truekes</span>
              <span className="text-sm text-muted-foreground">
                {stats.completedTrades}/{stats.totalTrades}
              </span>
            </div>
            <Progress value={stats.successRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {stats.pendingTrades} pendientes
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {stats.acceptedTrades} aceptados
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Trades List */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Truekes completados</h2>
          {completedTrades.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Aún no tienes truekes completados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedTrades.map((trade) => (
                <Card key={trade.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* My Product */}
                      <div className="flex-1">
                        <img
                          src={trade.myProduct?.images[0] || "/placeholder.svg"}
                          alt={trade.myProduct?.title}
                          className="w-16 h-16 rounded-xl object-cover mx-auto"
                        />
                        <p className="text-xs text-center mt-2 truncate">
                          {trade.myProduct?.title || "Producto"}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xl">⇄</span>
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>

                      {/* Their Product */}
                      <div className="flex-1">
                        <img
                          src={trade.theirProduct?.images[0] || "/placeholder.svg"}
                          alt={trade.theirProduct?.title}
                          className="w-16 h-16 rounded-xl object-cover mx-auto"
                        />
                        <p className="text-xs text-center mt-2 truncate">
                          {trade.theirProduct?.title || "Producto"}
                        </p>
                      </div>
                    </div>

                    {/* Other User & Date */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={trade.otherUser?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {trade.otherUser?.display_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {trade.otherUser?.display_name || "Usuario"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(trade.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default TradeHistory;
