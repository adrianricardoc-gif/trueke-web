import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ThemeToggle = () => {
  const { theme, isDark, setThemePreference, toggleTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative overflow-hidden"
        >
          <Sun className={`h-5 w-5 transition-all duration-300 ${isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
          <Moon className={`absolute h-5 w-5 transition-all duration-300 ${isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setThemePreference("light")}
          className={theme === "light" ? "bg-accent" : ""}
        >
          <Sun className="h-4 w-4 mr-2" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setThemePreference("dark")}
          className={theme === "dark" ? "bg-accent" : ""}
        >
          <Moon className="h-4 w-4 mr-2" />
          Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setThemePreference("system")}
          className={theme === "system" ? "bg-accent" : ""}
        >
          <Monitor className="h-4 w-4 mr-2" />
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
