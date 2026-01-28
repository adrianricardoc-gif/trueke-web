import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  tournament_type: string;
  category: string | null;
  start_date: string;
  end_date: string;
  prize_trukoins: number;
  prize_description: string | null;
  min_participants: number;
  max_participants: number | null;
  status: string;
  created_at: string;
}

interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  score: number;
  trades_count: number;
  rank_position: number | null;
  joined_at: string;
}

export function useTournaments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isEnabled } = useFeatureFlags();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myParticipations, setMyParticipations] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const tournamentsEnabled = isEnabled('gamification_tournaments');

  useEffect(() => {
    if (tournamentsEnabled) {
      fetchTournaments();
      if (user) {
        fetchMyParticipations();
      }
    } else {
      setLoading(false);
    }
  }, [user, tournamentsEnabled]);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .in("status", ["upcoming", "active"])
        .order("start_date", { ascending: true });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyParticipations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("tournament_participants")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setMyParticipations(data || []);
    } catch (error) {
      console.error("Error fetching participations:", error);
    }
  };

  const joinTournament = async (tournamentId: string) => {
    if (!user || !tournamentsEnabled) return { error: "Not authenticated or disabled" };

    try {
      const { error } = await supabase.from("tournament_participants").insert({
        tournament_id: tournamentId,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "¡Te uniste al torneo!",
        description: "Compite para ganar premios increíbles",
      });

      await fetchMyParticipations();
      return { error: null };
    } catch (error) {
      console.error("Error joining tournament:", error);
      return { error };
    }
  };

  const getLeaderboard = async (tournamentId: string) => {
    try {
      const { data: participants, error } = await supabase
        .from("tournament_participants")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("score", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles for display names
      if (participants && participants.length > 0) {
        const userIds = participants.map(p => p.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const enrichedData = participants.map(p => ({
          ...p,
          profile: profileMap.get(p.user_id)
        }));

        return { data: enrichedData, error: null };
      }

      return { data: participants, error: null };
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return { data: null, error };
    }
  };

  const isParticipating = (tournamentId: string) => {
    return myParticipations.some((p) => p.tournament_id === tournamentId);
  };

  return {
    tournaments,
    myParticipations,
    loading,
    tournamentsEnabled,
    joinTournament,
    getLeaderboard,
    isParticipating,
    refetch: fetchTournaments,
  };
}
