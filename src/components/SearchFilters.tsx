import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SlidersHorizontal, X, MapPin, Tag, Package, UserCircle, Building2 } from "lucide-react";
import { SortOption } from "@/components/SortFilter";
import { ProductTypeOption } from "@/components/UnifiedSearchFilters";
import { ECUADOR_CITIES, DISTANCE_OPTIONS } from "@/data/ecuadorCities";
import { formatCurrency } from "@/lib/utils";
import { useUserType } from "@/hooks/useUserType";

export type ConditionOption = "new" | "like_new" | "good" | "fair" | "used";

interface SearchFiltersProps {
  onFiltersChange: (filters: {
    location: string;
    minPrice: number;
    maxPrice: number;
    sortBy?: SortOption;
    productType?: ProductTypeOption;
    distance?: number;
    categories?: string[];
    conditions?: ConditionOption[];
  }) => void;
  showSortAndType?: boolean;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Más recientes" },
  { value: "oldest", label: "Más antiguos" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
];

const typeOptionsForPerson: { value: ProductTypeOption; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "product", label: "Productos" },
  { value: "service", label: "Servicios" },
];

const typeOptionsForCompany: { value: ProductTypeOption; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "service", label: "Servicios" },
  { value: "product", label: "Productos" },
];

const categoryOptions = [
  { value: "electronics", label: "Electrónica" },
  { value: "clothing", label: "Ropa" },
  { value: "home", label: "Hogar" },
  { value: "sports", label: "Deportes" },
  { value: "books", label: "Libros" },
  { value: "toys", label: "Juguetes" },
  { value: "vehicles", label: "Vehículos" },
  { value: "services", label: "Servicios" },
  { value: "other", label: "Otros" },
];

const conditionOptions: { value: ConditionOption; label: string }[] = [
  { value: "new", label: "Nuevo" },
  { value: "like_new", label: "Como nuevo" },
  { value: "good", label: "Bueno" },
  { value: "fair", label: "Regular" },
  { value: "used", label: "Usado" },
];

const SearchFilters = ({ onFiltersChange, showSortAndType = true }: SearchFiltersProps) => {
  const { userType, isPerson, isCompany } = useUserType();
  const [location, setLocation] = useState("all");
  const [distance, setDistance] = useState(-1);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  // Default filter based on user type: persons see products first, companies see services first
  const [productType, setProductType] = useState<ProductTypeOption>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<ConditionOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  // Get type options based on user type
  const typeOptions = isCompany ? typeOptionsForCompany : typeOptionsForPerson;

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleConditionToggle = (condition: ConditionOption) => {
    setSelectedConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleApplyFilters = () => {
    const filters: any = {
      location: location === "all" ? "" : location.trim(),
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      distance: distance,
      categories: selectedCategories,
      conditions: selectedConditions,
    };
    if (showSortAndType) {
      filters.sortBy = sortBy;
      filters.productType = productType;
    }
    onFiltersChange(filters);
    setHasActiveFilters(
      location !== "all" || 
      priceRange[0] > 0 || 
      priceRange[1] < 5000 ||
      sortBy !== "newest" ||
      productType !== "all" ||
      distance !== -1 ||
      selectedCategories.length > 0 ||
      selectedConditions.length > 0
    );
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setLocation("all");
    setDistance(-1);
    setPriceRange([0, 5000]);
    setSortBy("newest");
    setProductType("all");
    setSelectedCategories([]);
    setSelectedConditions([]);
    onFiltersChange({
      location: "",
      minPrice: 0,
      maxPrice: 5000,
      sortBy: "newest",
      productType: "all",
      distance: -1,
      categories: [],
      conditions: [],
    });
    setHasActiveFilters(false);
    setIsOpen(false);
  };

  const activeCount = [
    location !== "all",
    priceRange[0] > 0 || priceRange[1] < 5000,
    sortBy !== "newest",
    productType !== "all",
    distance !== -1,
    selectedCategories.length > 0,
    selectedConditions.length > 0,
  ].filter(Boolean).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-1.5 ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeCount > 0 && (
            <span className="ml-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-popover border shadow-lg z-50 max-h-[80vh] overflow-y-auto" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground">Filtros</h4>
              {/* User type indicator */}
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                isCompany 
                  ? "bg-secondary/20 text-secondary" 
                  : "bg-primary/20 text-primary"
              }`}>
                {isCompany ? (
                  <>
                    <Building2 className="h-3 w-3" />
                    Empresa
                  </>
                ) : (
                  <>
                    <UserCircle className="h-3 w-3" />
                    Persona
                  </>
                )}
              </span>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-auto p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Accordion type="multiple" className="w-full" defaultValue={["sort", "location"]}>
            {showSortAndType && (
              <AccordionItem value="sort">
                <AccordionTrigger className="text-sm py-2">Ordenar y Tipo</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {/* Sort */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-xs">Ordenar por</Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                      <SelectTrigger className="bg-background h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-xs">Tipo</Label>
                    <Select value={productType} onValueChange={(v) => setProductType(v as ProductTypeOption)}>
                      <SelectTrigger className="bg-background h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Categories - Multiple Selection */}
            <AccordionItem value="categories">
              <AccordionTrigger className="text-sm py-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categorías
                  {selectedCategories.length > 0 && (
                    <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {selectedCategories.length}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {categoryOptions.map((cat) => (
                    <div key={cat.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat.value}`}
                        checked={selectedCategories.includes(cat.value)}
                        onCheckedChange={() => handleCategoryToggle(cat.value)}
                      />
                      <label
                        htmlFor={`cat-${cat.value}`}
                        className="text-xs cursor-pointer"
                      >
                        {cat.label}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Condition - Multiple Selection */}
            <AccordionItem value="condition">
              <AccordionTrigger className="text-sm py-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Condición
                  {selectedConditions.length > 0 && (
                    <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {selectedConditions.length}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2">
                  {conditionOptions.map((cond) => (
                    <div key={cond.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cond-${cond.value}`}
                        checked={selectedConditions.includes(cond.value)}
                        onCheckedChange={() => handleConditionToggle(cond.value)}
                      />
                      <label
                        htmlFor={`cond-${cond.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {cond.label}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Location */}
            <AccordionItem value="location">
              <AccordionTrigger className="text-sm py-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ubicación
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {/* City */}
                <div className="space-y-2">
                  <Label className="text-foreground text-xs">Ciudad</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="bg-background h-9">
                      <SelectValue placeholder="Selecciona una ciudad" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="all">Todas las ciudades</SelectItem>
                      {ECUADOR_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Distance filter */}
                <div className="space-y-2">
                  <Label className="text-foreground text-xs">Distancia máxima</Label>
                  <Select value={distance.toString()} onValueChange={(v) => setDistance(Number(v))}>
                    <SelectTrigger className="bg-background h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTANCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Price */}
            <AccordionItem value="price">
              <AccordionTrigger className="text-sm py-2">Precio (USD)</AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-3">
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
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClearFilters}
            >
              Limpiar
            </Button>
            <Button
              className="flex-1 gradient-brand"
              onClick={handleApplyFilters}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SearchFilters;
