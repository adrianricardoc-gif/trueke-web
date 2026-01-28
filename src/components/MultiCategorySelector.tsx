import { cn } from "@/lib/utils";
import { Smartphone, Car, Home, Shirt, Dumbbell, Gamepad2, Book, Sparkles, X } from "lucide-react";

interface MultiCategorySelectorProps {
  selected: string[];
  onSelect: (categories: string[]) => void;
}

const categories = [
  { id: "tech", label: "Tech", icon: Smartphone },
  { id: "vehicles", label: "Vehículos", icon: Car },
  { id: "home", label: "Hogar", icon: Home },
  { id: "fashion", label: "Moda", icon: Shirt },
  { id: "sports", label: "Deportes", icon: Dumbbell },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "books", label: "Libros", icon: Book },
];

const MultiCategorySelector = ({ selected, onSelect }: MultiCategorySelectorProps) => {
  const handleToggle = (categoryId: string) => {
    if (selected.includes(categoryId)) {
      // Remove from selection
      onSelect(selected.filter(id => id !== categoryId));
    } else {
      // Add to selection (order matters - new ones go at the end)
      onSelect([...selected, categoryId]);
    }
  };

  const clearAll = () => {
    onSelect([]);
  };

  const getOrder = (categoryId: string) => {
    const index = selected.indexOf(categoryId);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Categorías {selected.length > 0 && `(${selected.length})`}
        </span>
        {selected.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* "All" option - shows when nothing selected */}
        <button
          onClick={clearAll}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium text-sm shrink-0",
            selected.length === 0
              ? "gradient-brand text-primary-foreground shadow-lg"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Todos
        </button>

        {categories.map((category) => {
          const order = getOrder(category.id);
          const isSelected = order !== null;
          
          return (
            <button
              key={category.id}
              onClick={() => handleToggle(category.id)}
              className={cn(
                "relative flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium text-sm shrink-0",
                isSelected
                  ? "gradient-brand text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {isSelected && (
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shadow-md">
                  {order}
                </span>
              )}
              <category.icon className="h-4 w-4" />
              {category.label}
            </button>
          );
        })}
      </div>
      
      {selected.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Prioridad: {selected.map((id, i) => {
            const cat = categories.find(c => c.id === id);
            return cat ? `${i + 1}. ${cat.label}` : null;
          }).filter(Boolean).join(" → ")}
        </p>
      )}
    </div>
  );
};

export default MultiCategorySelector;
