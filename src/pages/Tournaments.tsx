import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Trophy, 
  Users, 
  Calendar, 
  Gift, 
  Loader2, 
  ArrowLeft,
  Crown,
  Medal,
  Award,
  Flame,
  Star,
  Target
} from "lucide-react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { AvatarImage } from "@/components/ui/avatar";
import { es } from "date-fns/locale";

const Tournaments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tournaments, myParticipations, loading, joinTournament, getLeaderboard, isParticipating } = useTournaments();
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const handleViewLeaderboard = async (tournamentId: string) => {
    setSelectedTournament(tournamentId);
    setLoadingLeaderboard(true);
    const { data } = await getLeaderboard(tournamentId);
    setLeaderboard(data || []);
    setLoadingLeaderboard(false);
  };

  const handleJoin = async (tournamentId: string) => {
    setJoiningId(tournamentId);
    await joinTournament(tournamentId);
    setJoiningId(null);
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const days = differenceInDays(end, now);
    const hours = differenceInHours(end, now) % 24;
    
    if (days > 0) return `${days}d ${hours}h restantes`;
    if (hours > 0) return `${hours}h restantes`;
    return "Termina pronto";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">🔥 Activo</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">📅 Próximo</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-300" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-bold">#{position}</span>;
    }
  };

  const activeTournaments = tournaments.filter(t => t.status === "active");
  const upcomingTournaments = tournaments.filter(t => t.status === "upcoming");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-trueke-orange to-trueke-pink">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Torneos</h1>
              <p className="text-sm text-muted-foreground">Compite y gana premios</p>
            </div>
          </div>
        </div>

        {/* Stats Banner */}
        <Card className="mb-6 bg-gradient-to-r from-trueke-orange/10 via-trueke-pink/10 to-trueke-cyan/10 border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-br from-trueke-orange to-trueke-pink">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Participaciones activas</p>
                  <p className="text-2xl font-bold">{myParticipations.length}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Torneos disponibles</p>
                <p className="text-2xl font-bold text-primary">{tournaments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="gap-2">
              <Flame className="h-4 w-4" />
              Activos ({activeTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="h-4 w-4" />
              Próximos ({upcomingTournaments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeTournaments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay torneos activos</p>
                </CardContent>
              </Card>
            ) : (
              activeTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  isParticipating={isParticipating(tournament.id)}
                  onJoin={() => handleJoin(tournament.id)}
                  onViewLeaderboard={() => handleViewLeaderboard(tournament.id)}
                  joining={joiningId === tournament.id}
                  getTimeRemaining={getTimeRemaining}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingTournaments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay torneos próximos</p>
                </CardContent>
              </Card>
            ) : (
              upcomingTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  isParticipating={isParticipating(tournament.id)}
                  onJoin={() => handleJoin(tournament.id)}
                  onViewLeaderboard={() => handleViewLeaderboard(tournament.id)}
                  joining={joiningId === tournament.id}
                  getTimeRemaining={getTimeRemaining}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Leaderboard Dialog */}
      <Dialog open={!!selectedTournament} onOpenChange={() => setSelectedTournament(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-trueke-orange" />
              Tabla de Posiciones
            </DialogTitle>
          </DialogHeader>
          
          {loadingLeaderboard ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aún no hay participantes</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {leaderboard.map((participant, index) => {
                  const isMe = participant.user_id === user?.id;
                  const displayName = participant.profile?.display_name || "Usuario";
                  
                  return (
                    <div
                      key={participant.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isMe 
                          ? "bg-gradient-to-r from-primary/20 to-primary/10 ring-2 ring-primary/50" 
                          : index < 3 
                            ? "bg-gradient-to-r from-trueke-orange/10 to-trueke-pink/10" 
                            : "bg-muted/50"
                      }`}
                    >
                      <div className="w-8 flex justify-center">
                        {getRankIcon(index + 1)}
                      </div>
                      <Avatar className="h-10 w-10">
                        {participant.profile?.avatar_url ? (
                          <img 
                            src={participant.profile.avatar_url} 
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-primary/20">
                            {displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{displayName}</p>
                          {isMe && (
                            <Badge variant="outline" className="text-xs shrink-0">Tú</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {participant.trades_count || 0} truekes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{participant.score || 0}</p>
                        <p className="text-xs text-muted-foreground">puntos</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

interface TournamentCardProps {
  tournament: any;
  isParticipating: boolean;
  onJoin: () => void;
  onViewLeaderboard: () => void;
  joining: boolean;
  getTimeRemaining: (date: string) => string;
  getStatusBadge: (status: string) => JSX.Element;
}

const TournamentCard = ({
  tournament,
  isParticipating,
  onJoin,
  onViewLeaderboard,
  joining,
  getTimeRemaining,
  getStatusBadge,
}: TournamentCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-trueke-orange to-trueke-pink">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{tournament.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{tournament.tournament_type}</p>
            </div>
          </div>
          {getStatusBadge(tournament.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tournament.description && (
          <p className="text-sm text-muted-foreground">{tournament.description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4 text-trueke-orange" />
            <span className="font-medium">{tournament.prize_trukoins} TruKoins</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-trueke-cyan" />
            <span>Mín. {tournament.min_participants} participantes</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(tournament.start_date), "d MMM", { locale: es })} - {format(new Date(tournament.end_date), "d MMM yyyy", { locale: es })}
          </span>
        </div>

        {tournament.status === "active" && (
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <span className="text-sm font-medium text-orange-500">
              ⏰ {getTimeRemaining(tournament.end_date)}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          {isParticipating ? (
            <>
              <Badge className="flex-1 justify-center py-2 bg-green-500/20 text-green-400 border-green-500/30">
                ✓ Participando
              </Badge>
              <Button variant="outline" onClick={onViewLeaderboard} className="flex-1">
                <Trophy className="h-4 w-4 mr-2" />
                Posiciones
              </Button>
            </>
          ) : (
            <>
              {tournament.status === "upcoming" ? (
                <div className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50 border border-dashed">
                  <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground text-center">
                    Abre el {format(new Date(tournament.start_date), "d MMM", { locale: es })}
                  </span>
                </div>
              ) : (
                <Button 
                  onClick={onJoin} 
                  disabled={joining}
                  className="flex-1 bg-gradient-to-r from-trueke-orange to-trueke-pink hover:opacity-90"
                >
                  {joining ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Star className="h-4 w-4 mr-2" />
                  )}
                  Unirme
                </Button>
              )}
              <Button variant="outline" onClick={onViewLeaderboard} className="flex-1">
                <Trophy className="h-4 w-4 mr-2" />
                Posiciones
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Tournaments;
