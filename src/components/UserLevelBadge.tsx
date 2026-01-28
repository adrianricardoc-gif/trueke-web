import { Trophy, Star, Award, Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UserLevelBadgeProps {
  level: number;
  experiencePoints: number;
  showProgress?: boolean;
}

const getLevelIcon = (level: number) => {
  if (level >= 50) return Crown;
  if (level >= 25) return Star;
  if (level >= 10) return Award;
  if (level >= 5) return Trophy;
  return Sparkles;
};

const getLevelColor = (level: number) => {
  if (level >= 50) return "bg-gradient-to-r from-yellow-500 to-amber-500 text-white";
  if (level >= 25) return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
  if (level >= 10) return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
  if (level >= 5) return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
  return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
};

const getLevelTitle = (level: number) => {
  if (level >= 50) return "Leyenda";
  if (level >= 25) return "Experto";
  if (level >= 10) return "Veterano";
  if (level >= 5) return "Truekero";
  return "Novato";
};

const XP_PER_LEVEL = 100;

const UserLevelBadge = ({ level, experiencePoints, showProgress = false }: UserLevelBadgeProps) => {
  const Icon = getLevelIcon(level);
  const colorClass = getLevelColor(level);
  const title = getLevelTitle(level);
  const progress = (experiencePoints % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
  const xpToNext = XP_PER_LEVEL - (experiencePoints % XP_PER_LEVEL);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex flex-col items-center gap-1">
          <Badge className={`${colorClass} px-3 py-1 gap-1.5 cursor-pointer`}>
            <Icon className="h-3.5 w-3.5" />
            <span className="font-bold">Nv. {level}</span>
          </Badge>
          {showProgress && (
            <div className="w-full max-w-[100px]">
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-center">
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            {experiencePoints} XP • {xpToNext} XP para el siguiente nivel
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default UserLevelBadge;
