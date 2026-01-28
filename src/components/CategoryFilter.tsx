import { cn } from "@/lib/utils";
import { Smartphone, Car, Home, Shirt, Dumbbell, Gamepad2, Book, Sparkles } from "lucide-react";

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

const categories = [
  { id: "all", label: "Todos", icon: Sparkles },
  { id: "tech", label: "Tech", icon: Smartphone },
  { id: "vehicles", label: "Vehículos", icon: Car },
  { id: "home", label: "Hogar", icon: Home },
  { id: "fashion", label: "Moda", icon: Shirt },
  { id: "sports", label: "Deportes", icon: Dumbbell },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "books", label: "Libros", icon: Book },
];

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all font-medium text-sm",
            selected === category.id
              ? "gradient-brand text-primary-foreground shadow-lg"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <category.icon className="h-4 w-4" />
          {category.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
