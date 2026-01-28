import { useState } from "react";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDiscountCodes } from "@/hooks/useDiscountCodes";
import { formatCurrency } from "@/lib/utils";

interface DiscountCodeInputProps {
  planId: string;
  planPrice: number;
  onDiscountApplied: (discountAmount: number, finalPrice: number, codeId: string) => void;
  onDiscountRemoved: () => void;
}

const DiscountCodeInput = ({ 
  planId, 
  planPrice, 
  onDiscountApplied, 
  onDiscountRemoved 
}: DiscountCodeInputProps) => {
  const { validateCode } = useDiscountCodes();
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [appliedCode, setAppliedCode] = useState<{
    code: string;
    discountAmount: number;
    finalPrice: number;
    codeId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) return;

    setValidating(true);
    setError(null);

    const result = await validateCode(code, planId, planPrice);

    if (result.valid && result.code) {
      setAppliedCode({
        code: result.code.code,
        discountAmount: result.discountAmount!,
        finalPrice: result.finalPrice!,
        codeId: result.code.id,
      });
      onDiscountApplied(result.discountAmount!, result.finalPrice!, result.code.id);
    } else {
      setError(result.error || "Código no válido");
    }

    setValidating(false);
  };

  const handleRemove = () => {
    setAppliedCode(null);
    setCode("");
    setError(null);
    onDiscountRemoved();
  };

  if (appliedCode) {
    return (
      <div className="p-3 rounded-lg bg-trueke-green/10 border border-trueke-green/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-trueke-green" />
            <span className="font-mono font-bold text-trueke-green">{appliedCode.code}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Descuento aplicado:</span>
          <span className="font-bold text-trueke-green">-{formatCurrency(appliedCode.discountAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Precio final:</span>
          <span className="font-bold">{formatCurrency(appliedCode.finalPrice)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Código de descuento"
            className="pl-10 uppercase"
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          />
        </div>
        <Button 
          onClick={handleValidate}
          disabled={validating || !code.trim()}
          variant="outline"
        >
          {validating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Aplicar"
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default DiscountCodeInput;
