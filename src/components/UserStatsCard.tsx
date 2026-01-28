import { Trophy, Star, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTradeStats } from "@/hooks/useTradeStats";

const UserStatsCard = () => {
  const navigate = useNavigate();
  const { stats, loading } = useTradeStats();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-20 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Tus estadísticas</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1 text-xs"
            onClick={() => navigate("/trade-history")}
          >
            Ver más
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-primary/10">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{stats.completedTrades}</p>
            <p className="text-[10px] text-muted-foreground">Completados</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-secondary/10">
            <Star className="h-5 w-5 mx-auto mb-1 text-secondary" />
            <p className="text-lg font-bold">{stats.averageRating || "-"}</p>
            <p className="text-[10px] text-muted-foreground">Calificación</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-accent/10">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-accent" />
            <p className="text-lg font-bold">{stats.successRate}%</p>
            <p className="text-[10px] text-muted-foreground">Éxito</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStatsCard;
