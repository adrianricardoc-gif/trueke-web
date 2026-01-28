import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, X, Loader2, DollarSign, Plus } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [additionalValue, setAdditionalValue] = useState("");
  const [location, setLocation] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const MAX_IMAGES = 5;
  const totalImages = existingImages.length + newImages.length;

  useEffect(() => {
    if (id && user) {
      fetchProduct();
    }
  }, [id, user]);

  const fetchProduct = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: "No se pudo cargar el producto",
        variant: "destructive",
      });
      navigate("/my-products");
      return;
    }

    if (data.user_id !== user?.id) {
      toast({
        title: "Error",
        description: "No tienes permiso para editar este producto",
        variant: "destructive",
      });
      navigate("/my-products");
      return;
    }

    setTitle(data.title);
    setDescription(data.description || "");
    setCategory(data.category);
    setEstimatedValue(data.estimated_value?.toString() || "");
    setAdditionalValue(data.additional_value?.toString() || "");
    setLocation(data.location || "");
    setExistingImages(data.images || []);
    setLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = MAX_IMAGES - totalImages;
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
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "Las imágenes deben ser menores a 5MB",
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setNewImages((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (): Promise<string[]> => {
    if (!user || newImages.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const file of newImages) {
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

    if (!user || !id) return;

    if (!title.trim() || !category || (existingImages.length + newImages.length) === 0) {
      toast({
        title: "Campos requeridos",
        description: "Completa título, categoría y al menos una imagen",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const newImageUrls = await uploadNewImages();
      const allImages = [...existingImages, ...newImageUrls];

      const { error } = await supabase
        .from("products")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          category,
          estimated_value: parseFloat(estimatedValue) || 0,
          additional_value: parseFloat(additionalValue) || 0,
          location: location.trim() || null,
          images: allImages,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "¡Producto actualizado!",
        description: "Los cambios han sido guardados",
      });

      navigate("/my-products");
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Editar Producto</h1>
          <div className="w-10" />
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-lg mx-auto">
        {/* Image Upload */}
        <div className="space-y-3">
          <Label>Fotos ({totalImages}/{MAX_IMAGES})</Label>
          <div className="grid grid-cols-3 gap-3">
            {/* Existing images */}
            {existingImages.map((url, index) => (
              <div
                key={`existing-${index}`}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-border"
              >
                <img
                  src={url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {/* New images */}
            {newImagePreviews.map((preview, index) => (
              <div
                key={`new-${index}`}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary"
              >
                <img
                  src={preview}
                  alt={`New ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {totalImages < MAX_IMAGES && (
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
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Values */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimatedValue" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Valor estimado
            </Label>
            <Input
              id="estimatedValue"
              type="number"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              placeholder="0"
              className="h-12"
              min="0"
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

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ciudad, País"
            className="h-12"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={saving}
          className="w-full h-12 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            "Guardar Cambios"
          )}
        </Button>
      </form>
    </div>
  );
};

export default EditProduct;
