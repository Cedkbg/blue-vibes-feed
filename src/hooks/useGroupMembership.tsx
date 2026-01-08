import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useGroupMembership = () => {
  const { user } = useAuth();
  const [memberGroups, setMemberGroups] = useState<string[]>([]);
  const [memberCommunities, setMemberCommunities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemberships = async () => {
    if (!user) {
      setMemberGroups([]);
      setMemberCommunities([]);
      setLoading(false);
      return;
    }

    // Fetch group memberships
    const { data: groupMemberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (groupMemberships) {
      setMemberGroups(groupMemberships.map(m => m.group_id));
    }

    // Fetch community memberships
    const { data: communityMemberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);

    if (communityMemberships) {
      setMemberCommunities(communityMemberships.map(m => m.community_id));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMemberships();

    // Real-time subscriptions
    const groupChannel = supabase
      .channel("group-memberships")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members" },
        () => fetchMemberships()
      )
      .subscribe();

    const communityChannel = supabase
      .channel("community-memberships")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_members" },
        () => fetchMemberships()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(groupChannel);
      supabase.removeChannel(communityChannel);
    };
  }, [user]);

  const joinGroup = async (groupId: string) => {
    if (!user) return false;

    try {
      // Add member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: "member"
        });

      if (memberError) throw memberError;

      // Update members count
      const { data: group } = await supabase
        .from("groups")
        .select("members_count")
        .eq("id", groupId)
        .single();

      if (group) {
        await supabase
          .from("groups")
          .update({ members_count: (group.members_count || 0) + 1 })
          .eq("id", groupId);
      }

      setMemberGroups(prev => [...prev, groupId]);
      toast.success("Vous avez rejoint le groupe!");
      return true;
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Vous êtes déjà membre de ce groupe");
      } else {
        toast.error("Erreur lors de l'adhésion au groupe");
        console.error(error);
      }
      return false;
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update members count
      const { data: group } = await supabase
        .from("groups")
        .select("members_count")
        .eq("id", groupId)
        .single();

      if (group) {
        await supabase
          .from("groups")
          .update({ members_count: Math.max(0, (group.members_count || 0) - 1) })
          .eq("id", groupId);
      }

      setMemberGroups(prev => prev.filter(id => id !== groupId));
      toast.success("Vous avez quitté le groupe");
      return true;
    } catch (error) {
      toast.error("Erreur lors du départ du groupe");
      console.error(error);
      return false;
    }
  };

  const joinCommunity = async (communityId: string) => {
    if (!user) return false;

    try {
      const { error: memberError } = await supabase
        .from("community_members")
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: "member"
        });

      if (memberError) throw memberError;

      // Update members count
      const { data: community } = await supabase
        .from("communities")
        .select("members_count")
        .eq("id", communityId)
        .single();

      if (community) {
        await supabase
          .from("communities")
          .update({ members_count: (community.members_count || 0) + 1 })
          .eq("id", communityId);
      }

      setMemberCommunities(prev => [...prev, communityId]);
      toast.success("Vous avez rejoint la communauté!");
      return true;
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Vous êtes déjà membre de cette communauté");
      } else {
        toast.error("Erreur lors de l'adhésion à la communauté");
        console.error(error);
      }
      return false;
    }
  };

  const leaveCommunity = async (communityId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update members count
      const { data: community } = await supabase
        .from("communities")
        .select("members_count")
        .eq("id", communityId)
        .single();

      if (community) {
        await supabase
          .from("communities")
          .update({ members_count: Math.max(0, (community.members_count || 0) - 1) })
          .eq("id", communityId);
      }

      setMemberCommunities(prev => prev.filter(id => id !== communityId));
      toast.success("Vous avez quitté la communauté");
      return true;
    } catch (error) {
      toast.error("Erreur lors du départ de la communauté");
      console.error(error);
      return false;
    }
  };

  const isMemberOfGroup = (groupId: string) => memberGroups.includes(groupId);
  const isMemberOfCommunity = (communityId: string) => memberCommunities.includes(communityId);

  return {
    memberGroups,
    memberCommunities,
    loading,
    joinGroup,
    leaveGroup,
    joinCommunity,
    leaveCommunity,
    isMemberOfGroup,
    isMemberOfCommunity,
    refetch: fetchMemberships
  };
};
