import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMissions } from "@/hooks/useMissions";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  Gift, 
  CheckCircle2, 
  Clock, 
  ArrowLeft,
  Loader2,
  Sparkles,
  Flame,
  Calendar,
  Zap,
  Star,
  Trophy,
  Coins,
  PartyPopper
} from "lucide-react";

const Missions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dailyMissions, weeklyMissions, loading, claimMissionReward } = useMissions();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaimReward = async (userMissionId: string, missionId: string) => {
    setClaimingId(userMissionId);
    const { error } = await claimMissionReward(userMissionId, missionId);
    if (!error) {
      toast({
        title: "🎉 ¡Recompensa reclamada!",
        description: "Los TruKoins han sido añadidos a tu cuenta",
      });
    }
    setClaimingId(null);
  };

  const completedDaily = dailyMissions.filter(m => m.completed_at && !m.reward_claimed_at).length;
  const completedWeekly = weeklyMissions.filter(m => m.completed_at && !m.reward_claimed_at).length;
  const totalClaimable = completedDaily + completedWeekly;

  const dailyProgress = dailyMissions.length > 0 
    ? (dailyMissions.filter(m => m.completed_at).length / dailyMissions.length) * 100 
    : 0;
  const weeklyProgress = weeklyMissions.length > 0 
    ? (weeklyMissions.filter(m => m.completed_at).length / weeklyMissions.length) * 100 
    : 0;

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
            <div className="p-2 rounded-xl bg-gradient-to-br from-trueke-pink to-trueke-orange">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Misiones</h1>
              <p className="text-sm text-muted-foreground">Completa y gana TruKoins</p>
            </div>
          </div>
        </div>

        {/* Claimable Rewards Banner */}
        {totalClaimable > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500">
                    <PartyPopper className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-400">¡Tienes recompensas!</p>
                    <p className="text-sm text-muted-foreground">
                      {totalClaimable} {totalClaimable === 1 ? "misión completada" : "misiones completadas"}
                    </p>
                  </div>
                </div>
                <Gift className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-trueke-orange/10 to-trueke-pink/10 border-none">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-trueke-orange" />
                <span className="text-sm text-muted-foreground">Diarias</span>
              </div>
              <p className="text-2xl font-bold">{Math.round(dailyProgress)}%</p>
              <Progress value={dailyProgress} className="h-2 mt-2" />
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-trueke-cyan/10 to-trueke-green/10 border-none">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-trueke-cyan" />
                <span className="text-sm text-muted-foreground">Semanales</span>
              </div>
              <p className="text-2xl font-bold">{Math.round(weeklyProgress)}%</p>
              <Progress value={weeklyProgress} className="h-2 mt-2" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily" className="gap-2">
              <Flame className="h-4 w-4" />
              Diarias ({dailyMissions.length})
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-2">
              <Calendar className="h-4 w-4" />
              Semanales ({weeklyMissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-3">
            {dailyMissions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay misiones diarias disponibles</p>
                </CardContent>
              </Card>
            ) : (
              dailyMissions.map((userMission) => (
                <MissionCard
                  key={userMission.id || userMission.mission_id}
                  userMission={userMission}
                  onClaim={() => handleClaimReward(userMission.id, userMission.mission_id)}
                  claiming={claimingId === userMission.id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-3">
            {weeklyMissions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay misiones semanales disponibles</p>
                </CardContent>
              </Card>
            ) : (
              weeklyMissions.map((userMission) => (
                <MissionCard
                  key={userMission.id || userMission.mission_id}
                  userMission={userMission}
                  onClaim={() => handleClaimReward(userMission.id, userMission.mission_id)}
                  claiming={claimingId === userMission.id}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

interface MissionCardProps {
  userMission: any;
  onClaim: () => void;
  claiming: boolean;
}

const MissionCard = ({ userMission, onClaim, claiming }: MissionCardProps) => {
  const mission = userMission.mission;
  if (!mission) return null;

  const isCompleted = !!userMission.completed_at;
  const isClaimed = !!userMission.reward_claimed_at;
  const progressPercent = Math.min((userMission.current_progress / mission.target_count) * 100, 100);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "swipe":
        return <Zap className="h-5 w-5" />;
      case "trade":
        return <Star className="h-5 w-5" />;
      case "review":
        return <Trophy className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  return (
    <Card className={`overflow-hidden transition-all ${
      isClaimed 
        ? "opacity-60" 
        : isCompleted 
          ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 shadow-lg" 
          : "hover:shadow-md"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-3 rounded-xl ${
            isCompleted 
              ? "bg-gradient-to-br from-green-500 to-emerald-500" 
              : "bg-gradient-to-br from-trueke-pink to-trueke-orange"
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-white" />
            ) : (
              getActionIcon(mission.action_type)
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{mission.title}</h3>
              {mission.mission_type === "daily" && (
                <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
                  <Flame className="h-3 w-3 mr-1" />
                  Diaria
                </Badge>
              )}
              {mission.mission_type === "weekly" && (
                <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  <Calendar className="h-3 w-3 mr-1" />
                  Semanal
                </Badge>
              )}
            </div>
            
            {mission.description && (
              <p className="text-sm text-muted-foreground mb-2">{mission.description}</p>
            )}

            {/* Progress */}
            {!isClaimed && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progreso</span>
                  <span className={isCompleted ? "text-green-400 font-medium" : ""}>
                    {userMission.current_progress} / {mission.target_count}
                  </span>
                </div>
                <Progress 
                  value={progressPercent} 
                  className={`h-2 ${isCompleted ? "[&>div]:bg-green-500" : ""}`}
                />
              </div>
            )}

            {isClaimed && (
              <Badge className="bg-muted text-muted-foreground mt-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Recompensa reclamada
              </Badge>
            )}
          </div>

          {/* Reward & Action */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 text-trueke-orange font-bold">
              <Coins className="h-4 w-4" />
              <span>{mission.reward_trukoins}</span>
            </div>
            
            {isCompleted && !isClaimed && (
              <Button
                size="sm"
                onClick={onClaim}
                disabled={claiming}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
              >
                {claiming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-1" />
                    Reclamar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Missions;
