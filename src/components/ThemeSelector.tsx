import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

interface ThemeSelectorProps {
  variant?: "default" | "compact" | "toggle";
  className?: string;
}

const ThemeSelector = ({ variant = "default", className }: ThemeSelectorProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Default to dark if no preference is set
    return (localStorage.getItem("theme") as Theme) || "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemTheme);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
    
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  if (variant === "toggle") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        className={cn("rounded-full", className)}
        title={`Tema: ${theme === "light" ? "Claro" : theme === "dark" ? "Oscuro" : "Automático"}`}
      >
        {theme === "light" && <Sun className="h-5 w-5" />}
        {theme === "dark" && <Moon className="h-5 w-5" />}
        {theme === "system" && <Monitor className="h-5 w-5" />}
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1 p-1 rounded-full bg-muted", className)}>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full",
            theme === "light" && "bg-background shadow-sm"
          )}
          onClick={() => setTheme("light")}
        >
          <Sun className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full",
            theme === "dark" && "bg-background shadow-sm"
          )}
          onClick={() => setTheme("dark")}
        >
          <Moon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full",
            theme === "system" && "bg-background shadow-sm"
          )}
          onClick={() => setTheme("system")}
        >
          <Monitor className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-muted-foreground">Apariencia</p>
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={theme === "light" ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("light")}
          className="flex flex-col gap-1 h-auto py-3"
        >
          <Sun className="h-5 w-5" />
          <span className="text-xs">Claro</span>
        </Button>
        <Button
          variant={theme === "dark" ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("dark")}
          className="flex flex-col gap-1 h-auto py-3"
        >
          <Moon className="h-5 w-5" />
          <span className="text-xs">Oscuro</span>
        </Button>
        <Button
          variant={theme === "system" ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("system")}
          className="flex flex-col gap-1 h-auto py-3"
        >
          <Monitor className="h-5 w-5" />
          <span className="text-xs">Auto</span>
        </Button>
      </div>
    </div>
  );
};

export default ThemeSelector;
