import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export type SortOption = "newest" | "oldest" | "price_asc" | "price_desc";

interface SortFilterProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortOptions = [
  { value: "newest", label: "Más recientes" },
  { value: "oldest", label: "Más antiguos" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
];

const SortFilter = ({ value, onChange }: SortFilterProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px] h-10 bg-muted/50 border-0">
        <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
        <SelectValue placeholder="Ordenar" />
      </SelectTrigger>
      <SelectContent className="bg-popover border shadow-lg z-50">
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SortFilter;
