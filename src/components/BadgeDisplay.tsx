import { 
  Trophy, Award, Star, Crown, Heart, Sparkles, Package, ShieldCheck,
  LucideIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface BadgeDisplayProps {
  badges: BadgeData[];
  earnedBadgeIds: string[];
  size?: "sm" | "md" | "lg";
  showLocked?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy,
  award: Award,
  star: Star,
  crown: Crown,
  heart: Heart,
  sparkles: Sparkles,
  package: Package,
  "shield-check": ShieldCheck,
};

const BadgeDisplay = ({ 
  badges, 
  earnedBadgeIds, 
  size = "md",
  showLocked = true 
}: BadgeDisplayProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const displayBadges = showLocked 
    ? badges 
    : badges.filter(b => earnedBadgeIds.includes(b.id));

  return (
    <div className="flex flex-wrap gap-2">
      {displayBadges.map((badge) => {
        const isEarned = earnedBadgeIds.includes(badge.id);
        const Icon = iconMap[badge.icon] || Trophy;

        return (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "rounded-full flex items-center justify-center transition-all",
                  sizeClasses[size],
                  isEarned
                    ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground opacity-40"
                )}
              >
                <Icon className={iconSizeClasses[size]} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-semibold">{badge.name}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
                {!isEarned && (
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    Bloqueado
                  </Badge>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default BadgeDisplay;
