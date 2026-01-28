import { useNavigate } from "react-router-dom";
import { useAchievements } from "@/hooks/useAchievements";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Lock, 
  Unlock, 
  Star, 
  ArrowLeft,
  Loader2,
  Sparkles,
  Gift,
  Zap,
  Target,
  Award,
  Crown,
  Flame,
  Heart,
  ShieldCheck
} from "lucide-react";

const Achievements = () => {
  const navigate = useNavigate();
  const { achievements, userAchievements, loading, isAchievementUnlocked, getAchievementProgress } = useAchievements();

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case "trades":
        return <Zap className="h-5 w-5" />;
      case "social":
        return <Heart className="h-5 w-5" />;
      case "premium":
        return <Crown className="h-5 w-5" />;
      case "streak":
        return <Flame className="h-5 w-5" />;
      case "trust":
        return <ShieldCheck className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "trades":
        return "from-trueke-orange to-trueke-pink";
      case "social":
        return "from-trueke-pink to-trueke-cyan";
      case "premium":
        return "from-yellow-400 to-orange-500";
      case "streak":
        return "from-red-500 to-orange-500";
      case "trust":
        return "from-green-500 to-emerald-500";
      default:
        return "from-trueke-cyan to-trueke-green";
    }
  };

  const categories = [...new Set(achievements.map(a => a.category || "general"))];

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
            <div className="p-2 rounded-xl bg-gradient-to-br from-trueke-cyan to-trueke-green">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Logros</h1>
              <p className="text-sm text-muted-foreground">Desbloquea recompensas</p>
            </div>
          </div>
        </div>

        {/* Progress Banner */}
        <Card className="mb-6 bg-gradient-to-r from-trueke-cyan/10 via-trueke-green/10 to-trueke-orange/10 border-none overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="p-4 rounded-full bg-gradient-to-br from-trueke-cyan to-trueke-green">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 p-1 rounded-full bg-background">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Logros desbloqueados</p>
                  <p className="text-3xl font-bold">
                    {unlockedCount} <span className="text-lg text-muted-foreground">/ {totalCount}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progreso total</p>
                <p className="text-2xl font-bold text-primary">{Math.round(progressPercent)}%</p>
              </div>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="w-full flex overflow-x-auto">
            <TabsTrigger value="all" className="flex-1">
              Todos
            </TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="flex-1 capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={isAchievementUnlocked(achievement.id)}
                progress={getAchievementProgress(achievement.id)}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
              />
            ))}
          </TabsContent>

          {categories.map(cat => (
            <TabsContent key={cat} value={cat} className="space-y-3">
              {achievements
                .filter(a => (a.category || "general") === cat)
                .map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={isAchievementUnlocked(achievement.id)}
                    progress={getAchievementProgress(achievement.id)}
                    getCategoryIcon={getCategoryIcon}
                    getCategoryColor={getCategoryColor}
                  />
                ))}
            </TabsContent>
          ))}
        </Tabs>

        {achievements.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay logros disponibles</p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

interface AchievementCardProps {
  achievement: any;
  isUnlocked: boolean;
  progress: any;
  getCategoryIcon: (category: string | null) => JSX.Element;
  getCategoryColor: (category: string | null) => string;
}

const AchievementCard = ({
  achievement,
  isUnlocked,
  progress,
  getCategoryIcon,
  getCategoryColor,
}: AchievementCardProps) => {
  const progressPercent = progress 
    ? Math.min((progress.progress / achievement.requirement_value) * 100, 100)
    : 0;

  return (
    <Card className={`overflow-hidden transition-all ${
      isUnlocked 
        ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 shadow-lg" 
        : "opacity-80 hover:opacity-100"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`relative p-3 rounded-xl ${
            isUnlocked 
              ? `bg-gradient-to-br ${getCategoryColor(achievement.category)}` 
              : "bg-muted"
          }`}>
            <span className="text-2xl">{achievement.icon}</span>
            {isUnlocked && (
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-green-500">
                <Unlock className="h-3 w-3 text-white" />
              </div>
            )}
            {!isUnlocked && achievement.is_secret && (
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-muted-foreground">
                <Lock className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold truncate ${isUnlocked ? "text-green-500" : ""}`}>
                {achievement.name}
              </h3>
              {isUnlocked && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  ✓ Desbloqueado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {achievement.description || `Completa ${achievement.requirement_value} ${achievement.requirement_type}`}
            </p>
            
            {/* Progress bar for non-unlocked achievements */}
            {!isUnlocked && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progreso</span>
                  <span>{progress?.progress || 0} / {achievement.requirement_value}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}
          </div>

          {/* Reward */}
          <div className="text-right flex-shrink-0">
            {achievement.reward_trukoins > 0 && (
              <div className="flex items-center gap-1 text-trueke-orange">
                <Gift className="h-4 w-4" />
                <span className="font-bold">{achievement.reward_trukoins}</span>
              </div>
            )}
            <Badge variant="outline" className="text-xs capitalize mt-1">
              {achievement.category || "general"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Achievements;
