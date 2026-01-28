import { Crown, Sparkles, Gem, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  planName?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "glow" | "minimal";
  showLabel?: boolean;
  className?: string;
}

const PremiumBadge = ({ 
  planName = "Premium", 
  size = "md", 
  variant = "default",
  showLabel = true,
  className 
}: PremiumBadgeProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const badgeSizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const isPro = planName.toLowerCase().includes("pro");
  const isEnterprise = planName.toLowerCase().includes("empresa");

  const getIcon = () => {
    if (isPro) return Gem;
    if (isEnterprise) return Star;
    return Crown;
  };

  const Icon = getIcon();

  const getGradientClasses = () => {
    if (isPro) {
      return "from-purple-500 via-violet-500 to-indigo-500";
    }
    if (isEnterprise) {
      return "from-trueke-orange via-trueke-yellow to-amber-400";
    }
    return "from-trueke-yellow via-amber-500 to-trueke-orange";
  };

  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className={cn(
              "rounded-full p-1 bg-gradient-to-r",
              getGradientClasses(),
              className
            )}>
              <Icon className={cn(sizeClasses[size], "text-white")} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{planName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "glow") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1",
              "bg-gradient-to-r text-white font-medium",
              getGradientClasses(),
              "shadow-lg",
              isPro ? "shadow-purple-500/30" : isEnterprise ? "shadow-trueke-yellow/30" : "shadow-trueke-orange/30",
              className
            )}>
              {/* Glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-full bg-gradient-to-r blur-md opacity-50 -z-10",
                getGradientClasses()
              )} />
              <Icon className={sizeClasses[size]} />
              {showLabel && (
                <span className={cn(
                  size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs"
                )}>
                  {planName}
                </span>
              )}
              <Sparkles className={cn(
                sizeClasses.sm,
                "animate-pulse"
              )} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Usuario {planName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default variant
  return (
    <Badge 
      className={cn(
        "bg-gradient-to-r text-white border-0 gap-1",
        getGradientClasses(),
        badgeSizeClasses[size],
        className
      )}
    >
      <Icon className={sizeClasses[size]} />
      {showLabel && planName}
    </Badge>
  );
};

export default PremiumBadge;
