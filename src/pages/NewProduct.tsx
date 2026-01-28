import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, X, Loader2, DollarSign, Plus, Package, Briefcase, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/hooks/useUserType";
import { useImageCompression } from "@/hooks/useImageCompression";
import { ECUADOR_CITIES } from "@/data/ecuadorCities";

const CATEGORIES = [
  "Electrónica",
  "Ropa y Accesorios",
  "Hogar y Jardín",
  "Deportes",
  "Libros y Música",
  "Juguetes",
  "Vehículos",
  "Otros",
];

const SERVICE_CATEGORIES = [
  "Diseño y Creatividad",
  "Marketing y Publicidad",
  "Tecnología y Desarrollo",
  "Consultoría",
  "Educación y Capacitación",
  "Servicios Profesionales",
  "Reparaciones",
  "Otros Servicios",
];

const MAX_IMAGES = 5;

const NewProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isCompany } = useUserType();
  const { compressMultiple, isCompressing, lastStats, formatFileSize } = useImageCompression();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("used");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [additionalValue, setAdditionalValue] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [productType, setProductType] = useState<"product" | "service">(isCompany ? "service" : "product");
  const [compressionInfo, setCompressionInfo] = useState<{ saved: string; percentage: number } | null>(null);

  // Update default product type when user type loads
  useEffect(() => {
    if (isCompany) {
      setProductType("service");
    }
  }, [isCompany]);

  const CONDITIONS = [
    { value: "new", label: "Nuevo" },
    { value: "like_new", label: "Como nuevo" },
    { value: "good", label: "Bueno" },
    { value: "fair", label: "Regular" },
    { value: "used", label: "Usado" },
  ];

  const currentCategories = productType === "service" ? SERVICE_CATEGORIES : CATEGORIES;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = MAX_IMAGES - images.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const validFiles = filesToAdd.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Archivo inválido",
          description: "Solo se permiten imágenes",
          variant: "destructive",
        });
        return false;
      }
      // Increased limit since we'll compress
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "Las imágenes deben ser menores a 10MB",
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    // Compress images
    try {
      const results = await compressMultiple(validFiles);
      const compressedFiles = results.map(r => r.file);
      
      // Calculate total savings
      const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
      const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
      const saved = totalOriginal - totalCompressed;
      const percentage = totalOriginal > 0 ? Math.round((saved / totalOriginal) * 100) : 0;
      
      if (saved > 0) {
        setCompressionInfo({ saved: formatFileSize(saved), percentage });
        toast({
          title: "Imágenes optimizadas",
          description: `Ahorraste ${formatFileSize(saved)} (${percentage}% menos)`,
        });
      }

      setImages((prev) => [...prev, ...compressedFiles]);

      // Generate previews for compressed files
      compressedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error("Error compressing images:", error);
      toast({
        title: "Error",
        description: "No se pudieron procesar las imágenes",
        variant: "destructive",
      });
    }

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user) return [];

    const uploadedUrls: string[] = [];

    for (const file of images) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (error) {
        console.error("Error uploading image:", error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields: Title, Category, Price, 1 Photo, Condition (for products), Location
    const missingFields: string[] = [];
    
    if (!title.trim()) missingFields.push("título");
    if (!category) missingFields.push("categoría");
    if (images.length === 0) missingFields.push("al menos una foto");
    if (!estimatedValue || parseFloat(estimatedValue) <= 0) missingFields.push("precio estimado");
    if (!location.trim()) missingFields.push("ubicación");
    if (productType === "product" && !condition) missingFields.push("condición");

    if (missingFields.length > 0) {
      toast({
        title: "Campos requeridos",
        description: `Completa: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const imageUrls = await uploadImages();

      if (imageUrls.length === 0) {
        throw new Error("No se pudieron subir las imágenes");
      }

      const { error } = await supabase.from("products").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        condition: productType === "service" ? null : condition,
        estimated_value: parseFloat(estimatedValue) || 0,
        additional_value: parseFloat(additionalValue) || 0,
        location: location.trim() || null,
        images: imageUrls,
        product_type: productType,
      });

      if (error) throw error;

      toast({
        title: productType === "service" ? "¡Servicio publicado!" : "¡Producto publicado!",
        description: productType === "service" 
          ? "Tu servicio ya está disponible para intercambiar" 
          : "Tu producto ya está disponible para trueke",
      });

      navigate("/");
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: "No se pudo publicar el producto",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">
            {productType === "service" ? "Nuevo Servicio" : "Nuevo Producto"}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-lg mx-auto">
        {/* Product Type Selector */}
        <div className="space-y-3">
          <Label className="text-base">¿Qué deseas publicar?</Label>
          <RadioGroup
            value={productType}
            onValueChange={(value) => {
              setProductType(value as "product" | "service");
              setCategory(""); // Reset category when type changes
            }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="product"
                id="type-product"
                className="peer sr-only"
              />
              <Label
                htmlFor="type-product"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
              >
                <Package className="h-8 w-8 mb-2" />
                <span className="font-medium">Producto</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Objetos físicos para intercambiar
                </span>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="service"
                id="type-service"
                className="peer sr-only"
              />
              <Label
                htmlFor="type-service"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-secondary [&:has([data-state=checked])]:border-secondary cursor-pointer transition-all"
              >
                <Briefcase className="h-8 w-8 mb-2" />
                <span className="font-medium">Servicio</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Servicios profesionales
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>
        {/* Image Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              Fotos ({images.length}/{MAX_IMAGES})
              {isCompressing && (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              )}
            </Label>
            {compressionInfo && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Zap className="h-3 w-3" />
                -{compressionInfo.percentage}%
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {imagePreviews.map((preview, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-border"
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {images.length < MAX_IMAGES && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Agregar</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="¿Qué estás ofreciendo?"
            className="h-12"
            maxLength={100}
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el estado, características..."
            rows={4}
            maxLength={500}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Categoría *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {currentCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Condition - Required for products */}
        {productType === "product" && (
          <div className="space-y-2">
            <Label>Condición *</Label>
            <Select value={condition} onValueChange={setCondition} required>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecciona la condición" />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((cond) => (
                  <SelectItem key={cond.value} value={cond.value}>
                    {cond.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Values */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimatedValue" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Valor estimado *
            </Label>
            <Input
              id="estimatedValue"
              type="number"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              placeholder="0"
              className="h-12"
              min="1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalValue" className="flex items-center gap-1">
              <Plus className="h-3 w-3" />
              Valor adicional
            </Label>
            <Input
              id="additionalValue"
              type="number"
              value={additionalValue}
              onChange={(e) => setAdditionalValue(e.target.value)}
              placeholder="0"
              className="h-12"
              min="0"
            />
          </div>
        </div>

        {/* Location - Required */}
        <div className="space-y-2">
          <Label htmlFor="location">Ubicación *</Label>
          <Select value={location} onValueChange={setLocation} required>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecciona tu ciudad" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {ECUADOR_CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={uploading}
          className="w-full h-12 text-base"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Publicando...
            </>
          ) : (
            productType === "service" ? "Publicar Servicio" : "Publicar Producto"
          )}
        </Button>
      </form>
    </div>
  );
};

export default NewProduct;
