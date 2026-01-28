import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ImageIcon, 
  Loader2, 
  Save, 
  Info, 
  Zap,
  FileImage,
  Maximize2,
  Sparkles
} from "lucide-react";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { useToast } from "@/hooks/use-toast";

interface CompressionPreset {
  name: string;
  quality: number;
  maxWidth: number;
  maxHeight: number;
  description: string;
}

const COMPRESSION_PRESETS: CompressionPreset[] = [
  {
    name: "Máxima compresión",
    quality: 0.5,
    maxWidth: 800,
    maxHeight: 800,
    description: "Archivos muy pequeños, calidad básica"
  },
  {
    name: "Balance óptimo",
    quality: 0.7,
    maxWidth: 1200,
    maxHeight: 1200,
    description: "Buena relación calidad/tamaño (recomendado)"
  },
  {
    name: "Alta calidad",
    quality: 0.85,
    maxWidth: 1600,
    maxHeight: 1600,
    description: "Mejor calidad, archivos más grandes"
  },
  {
    name: "Calidad máxima",
    quality: 0.95,
    maxWidth: 2000,
    maxHeight: 2000,
    description: "Casi sin pérdida, archivos grandes"
  },
];

export function AdminImageCompressionManager() {
  const { toast } = useToast();
  const { settings, loading, createSetting, updateSetting } = useAdminSettings();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [quality, setQuality] = useState(0.8);
  const [maxWidth, setMaxWidth] = useState(1200);
  const [maxHeight, setMaxHeight] = useState(1200);
  const [format, setFormat] = useState<string>("image/webp");

  // Load existing settings
  useEffect(() => {
    const qualitySetting = settings.find(s => s.key === "IMAGE_COMPRESSION_QUALITY");
    const widthSetting = settings.find(s => s.key === "IMAGE_MAX_WIDTH");
    const heightSetting = settings.find(s => s.key === "IMAGE_MAX_HEIGHT");
    const formatSetting = settings.find(s => s.key === "IMAGE_FORMAT");

    if (qualitySetting?.value) setQuality(parseFloat(qualitySetting.value));
    if (widthSetting?.value) setMaxWidth(parseInt(widthSetting.value, 10));
    if (heightSetting?.value) setMaxHeight(parseInt(heightSetting.value, 10));
    if (formatSetting?.value) setFormat(formatSetting.value);
  }, [settings]);

  const applyPreset = (preset: CompressionPreset) => {
    setQuality(preset.quality);
    setMaxWidth(preset.maxWidth);
    setMaxHeight(preset.maxHeight);
    toast({
      title: `Preset aplicado: ${preset.name}`,
      description: preset.description,
    });
  };

  const saveSettings = async () => {
    setSaving(true);
    
    try {
      const settingsToSave = [
        { key: "IMAGE_COMPRESSION_QUALITY", value: quality.toString(), description: "Calidad de compresión (0-1)" },
        { key: "IMAGE_MAX_WIDTH", value: maxWidth.toString(), description: "Ancho máximo de imagen en píxeles" },
        { key: "IMAGE_MAX_HEIGHT", value: maxHeight.toString(), description: "Alto máximo de imagen en píxeles" },
        { key: "IMAGE_FORMAT", value: format, description: "Formato de salida de imágenes" },
      ];

      for (const setting of settingsToSave) {
        const existing = settings.find(s => s.key === setting.key);
        if (existing) {
          await updateSetting(setting.key, setting.value);
        } else {
          await createSetting(setting.key, setting.value, setting.description, false);
        }
      }

      toast({
        title: "Configuración guardada",
        description: "Los ajustes de compresión se aplicarán a nuevas imágenes.",
      });
    } catch (error) {
      console.error("Error saving compression settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Estimate file size reduction
  const estimateReduction = () => {
    const baseReduction = (1 - quality) * 50; // Quality factor
    const sizeReduction = maxWidth <= 1200 ? 30 : maxWidth <= 1600 ? 20 : 10; // Size factor
    const formatBonus = format === "image/webp" ? 15 : 0; // WebP bonus
    
    return Math.min(90, Math.round(baseReduction + sizeReduction + formatBonus));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Compresión de Imágenes</CardTitle>
            <CardDescription>
              Optimiza las fotos subidas por usuarios para reducir espacio y mejorar carga
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Las imágenes se comprimen automáticamente al subirlas. 
            Estimación de reducción actual: <strong>~{estimateReduction()}%</strong>
          </AlertDescription>
        </Alert>

        {/* Presets */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Presets de Compresión
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {COMPRESSION_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                className="h-auto py-2 px-3 flex flex-col items-start text-left"
                onClick={() => applyPreset(preset)}
              >
                <span className="font-medium text-xs">{preset.name}</span>
                <span className="text-[10px] text-muted-foreground">{preset.description}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Quality Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Calidad de Compresión
            </Label>
            <Badge variant="secondary">{Math.round(quality * 100)}%</Badge>
          </div>
          <Slider
            value={[quality]}
            onValueChange={([value]) => setQuality(value)}
            min={0.3}
            max={1}
            step={0.05}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Más compresión</span>
            <span>Más calidad</span>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Maximize2 className="h-4 w-4" />
              Ancho máximo (px)
            </Label>
            <Input
              type="number"
              value={maxWidth}
              onChange={(e) => setMaxWidth(parseInt(e.target.value, 10) || 1200)}
              min={400}
              max={3000}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Maximize2 className="h-4 w-4 rotate-90" />
              Alto máximo (px)
            </Label>
            <Input
              type="number"
              value={maxHeight}
              onChange={(e) => setMaxHeight(parseInt(e.target.value, 10) || 1200)}
              min={400}
              max={3000}
            />
          </div>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            Formato de Salida
          </Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image/webp">
                <div className="flex items-center gap-2">
                  WebP
                  <Badge variant="secondary" className="text-[10px]">Recomendado</Badge>
                </div>
              </SelectItem>
              <SelectItem value="image/jpeg">JPEG</SelectItem>
              <SelectItem value="image/png">PNG (sin pérdida)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            WebP ofrece la mejor compresión con buena calidad. JPEG es compatible con todos los navegadores.
          </p>
        </div>

        <Separator />

        {/* Summary */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <h4 className="font-medium text-sm">Configuración actual</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Calidad:</span>{" "}
              <span className="font-medium">{Math.round(quality * 100)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Dimensión máx:</span>{" "}
              <span className="font-medium">{maxWidth}x{maxHeight}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Formato:</span>{" "}
              <span className="font-medium">{format.split("/")[1].toUpperCase()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reducción est.:</span>{" "}
              <span className="font-medium text-primary">~{estimateReduction()}%</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
