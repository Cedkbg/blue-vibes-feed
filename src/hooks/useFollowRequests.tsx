import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface FollowRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export const useFollowRequests = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<FollowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from("follow_requests")
      .select("*")
      .eq("target_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const userIds = data.map((r) => r.requester_id);
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("id, display_name, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      setPendingRequests(
        data.map((r) => ({ ...r, profile: profileMap.get(r.requester_id) }))
      );
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("follow-requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follow_requests", filter: `target_id=eq.${user.id}` },
        () => fetchPendingRequests()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchPendingRequests]);

  const sendFollowRequest = async (targetId: string) => {
    if (!user) return false;
    const { error } = await supabase.from("follow_requests").insert({
      requester_id: user.id,
      target_id: targetId,
    });
    if (error) {
      if (error.code === "23505") {
        toast.info("Demande déjà envoyée");
      } else {
        toast.error("Erreur lors de l'envoi de la demande");
      }
      return false;
    }
    toast.success("Demande d'abonnement envoyée");
    return true;
  };

  const acceptRequest = async (requestId: string, requesterId: string) => {
    if (!user) return;
    // Accept request
    await supabase
      .from("follow_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);
    // Create follow
    await supabase.from("follows").insert({
      follower_id: requesterId,
      following_id: user.id,
    });
    toast.success("Demande acceptée");
    fetchPendingRequests();
  };

  const declineRequest = async (requestId: string) => {
    await supabase
      .from("follow_requests")
      .update({ status: "declined" })
      .eq("id", requestId);
    toast.success("Demande refusée");
    fetchPendingRequests();
  };

  const checkRequestStatus = async (targetId: string): Promise<string | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from("follow_requests")
      .select("status")
      .eq("requester_id", user.id)
      .eq("target_id", targetId)
      .maybeSingle();
    return data?.status || null;
  };

  const cancelRequest = async (targetId: string) => {
    if (!user) return;
    await supabase
      .from("follow_requests")
      .delete()
      .eq("requester_id", user.id)
      .eq("target_id", targetId);
    toast.success("Demande annulée");
  };

  return {
    pendingRequests,
    isLoading,
    sendFollowRequest,
    acceptRequest,
    declineRequest,
    checkRequestStatus,
    cancelRequest,
    refetch: fetchPendingRequests,
  };
};
