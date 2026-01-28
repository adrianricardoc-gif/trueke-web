import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProductSearchProps {
  onSearch: (query: string) => void;
}

const ProductSearch = ({ onSearch }: ProductSearchProps) => {
  const [query, setQuery] = useState("");

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Buscar productos..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-10 pr-10 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ProductSearch;
