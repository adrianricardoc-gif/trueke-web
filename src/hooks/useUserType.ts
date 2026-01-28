import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserType = "person" | "company";

export function useUserType() {
  const { user } = useAuth();
  const [userType, setUserType] = useState<UserType>("person");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserType = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        
        if (data?.user_type) {
          setUserType(data.user_type as UserType);
        }
      } catch (error) {
        console.error("Error fetching user type:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserType();
  }, [user]);

  const updateUserType = async (newType: UserType) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ user_type: newType })
        .eq("user_id", user.id);

      if (error) throw error;
      setUserType(newType);
    } catch (error) {
      console.error("Error updating user type:", error);
    }
  };

  return { userType, loading, updateUserType, isPerson: userType === "person", isCompany: userType === "company" };
}
