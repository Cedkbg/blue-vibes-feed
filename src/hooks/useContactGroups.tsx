import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface ContactGroup {
  id: string;
  name: string;
  creator_id: string;
  avatar_url: string | null;
  created_at: string;
  members_count?: number;
}

interface GroupMember {
  id: string;
  user_id: string;
  added_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    phone_number: string | null;
  };
}

export const useContactGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: groupsData, error } = await supabase
        .from("contact_groups")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (groupsData) {
        // Fetch member counts
        const groupsWithCounts = await Promise.all(
          groupsData.map(async (group) => {
            const { count } = await supabase
              .from("contact_group_members")
              .select("*", { count: "exact", head: true })
              .eq("group_id", group.id);

            return { ...group, members_count: count || 0 };
          })
        );
        setGroups(groupsWithCounts);
      }
    } catch (error) {
      console.error("Error fetching contact groups:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (name: string, memberIds: string[]) => {
    if (!user) return null;

    try {
      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from("contact_groups")
        .insert({
          name,
          creator_id: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add members
      if (memberIds.length > 0) {
        const membersToInsert = memberIds.map((userId) => ({
          group_id: groupData.id,
          user_id: userId,
        }));

        const { error: membersError } = await supabase
          .from("contact_group_members")
          .insert(membersToInsert);

        if (membersError) throw membersError;
      }

      toast.success("Groupe créé avec succès");
      await fetchGroups();
      return groupData;
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Erreur lors de la création du groupe");
      return null;
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from("contact_groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;

      toast.success("Groupe supprimé");
      await fetchGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
    try {
      const { data: membersData, error } = await supabase
        .from("contact_group_members")
        .select("*")
        .eq("group_id", groupId);

      if (error) throw error;

      if (!membersData || membersData.length === 0) return [];

      // Fetch profiles
      const userIds = membersData.map((m) => m.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, phone_number")
        .in("id", userIds);

      const profilesMap = new Map();
      profilesData?.forEach((p) => profilesMap.set(p.id, p));

      return membersData.map((member) => ({
        ...member,
        profile: profilesMap.get(member.user_id),
      }));
    } catch (error) {
      console.error("Error fetching group members:", error);
      return [];
    }
  };

  const addMember = async (groupId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("contact_group_members")
        .insert({
          group_id: groupId,
          user_id: userId,
        });

      if (error) throw error;
      toast.success("Membre ajouté");
      await fetchGroups();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Ce membre est déjà dans le groupe");
      } else {
        console.error("Error adding member:", error);
        toast.error("Erreur lors de l'ajout");
      }
    }
  };

  const removeMember = async (groupId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from("contact_group_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      toast.success("Membre retiré");
      await fetchGroups();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return {
    groups,
    loading,
    createGroup,
    deleteGroup,
    getGroupMembers,
    addMember,
    removeMember,
    refetch: fetchGroups,
  };
};
