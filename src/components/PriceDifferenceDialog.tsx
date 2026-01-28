import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  X, 
  DollarSign, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Coins,
  HandCoins,
  Wallet,
  Plus,
  Minus
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PriceDifferenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (additionalAmount: number, direction: "offer" | "request") => void;
  myProductValue: number;
  theirProductValue: number;
  myProductTitle: string;
  theirProductTitle: string;
  myProductImage?: string;
  theirProductImage?: string;
  myProductId?: string;
  theirProductId?: string;
  theirUserId?: string;
}

export const PriceDifferenceDialog = ({
  isOpen,
  onClose,
  onConfirm,
  myProductValue,
  theirProductValue,
  myProductTitle,
  theirProductTitle,
  myProductImage,
  theirProductImage,
  myProductId,
  theirProductId,
  theirUserId,
}: PriceDifferenceDialogProps) => {
  const { user } = useAuth();
  const priceDifference = theirProductValue - myProductValue;
  const absDifference = Math.abs(priceDifference);
  const iNeedToPay = priceDifference > 0;
  
  const [additionalAmount, setAdditionalAmount] = useState(0);
  const [direction, setDirection] = useState<"offer" | "request">(iNeedToPay ? "offer" : "request");
  const [saving, setSaving] = useState(false);

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setAdditionalAmount(Math.round(absDifference * 0.5)); // Start at 50% of difference
      setDirection(iNeedToPay ? "offer" : "request");
    }
  }, [isOpen, absDifference, iNeedToPay]);

  const handleConfirm = async () => {
    // Save to partial_trade_offers if there's a meaningful amount
    if (additionalAmount > 0 && user && theirUserId && myProductId) {
      setSaving(true);
      try {
        await supabase.from("partial_trade_offers").insert({
          sender_id: user.id,
          receiver_id: theirUserId,
          product_id: myProductId,
          trukoin_amount: additionalAmount,
          percentage_product: 100,
          message: direction === "offer" 
            ? `Ofrezco ${formatCurrency(additionalAmount)} adicionales`
            : `Solicito ${formatCurrency(additionalAmount)} adicionales`,
          status: "pending",
        });
      } catch (error) {
        console.error("Error saving partial trade offer:", error);
      }
      setSaving(false);
    }

    onConfirm(additionalAmount, direction);
    onClose();
  };

  const handleSkip = () => {
    onConfirm(0, "offer");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Bottom Sheet / Dialog */}
        <motion.div
          className="relative w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden safe-area-inset-bottom"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Handle bar for mobile */}
          <div className="flex justify-center pt-3 pb-2 sm:hidden">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="px-5 pb-4 pt-2 sm:pt-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Ajustar diferencia
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Products comparison */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 mb-4">
              {/* My product */}
              <div className="flex-1 text-center">
                <div className="relative mx-auto w-16 h-16 rounded-xl overflow-hidden bg-muted mb-2">
                  {myProductImage ? (
                    <img src={myProductImage} alt={myProductTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mb-1">Tu producto</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(myProductValue)}</p>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  priceDifference > 0 
                    ? "bg-destructive/10 text-destructive" 
                    : priceDifference < 0 
                    ? "bg-trueke-green/10 text-trueke-green" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {priceDifference === 0 ? "Igual" : priceDifference > 0 ? `-${formatCurrency(absDifference)}` : `+${formatCurrency(absDifference)}`}
                </div>
              </div>

              {/* Their product */}
              <div className="flex-1 text-center">
                <div className="relative mx-auto w-16 h-16 rounded-xl overflow-hidden bg-muted mb-2">
                  {theirProductImage ? (
                    <img src={theirProductImage} alt={theirProductTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mb-1">Su producto</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(theirProductValue)}</p>
              </div>
            </div>

            {/* Explanation */}
            <div className={`p-3 rounded-xl mb-4 ${
              iNeedToPay ? "bg-amber-500/10 border border-amber-500/20" : "bg-trueke-green/10 border border-trueke-green/20"
            }`}>
              <div className="flex items-start gap-2">
                {iNeedToPay ? (
                  <TrendingUp className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-trueke-green shrink-0 mt-0.5" />
                )}
                <p className="text-sm text-foreground">
                  {iNeedToPay 
                    ? `Su producto vale ${formatCurrency(absDifference)} más. Puedes ofrecer dinero adicional para equilibrar.`
                    : `Tu producto vale ${formatCurrency(absDifference)} más. Puedes pedir dinero adicional a cambio.`
                  }
                </p>
              </div>
            </div>

            {/* Amount selector with +/- buttons */}
            {absDifference > 0 && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {iNeedToPay ? "Quiero ofrecer:" : "Quiero recibir:"}
                  </span>
                </div>

                {/* +/- Buttons for price adjustment */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full border-2 border-muted-foreground/30 hover:border-destructive hover:bg-destructive/10"
                    onClick={() => setAdditionalAmount(Math.max(0, additionalAmount - 5))}
                    disabled={additionalAmount <= 0}
                  >
                    <Minus className="h-6 w-6" />
                  </Button>
                  
                  <div className="flex items-center gap-1 px-6 py-3 rounded-2xl bg-primary/10 min-w-[140px] justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold text-primary">{additionalAmount}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10"
                    onClick={() => setAdditionalAmount(Math.min(Math.round(absDifference * 1.5), additionalAmount + 5))}
                    disabled={additionalAmount >= Math.round(absDifference * 1.5)}
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Sugerido: {formatCurrency(absDifference)} • Máximo: {formatCurrency(Math.round(absDifference * 1.5))}
                </p>

                {/* Quick amount buttons */}
                <div className="flex gap-2">
                  {[0, 0.5, 1].map((multiplier) => {
                    const amount = Math.round(absDifference * multiplier);
                    return (
                      <Button
                        key={multiplier}
                        variant={additionalAmount === amount ? "default" : "outline"}
                        size="sm"
                        className={`flex-1 h-10 rounded-xl ${
                          additionalAmount === amount ? "gradient-brand text-white" : ""
                        }`}
                        onClick={() => setAdditionalAmount(amount)}
                      >
                        {multiplier === 0 ? "Nada" : multiplier === 0.5 ? "Mitad" : "Total"}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1 h-12 rounded-xl"
              >
                Sin dinero
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 h-12 rounded-xl gradient-brand text-white"
              >
                <HandCoins className="h-4 w-4 mr-2" />
                {saving 
                  ? "Guardando..." 
                  : additionalAmount > 0 
                    ? (iNeedToPay ? `Ofrecer ${formatCurrency(additionalAmount)}` : `Pedir ${formatCurrency(additionalAmount)}`)
                    : "Continuar"
                }
              </Button>
            </div>

            {/* Info text */}
            <p className="text-xs text-center text-muted-foreground mt-4">
              El otro usuario verá tu propuesta y podrá aceptarla o negociar
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PriceDifferenceDialog;
