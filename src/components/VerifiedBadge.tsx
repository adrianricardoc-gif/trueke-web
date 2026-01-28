import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const VerifiedBadge = ({ className, size = "md" }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <BadgeCheck 
          className={cn(
            "text-primary fill-primary/20 shrink-0",
            sizeClasses[size],
            className
          )} 
        />
      </TooltipTrigger>
      <TooltipContent>
        <p>Usuario verificado</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default VerifiedBadge;
