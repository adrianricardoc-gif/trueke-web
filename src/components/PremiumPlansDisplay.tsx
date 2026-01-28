import { useState } from "react";
import { Check, Crown, Building2, UserCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePremiumPlans, PremiumPlan } from "@/hooks/usePremiumPlans";
import { useUserType } from "@/hooks/useUserType";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import SubscriptionDialog from "./SubscriptionDialog";
import { useDiscountCodes } from "@/hooks/useDiscountCodes";

interface PremiumPlansDisplayProps {
  onSubscribe?: (planId: string) => void;
}

const PremiumPlansDisplay = ({ onSubscribe }: PremiumPlansDisplayProps) => {
  const { plans, userSubscription, loading, subscribeToPlan, getPlansForUserType, isPremium } = usePremiumPlans();
  const { userType } = useUserType();
  const { recordUsage } = useDiscountCodes();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  const relevantPlans = getPlansForUserType(userType);

  const handlePlanClick = (plan: PremiumPlan) => {
    if (onSubscribe) {
      onSubscribe(plan.id);
    } else {
      setSelectedPlan(plan);
      setDialogOpen(true);
    }
  };

  const handleConfirmSubscription = async (planId: string, discountCodeId?: string, finalPrice?: number) => {
    setSubscribing(true);
    try {
      const result = await subscribeToPlan(planId);
      
      // Record discount code usage if applied
      if (!result.error && discountCodeId && finalPrice !== undefined && selectedPlan) {
        await recordUsage(discountCodeId, selectedPlan.price - finalPrice);
      }
    } finally {
      setSubscribing(false);
    }
  };

  const isCurrentPlan = (plan: PremiumPlan) => {
    return userSubscription?.plan_id === plan.id;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="h-5 w-5 text-trueke-yellow" />
        <h2 className="text-lg font-semibold">Planes Premium</h2>
        {isPremium && (
          <Badge className="bg-gradient-to-r from-trueke-yellow to-trueke-orange text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            Premium Activo
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {relevantPlans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative overflow-hidden transition-all ${
              isCurrentPlan(plan) 
                ? "border-primary ring-2 ring-primary/20" 
                : plan.price > 0 
                  ? "border-trueke-yellow/50 hover:border-trueke-yellow"
                  : ""
            }`}
          >
            {plan.price > 0 && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-trueke-yellow to-trueke-orange text-white text-xs px-3 py-1 rounded-bl-lg">
                Premium
              </div>
            )}
            
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {plan.target_user_type === "company" ? (
                  <Building2 className="h-5 w-5 text-secondary" />
                ) : (
                  <UserCircle className="h-5 w-5 text-primary" />
                )}
                <CardTitle className="text-base">{plan.name}</CardTitle>
              </div>
              {plan.description && (
                <CardDescription>{plan.description}</CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                  {plan.price === 0 ? "Gratis" : formatCurrency(plan.price)}
                </span>
                {plan.price > 0 && (
                  <span className="text-muted-foreground text-sm">/{plan.billing_period === "monthly" ? "mes" : "año"}</span>
                )}
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-trueke-green shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.price > 0 
                    ? "bg-gradient-to-r from-trueke-yellow to-trueke-orange hover:opacity-90 text-white" 
                    : ""
                }`}
                variant={plan.price > 0 ? "default" : "outline"}
                disabled={isCurrentPlan(plan)}
                onClick={() => handlePlanClick(plan)}
              >
                {isCurrentPlan(plan) 
                  ? "Plan Actual" 
                  : plan.price > 0 
                    ? "Activar Premium" 
                    : "Seleccionar"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <SubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={selectedPlan}
        onConfirm={handleConfirmSubscription}
        loading={subscribing}
      />
    </div>
  );
};

export default PremiumPlansDisplay;
