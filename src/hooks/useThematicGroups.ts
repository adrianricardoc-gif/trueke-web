import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ThematicGroup {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  creator_id: string;
  is_public: boolean;
  member_count: number;
  created_at: string;
}

interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export function useThematicGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<ThematicGroup[]>([]);
  const [myGroups, setMyGroups] = useState<ThematicGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
    if (user) {
      fetchMyGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("thematic_groups")
        .select("*")
        .eq("is_public", true)
        .order("member_count", { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    if (!user) return;

    try {
      const { data: memberships, error: memberError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      const groupIds = (memberships || []).map((m) => m.group_id);
      
      if (groupIds.length > 0) {
        const { data: groupsData, error: groupsError } = await supabase
          .from("thematic_groups")
          .select("*")
          .in("id", groupIds);

        if (groupsError) throw groupsError;
        setMyGroups(groupsData || []);
      } else {
        setMyGroups([]);
      }
    } catch (error) {
      console.error("Error fetching my groups:", error);
    }
  };

  const createGroup = async (
    name: string,
    description: string,
    category: string,
    imageUrl?: string
  ) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { data, error } = await supabase
        .from("thematic_groups")
        .insert({
          name,
          description,
          category,
          image_url: imageUrl || null,
          creator_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Join as creator/admin
      await supabase.from("group_members").insert({
        group_id: data.id,
        user_id: user.id,
        role: "admin",
      });

      toast({
        title: "Grupo creado",
        description: "Tu grupo ha sido creado exitosamente.",
      });

      await fetchGroups();
      await fetchMyGroups();
      return { data, error: null };
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el grupo.",
      });
      return { error };
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: user.id,
        role: "member",
      });

      if (error) throw error;

      // Update member count
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        await supabase
          .from("thematic_groups")
          .update({ member_count: group.member_count + 1 })
          .eq("id", groupId);
      }

      toast({
        title: "Te uniste al grupo",
      });

      await fetchMyGroups();
      await fetchGroups();
      return { error: null };
    } catch (error) {
      console.error("Error joining group:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo unir al grupo.",
      });
      return { error };
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update member count
      const group = groups.find((g) => g.id === groupId);
      if (group && group.member_count > 0) {
        await supabase
          .from("thematic_groups")
          .update({ member_count: group.member_count - 1 })
          .eq("id", groupId);
      }

      toast({
        title: "Saliste del grupo",
      });

      await fetchMyGroups();
      await fetchGroups();
      return { error: null };
    } catch (error) {
      console.error("Error leaving group:", error);
      return { error };
    }
  };

  const isMember = (groupId: string) => {
    return myGroups.some((g) => g.id === groupId);
  };

  const getGroupsByCategory = (category: string) => {
    return groups.filter((g) => g.category === category);
  };

  return {
    groups,
    myGroups,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    isMember,
    getGroupsByCategory,
    refetch: () => {
      fetchGroups();
      fetchMyGroups();
    },
  };
}
