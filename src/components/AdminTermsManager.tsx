import { useState, useEffect } from "react";
import { FileText, Save, Eye, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AdminTermsManager = () => {
  const { user } = useAuth();
  const [terms, setTerms] = useState("");
  const [originalTerms, setOriginalTerms] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("key", "terms_and_conditions")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTerms(data.value || "");
        setOriginalTerms(data.value || "");
        setLastUpdated(data.updated_at);
      }
    } catch (error) {
      console.error("Error fetching terms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from("admin_settings")
        .select("id")
        .eq("key", "terms_and_conditions")
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("admin_settings")
          .update({ 
            value: terms,
            updated_at: new Date().toISOString()
          })
          .eq("key", "terms_and_conditions");

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("admin_settings")
          .insert({
            key: "terms_and_conditions",
            value: terms,
            description: "Términos y condiciones personalizados de la plataforma",
            is_secret: false
          });

        if (error) throw error;
      }

      setOriginalTerms(terms);
      setLastUpdated(new Date().toISOString());
      toast.success("Términos y condiciones actualizados correctamente");
    } catch (error) {
      console.error("Error saving terms:", error);
      toast.error("Error al guardar los términos");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTerms(originalTerms);
    toast.info("Cambios descartados");
  };

  const hasChanges = terms !== originalTerms;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Términos y Condiciones
            </CardTitle>
            <CardDescription>
              Edita los términos y condiciones personalizados de la plataforma
              {lastUpdated && (
                <span className="block text-xs mt-1">
                  Última actualización: {new Date(lastUpdated).toLocaleString('es-EC')}
                </span>
              )}
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Vista previa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Vista Previa - Términos y Condiciones</DialogTitle>
              </DialogHeader>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {terms ? (
                  <p className="whitespace-pre-wrap text-sm">{terms}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    No hay términos personalizados. Se mostrarán los términos por defecto.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="terms">
            Términos adicionales o personalizados
          </Label>
          <Textarea
            id="terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Escribe aquí los términos y condiciones adicionales o personalizados para tu plataforma...

Estos términos se mostrarán junto con los términos por defecto que cubren:
- Usuarios Persona y Empresa
- Sistema de intercambio (swipe)
- TruKoins y economía virtual
- Torneos y competencias
- Subastas
- Mensajería
- Puntos de encuentro
- Verificación y confianza"
            className="min-h-[300px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Estos términos se mostrarán como una sección adicional junto a los términos predeterminados de la plataforma.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {hasChanges ? (
              <span className="text-amber-500">• Tienes cambios sin guardar</span>
            ) : (
              <span className="text-green-500">✓ Sin cambios pendientes</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Descartar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTermsManager;
