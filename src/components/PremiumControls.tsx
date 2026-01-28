import { Star, Zap, RotateCcw, Eye, Crown, Rocket, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface PremiumControlsProps {
  onSuperLike?: () => void;
  onBoost?: () => void;
  compact?: boolean;
}

const PremiumControls = ({ onSuperLike, onBoost, compact = false }: PremiumControlsProps) => {
  const {
    limits,
    remainingSuperLikes,
    remainingBoosts,
    remainingRewinds,
    canUseSuperLike,
    canUseBoost,
    activateBoost,
    loading,
    featureEnabled,
  } = usePremiumFeatures();
  const navigate = useNavigate();
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [activatingBoost, setActivatingBoost] = useState(false);

  const handleActivateBoost = async () => {
    setActivatingBoost(true);
    const result = await activateBoost(30);
    setActivatingBoost(false);
    if (result.success) {
      setBoostDialogOpen(false);
      onBoost?.();
    }
  };

  // Don't render if all features are disabled
  const hasAnyFeature = featureEnabled.superLikes || featureEnabled.boosts || featureEnabled.rewinds;
  
  if (!hasAnyFeature) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-trueke-yellow/30">
        <CardContent className="p-3 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          {featureEnabled.superLikes && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`relative ${canUseSuperLike ? 'border-trueke-yellow text-trueke-yellow hover:bg-trueke-yellow/10' : 'opacity-50'}`}
                  disabled={!canUseSuperLike}
                  onClick={onSuperLike}
                >
                  <Star className="h-4 w-4" />
                  <span className="ml-1 text-xs">{remainingSuperLikes}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Super Likes restantes hoy</p>
              </TooltipContent>
            </Tooltip>
          )}

          {featureEnabled.boosts && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`relative ${canUseBoost ? 'border-trueke-orange text-trueke-orange hover:bg-trueke-orange/10' : 'opacity-50'}`}
                  disabled={!canUseBoost}
                  onClick={() => setBoostDialogOpen(true)}
                >
                  <Rocket className="h-4 w-4" />
                  <span className="ml-1 text-xs">{remainingBoosts}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Boosts disponibles este mes</p>
              </TooltipContent>
            </Tooltip>
          )}

          {featureEnabled.rewinds && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-trueke-green text-trueke-green"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="ml-1 text-xs">{remainingRewinds}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rewinds restantes hoy</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    );
  }

  return (
    <>
      <Card className="border-trueke-yellow/30 bg-gradient-to-br from-trueke-yellow/5 to-trueke-orange/5">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Crown className="h-5 w-5 text-trueke-yellow" />
              Poderes Premium
            </h3>
            {!limits.canSeeLikes && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-trueke-yellow"
                onClick={() => navigate("/subscription")}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Mejorar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Super Likes */}
            {featureEnabled.superLikes && (
              <div className="text-center space-y-1.5">
                <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${
                  canUseSuperLike 
                    ? 'bg-gradient-to-br from-trueke-yellow to-amber-500' 
                    : 'bg-muted'
                }`}>
                  <Star className={`h-6 w-6 ${canUseSuperLike ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-xs font-medium">Super Like</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm font-bold">{remainingSuperLikes}</span>
                  <span className="text-[10px] text-muted-foreground">/{limits.superLikesPerDay}</span>
                </div>
                <Progress value={(remainingSuperLikes / limits.superLikesPerDay) * 100} className="h-1" />
              </div>
            )}

            {/* Boosts */}
            {featureEnabled.boosts && (
              <div className="text-center space-y-1.5">
                <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${
                  canUseBoost 
                    ? 'bg-gradient-to-br from-trueke-orange to-trueke-pink' 
                    : 'bg-muted'
                }`}>
                  <Rocket className={`h-6 w-6 ${canUseBoost ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-xs font-medium">Boost</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm font-bold">{remainingBoosts}</span>
                  <span className="text-[10px] text-muted-foreground">/{limits.boostsPerMonth}</span>
                </div>
                <Progress value={(remainingBoosts / Math.max(1, limits.boostsPerMonth)) * 100} className="h-1" />
              </div>
            )}

            {/* Rewinds */}
            {featureEnabled.rewinds && (
              <div className="text-center space-y-1.5">
                <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${
                  remainingRewinds > 0 
                    ? 'bg-gradient-to-br from-trueke-green to-emerald-500' 
                    : 'bg-muted'
                }`}>
                  <RotateCcw className={`h-6 w-6 ${remainingRewinds > 0 ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-xs font-medium">Rewind</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm font-bold">{remainingRewinds}</span>
                  <span className="text-[10px] text-muted-foreground">/{limits.rewindsPerDay}</span>
                </div>
                <Progress value={(remainingRewinds / limits.rewindsPerDay) * 100} className="h-1" />
              </div>
            )}
          </div>

          {/* Ver quién te likea */}
          {featureEnabled.whoLikesMe && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-trueke-teal" />
                <span className="text-sm">Ver quién te likea</span>
              </div>
              {limits.canSeeLikes ? (
                <Badge className="bg-trueke-green text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Activo
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <Lock className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Boost Dialog */}
      <Dialog open={boostDialogOpen} onOpenChange={setBoostDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-trueke-orange" />
              Activar Boost
            </DialogTitle>
            <DialogDescription>
              Tu visibilidad aumentará x10 durante 30 minutos. Tus productos aparecerán primero en la sección HOT.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-trueke-orange/10 to-trueke-pink/10 border border-trueke-orange/20">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-trueke-orange to-trueke-pink flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Visibilidad x10</p>
                  <p className="text-sm text-muted-foreground">30 minutos de máxima exposición</p>
                </div>
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-trueke-orange to-trueke-pink hover:opacity-90 text-white"
              onClick={handleActivateBoost}
              disabled={activatingBoost || !canUseBoost}
            >
              {activatingBoost ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Rocket className="h-4 w-4 mr-2" />
              )}
              Activar Boost Ahora
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PremiumControls;
