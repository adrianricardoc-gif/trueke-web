import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTrukoins } from "@/hooks/useTrukoins";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface Mission {
  id: string;
  title: string;
  description: string | null;
  mission_type: string;
  action_type: string;
  target_count: number;
  reward_trukoins: number;
  reward_xp: number;
  is_active: boolean;
}

interface UserMission {
  id: string;
  user_id: string;
  mission_id: string;
  current_progress: number;
  completed_at: string | null;
  reward_claimed_at: string | null;
  assigned_at: string;
  mission?: Mission;
}

export function useMissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { earnTrukoins } = useTrukoins();
  const { isEnabled } = useFeatureFlags();
  const [dailyMissions, setDailyMissions] = useState<UserMission[]>([]);
  const [weeklyMissions, setWeeklyMissions] = useState<UserMission[]>([]);
  const [loading, setLoading] = useState(true);

  const missionsEnabled = isEnabled('gamification_missions');

  useEffect(() => {
    if (user && missionsEnabled) {
      fetchUserMissions();
    } else {
      setLoading(false);
    }
  }, [user, missionsEnabled]);

  const fetchUserMissions = async () => {
    if (!user) return;

    try {
      // First get all active missions
      const { data: missions, error: missionsError } = await supabase
        .from("missions")
        .select("*")
        .eq("is_active", true);

      if (missionsError) throw missionsError;

      // Get user's mission progress
      const { data: userMissions, error: userMissionsError } = await supabase
        .from("user_missions")
        .select("*")
        .eq("user_id", user.id);

      if (userMissionsError) throw userMissionsError;

      // Combine missions with user progress
      const today = new Date().toDateString();
      const combinedMissions = missions?.map((mission) => {
        const userMission = userMissions?.find(
          (um) => um.mission_id === mission.id
        );
        return {
          id: userMission?.id || "",
          user_id: user.id,
          mission_id: mission.id,
          current_progress: userMission?.current_progress || 0,
          completed_at: userMission?.completed_at || null,
          reward_claimed_at: userMission?.reward_claimed_at || null,
          assigned_at: userMission?.assigned_at || new Date().toISOString(),
          mission,
        };
      }) || [];

      setDailyMissions(
        combinedMissions.filter((m) => m.mission?.mission_type === "daily")
      );
      setWeeklyMissions(
        combinedMissions.filter((m) => m.mission?.mission_type === "weekly")
      );
    } catch (error) {
      console.error("Error fetching missions:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMissionProgress = async (actionType: string, count: number = 1) => {
    if (!user || !missionsEnabled) return;

    try {
      // Get missions that match this action
      const { data: missions, error } = await supabase
        .from("missions")
        .select("*")
        .eq("action_type", actionType)
        .eq("is_active", true);

      if (error) throw error;

      for (const mission of missions || []) {
        // Check if user has this mission
        const { data: existingMission } = await supabase
          .from("user_missions")
          .select("*")
          .eq("user_id", user.id)
          .eq("mission_id", mission.id)
          .maybeSingle();

        if (existingMission) {
          const newProgress = Math.min(
            existingMission.current_progress + count,
            mission.target_count
          );
          const isCompleted = newProgress >= mission.target_count;

          await supabase
            .from("user_missions")
            .update({
              current_progress: newProgress,
              completed_at: isCompleted && !existingMission.completed_at
                ? new Date().toISOString()
                : existingMission.completed_at,
            })
            .eq("id", existingMission.id);

          if (isCompleted && !existingMission.completed_at) {
            toast({
              title: "¡Misión completada!",
              description: `${mission.title} - Reclama tu recompensa`,
            });
          }
        } else {
          // Create new user mission
          await supabase.from("user_missions").insert({
            user_id: user.id,
            mission_id: mission.id,
            current_progress: count,
          });
        }
      }

      await fetchUserMissions();
    } catch (error) {
      console.error("Error updating mission progress:", error);
    }
  };

  const claimMissionReward = async (userMissionId: string, missionId: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      // Get mission details
      const { data: mission, error: missionError } = await supabase
        .from("missions")
        .select("*")
        .eq("id", missionId)
        .single();

      if (missionError) throw missionError;

      // Update user mission as claimed
      const { error } = await supabase
        .from("user_missions")
        .update({ reward_claimed_at: new Date().toISOString() })
        .eq("id", userMissionId);

      if (error) throw error;

      // Award TrueKoins
      await earnTrukoins(
        mission.reward_trukoins,
        "mission_reward",
        `Recompensa: ${mission.title}`,
        missionId
      );

      await fetchUserMissions();
      return { error: null };
    } catch (error) {
      console.error("Error claiming reward:", error);
      return { error };
    }
  };

  return {
    dailyMissions,
    weeklyMissions,
    loading,
    missionsEnabled,
    updateMissionProgress,
    claimMissionReward,
    refetch: fetchUserMissions,
  };
}
