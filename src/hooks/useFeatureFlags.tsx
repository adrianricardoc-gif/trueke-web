import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  is_enabled: boolean;
  category: string;
  requires_api_key: string | null;
  created_at: string;
  updated_at: string;
}

interface FeatureFlagsContextType {
  flags: Record<string, boolean>;
  allFlags: FeatureFlag[];
  loading: boolean;
  isEnabled: (featureKey: string) => boolean;
  refetch: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: {},
  allFlags: [],
  loading: true,
  isEnabled: () => false,
  refetch: async () => {},
});

export const useFeatureFlags = () => useContext(FeatureFlagsContext);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [allFlags, setAllFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;

      const flagsMap: Record<string, boolean> = {};
      (data || []).forEach((flag) => {
        flagsMap[flag.feature_key] = flag.is_enabled;
      });

      setFlags(flagsMap);
      setAllFlags(data || []);
    } catch (error) {
      console.error("Error fetching feature flags:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const isEnabled = (featureKey: string): boolean => {
    return flags[featureKey] ?? false;
  };

  return (
    <FeatureFlagsContext.Provider
      value={{
        flags,
        allFlags,
        loading,
        isEnabled,
        refetch: fetchFlags,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}
