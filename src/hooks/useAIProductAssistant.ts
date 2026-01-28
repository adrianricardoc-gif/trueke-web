import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface AIProductSuggestion {
  title: string;
  description: string;
  category: string;
  estimatedValue: number;
  condition: string;
  tags: string[];
}

export function useAIProductAssistant() {
  const { toast } = useToast();
  const { isEnabled } = useFeatureFlags();
  const [loading, setLoading] = useState(false);

  const generateProductDescription = async (
    title: string,
    category: string,
    imageUrls?: string[]
  ): Promise<{ description: string; error: any }> => {
    if (!isEnabled("ai_product_assistant")) {
      toast({
        variant: "destructive",
        title: "Funcionalidad desactivada",
        description: "El asistente IA no está habilitado.",
      });
      return { description: "", error: "Feature disabled" };
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke("ai-product-assistant", {
        body: {
          action: "generate_description",
          title,
          category,
          imageUrls,
        },
      });

      if (response.error) throw response.error;

      return { description: response.data.description, error: null };
    } catch (error) {
      console.error("Error generating description:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar la descripción.",
      });
      return { description: "", error };
    } finally {
      setLoading(false);
    }
  };

  const suggestPrice = async (
    title: string,
    category: string,
    condition: string,
    description?: string
  ): Promise<{ price: number; error: any }> => {
    if (!isEnabled("ai_product_assistant")) {
      return { price: 0, error: "Feature disabled" };
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke("ai-product-assistant", {
        body: {
          action: "suggest_price",
          title,
          category,
          condition,
          description,
        },
      });

      if (response.error) throw response.error;

      return { price: response.data.suggestedPrice, error: null };
    } catch (error) {
      console.error("Error suggesting price:", error);
      return { price: 0, error };
    } finally {
      setLoading(false);
    }
  };

  const analyzeProductImages = async (
    imageUrls: string[]
  ): Promise<{ analysis: any; error: any }> => {
    if (!isEnabled("ai_verification")) {
      return { analysis: null, error: "Feature disabled" };
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke("ai-product-assistant", {
        body: {
          action: "analyze_images",
          imageUrls,
        },
      });

      if (response.error) throw response.error;

      return { analysis: response.data.analysis, error: null };
    } catch (error) {
      console.error("Error analyzing images:", error);
      return { analysis: null, error };
    } finally {
      setLoading(false);
    }
  };

  const translateMessage = async (
    message: string,
    targetLanguage: string = "es"
  ): Promise<{ translation: string; error: any }> => {
    if (!isEnabled("ai_chat_translator")) {
      return { translation: message, error: "Feature disabled" };
    }

    try {
      const response = await supabase.functions.invoke("ai-product-assistant", {
        body: {
          action: "translate",
          message,
          targetLanguage,
        },
      });

      if (response.error) throw response.error;

      return { translation: response.data.translation, error: null };
    } catch (error) {
      console.error("Error translating:", error);
      return { translation: message, error };
    }
  };

  return {
    loading,
    generateProductDescription,
    suggestPrice,
    analyzeProductImages,
    translateMessage,
  };
}
