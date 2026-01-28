import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIProductAssistant } from "@/hooks/useAIProductAssistant";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Bot, Sparkles, DollarSign, Loader2 } from "lucide-react";

interface AIProductAssistantProps {
  title: string;
  category: string;
  condition: string;
  onDescriptionGenerated?: (description: string) => void;
  onPriceSuggested?: (price: number) => void;
}

export function AIProductAssistant({
  title,
  category,
  condition,
  onDescriptionGenerated,
  onPriceSuggested,
}: AIProductAssistantProps) {
  const { isEnabled } = useFeatureFlags();
  const { loading, generateProductDescription, suggestPrice } = useAIProductAssistant();
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);

  if (!isEnabled("ai_product_assistant")) {
    return null;
  }

  const handleGenerateDescription = async () => {
    if (!title || !category) return;

    const { description, error } = await generateProductDescription(title, category);
    if (!error && description) {
      setGeneratedDescription(description);
      onDescriptionGenerated?.(description);
    }
  };

  const handleSuggestPrice = async () => {
    if (!title || !category || !condition) return;

    const { price, error } = await suggestPrice(title, category, condition);
    if (!error && price > 0) {
      setSuggestedPrice(price);
      onPriceSuggested?.(price);
    }
  };

  return (
    <Card className="border-dashed border-primary/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-primary" />
          Asistente IA
        </CardTitle>
        <CardDescription>
          Usa IA para mejorar tu publicación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateDescription}
            disabled={loading || !title || !category}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generar Descripción
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSuggestPrice}
            disabled={loading || !title || !category || !condition}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            Sugerir Precio
          </Button>
        </div>

        {generatedDescription && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descripción generada:</Label>
            <Textarea
              value={generatedDescription}
              readOnly
              className="min-h-[100px] bg-muted/50"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDescriptionGenerated?.(generatedDescription)}
            >
              Usar esta descripción
            </Button>
          </div>
        )}

        {suggestedPrice !== null && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Precio sugerido</p>
              <p className="text-lg font-bold text-primary">${suggestedPrice.toFixed(2)}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="ml-auto"
              onClick={() => onPriceSuggested?.(suggestedPrice)}
            >
              Usar precio
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
