import { useState, useEffect, useRef } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface IntentSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  productTitle?: string;
  disabled?: boolean;
}

const popularSearches = [
  "Computadora",
  "iPhone",
  "Bicicleta",
  "Consola",
  "Cámara",
  "Tablet",
  "Guitarra",
  "Muebles",
];

const IntentSearchBar = ({ value, onChange, productTitle, disabled }: IntentSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const { data } = await supabase
          .from("products")
          .select("title")
          .ilike("title", `%${value}%`)
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
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const showDropdown = isFocused && !disabled && (suggestions.length > 0 || value.length === 0);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={productTitle ? `¿Por qué cambiarías tu ${productTitle}?` : "¿Qué estás buscando?"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
          className={cn(
            "pl-10 pr-10 h-12 text-base rounded-xl border-2 transition-all",
            isFocused ? "border-primary ring-2 ring-primary/20" : "border-border",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {value.length === 0 ? (
            <div className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <TrendingUp className="h-3 w-3" />
                Búsquedas populares
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleSelect(search)}
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
                    onClick={() => handleSelect(suggestion)}
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
  );
};

export default IntentSearchBar;
