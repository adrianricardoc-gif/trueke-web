import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ThemePreference = "light" | "dark" | "system";

export function useTheme() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme to document
  const applyTheme = useCallback((preference: ThemePreference) => {
    let shouldBeDark = false;

    if (preference === "system") {
      shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      shouldBeDark = preference === "dark";
    }

    setIsDark(shouldBeDark);

    // Apply with smooth transition
    document.documentElement.style.transition = "background-color 0.3s ease, color 0.3s ease";
    
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Remove transition after animation completes
    setTimeout(() => {
      document.documentElement.style.transition = "";
    }, 300);
  }, []);

  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      // First check localStorage for immediate theme application
      const savedTheme = localStorage.getItem("theme") as ThemePreference | null;
      
      if (savedTheme) {
        setTheme(savedTheme);
        applyTheme(savedTheme);
      }

      // If user is logged in, try to get preference from profile
      if (user) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("theme_preference")
            .eq("user_id", user.id)
            .single();

          if (data?.theme_preference) {
            const profileTheme = data.theme_preference as ThemePreference;
            setTheme(profileTheme);
            applyTheme(profileTheme);
            localStorage.setItem("theme", profileTheme);
          }
        } catch (error) {
          console.error("Error loading theme preference:", error);
        }
      }

      setIsLoading(false);
    };

    loadTheme();
  }, [user, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  // Update theme preference
  const setThemePreference = useCallback(async (preference: ThemePreference) => {
    setTheme(preference);
    applyTheme(preference);
    localStorage.setItem("theme", preference);

    // Save to profile if user is logged in
    if (user) {
      try {
        await supabase
          .from("profiles")
          .update({ theme_preference: preference })
          .eq("user_id", user.id);
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    }
  }, [user, applyTheme]);

  // Toggle between light and dark (skips system)
  const toggleTheme = useCallback(() => {
    const newTheme = isDark ? "light" : "dark";
    setThemePreference(newTheme);
  }, [isDark, setThemePreference]);

  return {
    theme,
    isDark,
    isLoading,
    setThemePreference,
    toggleTheme,
  };
}
