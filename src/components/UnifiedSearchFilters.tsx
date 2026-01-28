import { useState, useEffect, useRef } from "react";
import { Search, X, SlidersHorizontal, MapPin, DollarSign, Package, TrendingUp, ChevronDown, Briefcase, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ECUADOR_CITIES } from "@/data/ecuadorCities";

export type ConditionOption = "new" | "like_new" | "good" | "fair" | "used";
export type SortOption = "newest" | "oldest" | "price_asc" | "price_desc";
export type ProductTypeOption = "all" | "product" | "service";

interface ActiveFilters {
  searchQuery: string;
  categories: string[];
  location: string;
  minPrice: number;
  maxPrice: number;
  conditions: ConditionOption[];
  sortBy: SortOption;
  productType: ProductTypeOption;
}

interface UnifiedSearchFiltersProps {
  onFiltersChange: (filters: ActiveFilters) => void;
  productTitle?: string;
  resultCount?: number;
  isLoading?: boolean;
}

// Product categories - IDs must match database values exactly
const productCategories = [
  { id: "Electrónica", label: "📱 Tech", fullLabel: "Electrónica" },
  { id: "Ropa y Accesorios", label: "👕 Ropa", fullLabel: "Ropa y Accesorios" },
  { id: "Hogar y Jardín", label: "🏠 Hogar", fullLabel: "Hogar y Jardín" },
  { id: "Deportes", label: "⚽ Deportes", fullLabel: "Deportes" },
  { id: "Libros y Música", label: "📚 Libros", fullLabel: "Libros y Música" },
  { id: "Juguetes", label: "🎮 Juguetes", fullLabel: "Juguetes" },
  { id: "Vehículos", label: "🚗 Vehículos", fullLabel: "Vehículos" },
  { id: "Otros", label: "📦 Otros", fullLabel: "Otros" },
];

// Service categories - IDs must match database values exactly
const serviceCategories = [
  { id: "Tecnología y Desarrollo", label: "💻 Desarrollo", fullLabel: "Tecnología y Desarrollo" },
  { id: "Diseño y Creatividad", label: "🎨 Diseño", fullLabel: "Diseño y Creatividad" },
  { id: "Marketing y Publicidad", label: "📢 Marketing", fullLabel: "Marketing y Publicidad" },
  { id: "Consultoría", label: "💼 Consultoría", fullLabel: "Consultoría" },
  { id: "Educación y Capacitación", label: "📚 Educación", fullLabel: "Educación y Capacitación" },
  { id: "Reparaciones", label: "🔧 Reparación", fullLabel: "Reparaciones" },
  { id: "Servicios Profesionales", label: "💼 Profesional", fullLabel: "Servicios Profesionales" },
  { id: "Otros Servicios", label: "📦 Otros", fullLabel: "Otros Servicios" },
];

const conditionOptions: { value: ConditionOption; label: string }[] = [
  { value: "new", label: "Nuevo" },
  { value: "like_new", label: "Como nuevo" },
  { value: "good", label: "Bueno" },
  { value: "fair", label: "Regular" },
  { value: "used", label: "Usado" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Más recientes" },
  { value: "oldest", label: "Más antiguos" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
];

const popularSearches = [
  "iPhone", "Computadora", "Bicicleta", "Consola", "Cámara", "Tablet", "Guitarra", "Muebles"
];

const UnifiedSearchFilters = ({ onFiltersChange, productTitle, resultCount, isLoading }: UnifiedSearchFiltersProps) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [location, setLocation] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedConditions, setSelectedConditions] = useState<ConditionOption[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [productType, setProductType] = useState<ProductTypeOption>("product");

  // Popover states
  const [priceOpen, setPriceOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const { data } = await supabase
          .from("products")
          .select("title")
          .ilike("title", `%${searchQuery}%`)
          .eq("status", "active")
          .limit(5);

        if (data) {
          const uniqueTitles = [...new Set(data.map(p => p.title))];
          setSuggestions(uniqueTitles);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange({
      searchQuery,
      categories: selectedCategories,
      location: location === "all" ? "" : location,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      conditions: selectedConditions,
      sortBy,
      productType,
    });
  }, [searchQuery, selectedCategories, location, priceRange, selectedConditions, sortBy, productType]);

  // Get current categories based on product type
  const currentCategories = productType === "service" ? serviceCategories : productCategories;

  // Clear categories when switching product type
  const handleProductTypeChange = (newType: ProductTypeOption) => {
    if (newType !== productType) {
      setSelectedCategories([]); // Clear categories when switching type
    }
    setProductType(newType);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleConditionToggle = (condition: ConditionOption) => {
    setSelectedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleSearchSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case "search":
        setSearchQuery("");
        break;
      case "category":
        if (value) setSelectedCategories(prev => prev.filter(c => c !== value));
        break;
      case "location":
        setLocation("all");
        break;
      case "price":
        setPriceRange([0, 5000]);
        break;
      case "condition":
        if (value) setSelectedConditions(prev => prev.filter(c => c !== value));
        break;
      case "sort":
        setSortBy("newest");
        break;
      case "type":
        setProductType("all");
        break;
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setLocation("all");
    setPriceRange([0, 5000]);
    setSelectedConditions([]);
    setSortBy("newest");
    setProductType("all");
  };

  // Removed all filter pills - they are redundant since selections are already visible in the UI above

  const showDropdown = isFocused && (suggestions.length > 0 || searchQuery.length === 0);

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Search Bar */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={productTitle ? `¿Por qué cambiarías tu ${productTitle}?` : "Buscar productos..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className={cn(
              "pl-10 md:pl-12 pr-10 h-11 md:h-12 text-sm md:text-base rounded-xl border-2 transition-all bg-card",
              isFocused ? "border-primary ring-2 ring-primary/20" : "border-border"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {searchQuery.length === 0 ? (
              <div className="p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <TrendingUp className="h-3 w-3" />
                  Búsquedas populares
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSearchSelect(search)}
                      className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="py-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleSearchSelect(suggestion)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Search className="h-3 w-3 text-muted-foreground" />
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Product/Service Type Toggle - Prominent with result count */}
      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
        <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">Cambiar por:</span>
        <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded-full">
          <button
            onClick={() => handleProductTypeChange("product")}
            className={cn(
              "flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all touch-manipulation",
              productType === "product"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Producto
          </button>
          <button
            onClick={() => handleProductTypeChange("service")}
            className={cn(
              "flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all touch-manipulation",
              productType === "service"
                ? "bg-secondary text-secondary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Briefcase className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Servicio
          </button>
        </div>
        
        {/* Inline Result Count - Aesthetic badge */}
        {(selectedCategories.length > 0 || searchQuery) && (
          <span className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all animate-scale-in",
            isLoading 
              ? "bg-muted text-muted-foreground"
              : resultCount === 0 
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                : "bg-trueke-green/10 text-trueke-green dark:bg-trueke-green/20"
          )}>
            {isLoading ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                Buscando...
              </>
            ) : (
              <>
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  resultCount === 0 ? "bg-amber-500" : "bg-trueke-green"
                )} />
                {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
              </>
            )}
          </span>
        )}
      </div>

      {/* Category Chips - Dynamic based on product type */}
      <ScrollArea className="w-full whitespace-nowrap -mx-1 px-1">
        <div className="flex gap-2 pb-2">
          {currentCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryToggle(cat.id)}
              className={cn(
                "px-2.5 md:px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap touch-manipulation",
                selectedCategories.includes(cat.id)
                  ? productType === "service" 
                    ? "bg-secondary text-secondary-foreground" 
                    : "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>

      {/* Quick Filters Row - Always visible */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {/* Price Filter */}
        <Popover open={priceOpen} onOpenChange={setPriceOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-1 shrink-0 h-8 md:h-9 text-xs md:text-sm touch-manipulation",
                (priceRange[0] > 0 || priceRange[1] < 5000) && "border-primary text-primary"
              )}
            >
              <DollarSign className="h-3 w-3 md:h-3.5 md:w-3.5" />
              Precio
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 bg-popover border shadow-lg z-50" align="start">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Rango de precio (USD)</h4>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={5000}
                min={0}
                step={50}
                className="py-2"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(priceRange[0])}</span>
                <span>{formatCurrency(priceRange[1])}</span>
              </div>
              <Button size="sm" className="w-full" onClick={() => setPriceOpen(false)}>
                Aplicar
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Condition Filter */}
        <Popover open={conditionOpen} onOpenChange={setConditionOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-1 shrink-0",
                selectedConditions.length > 0 && "border-primary text-primary"
              )}
            >
              <Package className="h-3 w-3" />
              Estado
              {selectedConditions.length > 0 && (
                <span className="ml-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {selectedConditions.length}
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 bg-popover border shadow-lg z-50" align="start">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Condición</h4>
              {conditionOptions.map((cond) => (
                <div key={cond.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cond-${cond.value}`}
                    checked={selectedConditions.includes(cond.value)}
                    onCheckedChange={() => handleConditionToggle(cond.value)}
                  />
                  <label htmlFor={`cond-${cond.value}`} className="text-sm cursor-pointer">
                    {cond.label}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Location Filter */}
        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-1 shrink-0",
                location !== "all" && "border-primary text-primary"
              )}
            >
              <MapPin className="h-3 w-3" />
              {location === "all" ? "Ubicación" : location}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 bg-popover border shadow-lg z-50" align="start">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Ciudad</h4>
              <Select value={location} onValueChange={(v) => { setLocation(v); setLocationOpen(false); }}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todas las ciudades" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  {ECUADOR_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Filter */}
        <Popover open={sortOpen} onOpenChange={setSortOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-1 shrink-0",
                sortBy !== "newest" && "border-primary text-primary"
              )}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Ordenar
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 bg-popover border shadow-lg z-50" align="start">
            <div className="space-y-1">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm rounded-lg transition-colors",
                    sortBy === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Removed filter pills section - selections are already visible in the controls above */}
    </div>
  );
};

export default UnifiedSearchFilters;
