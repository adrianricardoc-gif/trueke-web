import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PremiumPlan } from "@/hooks/usePremiumPlans";
import { formatCurrency } from "@/lib/utils";
import DiscountCodeInput from "./DiscountCodeInput";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PremiumPlan | null;
  onConfirm: (planId: string, discountCodeId?: string, finalPrice?: number) => Promise<void>;
  loading?: boolean;
}

const SubscriptionDialog = ({
  open,
  onOpenChange,
  plan,
  onConfirm,
  loading = false,
}: SubscriptionDialogProps) => {
  const [discountApplied, setDiscountApplied] = useState<{
    discountAmount: number;
    finalPrice: number;
    codeId: string;
  } | null>(null);

  if (!plan) return null;

  const handleConfirm = async () => {
    await onConfirm(
      plan.id,
      discountApplied?.codeId,
      discountApplied?.finalPrice
    );
    onOpenChange(false);
    setDiscountApplied(null);
  };

  const handleClose = () => {
    setDiscountApplied(null);
    onOpenChange(false);
  };

  const displayPrice = discountApplied?.finalPrice ?? plan.price;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-trueke-yellow" />
            Activar {plan.name}
          </DialogTitle>
          <DialogDescription>
            Confirma tu suscripción al plan premium
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Plan seleccionado</span>
              <span>{plan.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Precio original</span>
              <span className={discountApplied ? "line-through text-muted-foreground" : ""}>
                {formatCurrency(plan.price)}
              </span>
            </div>
            {discountApplied && (
              <div className="flex items-center justify-between text-trueke-green">
                <span className="font-medium">Precio final</span>
                <span className="font-bold">{formatCurrency(discountApplied.finalPrice)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Período</span>
              <span>{plan.billing_period === "monthly" ? "Mensual" : "Anual"}</span>
            </div>
          </div>

          {plan.price > 0 && (
            <DiscountCodeInput
              planId={plan.id}
              planPrice={plan.price}
              onDiscountApplied={(discountAmount, finalPrice, codeId) => {
                setDiscountApplied({ discountAmount, finalPrice, codeId });
              }}
              onDiscountRemoved={() => {
                setDiscountApplied(null);
              }}
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-gradient-to-r from-trueke-yellow to-trueke-orange hover:opacity-90 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {displayPrice === 0 ? "Activar Gratis" : `Pagar ${formatCurrency(displayPrice)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;
