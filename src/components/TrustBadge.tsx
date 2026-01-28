import { ShieldCheck, Award, Star, Crown, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  completedTrades: number;
  isVerified: boolean;
  level: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const getTrustLevel = (completedTrades: number, isVerified: boolean, level: number) => {
  // Calculate trust score based on trades, verification, and level
  let score = 0;
  
  // Trades contribution (max 40 points)
  score += Math.min(completedTrades * 4, 40);
  
  // Verification adds 30 points
  if (isVerified) score += 30;
  
  // Level contribution (max 30 points)
  score += Math.min(level * 2, 30);

  if (score >= 80) return { tier: "elite", label: "Élite", color: "from-yellow-500 to-amber-500", icon: Crown };
  if (score >= 60) return { tier: "trusted", label: "Confiable", color: "from-green-500 to-emerald-500", icon: Star };
  if (score >= 40) return { tier: "verified", label: "Verificado", color: "from-blue-500 to-cyan-500", icon: ShieldCheck };
  if (score >= 20) return { tier: "active", label: "Activo", color: "from-purple-500 to-pink-500", icon: Award };
  return { tier: "new", label: "Nuevo", color: "from-gray-400 to-gray-500", icon: AlertTriangle };
};

const TrustBadge = ({ 
  completedTrades, 
  isVerified, 
  level,
  size = "md",
  showLabel = true 
}: TrustBadgeProps) => {
  const trust = getTrustLevel(completedTrades, isVerified, level);
  const Icon = trust.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const details = [
    `${completedTrades} truekes completados`,
    isVerified ? "✓ Identidad verificada" : "✗ Sin verificar",
    `Nivel ${level}`,
  ];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          className={cn(
            `bg-gradient-to-r ${trust.color} text-white border-0 cursor-pointer gap-1.5 shadow-md hover:shadow-lg transition-shadow`,
            sizeClasses[size]
          )}
        >
          <Icon className={iconSizes[size]} />
          {showLabel && <span className="font-semibold">{trust.label}</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="bg-popover border shadow-lg">
        <div className="text-center space-y-1">
          <p className="font-semibold text-foreground">Nivel de Confianza: {trust.label}</p>
          <div className="text-xs text-muted-foreground space-y-0.5">
            {details.map((detail, i) => (
              <p key={i}>{detail}</p>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default TrustBadge;
