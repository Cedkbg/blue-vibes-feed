import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export const useBlockedUsers = () => {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchBlocked();
  }, [user]);

  const fetchBlocked = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await (supabase as any)
      .from("blocked_users")
      .select("id, blocked_id, created_at")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch profiles for blocked users
      const blockedIds = data.map((b: any) => b.blocked_id);
      if (blockedIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .in("id", blockedIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setBlockedUsers(data.map((b: any) => ({
          ...b,
          profile: profileMap.get(b.blocked_id),
        })));
      } else {
        setBlockedUsers([]);
      }
    }
    setLoading(false);
  };

  const blockUser = async (blockedId: string) => {
    if (!user) return;

    const { error } = await (supabase as any)
      .from("blocked_users")
      .insert({ blocker_id: user.id, blocked_id: blockedId });

    if (error) {
      if (error.code === "23505") {
        toast.info("Utilisateur déjà bloqué");
      } else {
        toast.error("Erreur lors du blocage");
      }
    } else {
      toast.success("Utilisateur bloqué");
      fetchBlocked();
    }
  };

  const unblockUser = async (blockedId: string) => {
    if (!user) return;

    const { error } = await (supabase as any)
      .from("blocked_users")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", blockedId);

    if (error) {
      toast.error("Erreur lors du déblocage");
    } else {
      toast.success("Utilisateur débloqué");
      setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId));
    }
  };

  return { blockedUsers, loading, blockUser, unblockUser, refetch: fetchBlocked };
};
