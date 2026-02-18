import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useFollows = (targetUserId?: string) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (targetUserId) {
      checkFollowStatus();
      fetchFollowCounts();
    }
  }, [targetUserId, user]);

  const checkFollowStatus = async () => {
    if (!user || !targetUserId || user.id === targetUserId) {
      setIsFollowing(false);
      return;
    }

    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .maybeSingle();

    setIsFollowing(!!data);

    // Check pending follow request
    if (!data) {
      const { data: reqData } = await supabase
        .from("follow_requests")
        .select("status")
        .eq("requester_id", user.id)
        .eq("target_id", targetUserId)
        .eq("status", "pending")
        .maybeSingle();
      setRequestStatus(reqData?.status || null);
    } else {
      setRequestStatus(null);
    }
  };

  const fetchFollowCounts = async () => {
    if (!targetUserId) return;

    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetUserId)
      .neq("follower_id", targetUserId);

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetUserId)
      .neq("following_id", targetUserId);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  };

  const toggleFollow = async () => {
    if (!user) {
      toast.error("Connectez-vous pour vous abonner");
      return;
    }
    if (!targetUserId || user.id === targetUserId) {
      toast.error("Vous ne pouvez pas vous abonner à vous-même");
      return;
    }
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        toast.success("Désabonné");
      } else if (requestStatus === "pending") {
        // Cancel pending request
        await supabase
          .from("follow_requests")
          .delete()
          .eq("requester_id", user.id)
          .eq("target_id", targetUserId);
        setRequestStatus(null);
        toast.success("Demande annulée");
      } else {
        // Check if target account is private
        const { data: targetProfile } = await supabase
          .from("profiles_public")
          .select("is_private")
          .eq("id", targetUserId)
          .maybeSingle();

        if (targetProfile?.is_private) {
          // Send follow request
          const { error } = await supabase.from("follow_requests").insert({
            requester_id: user.id,
            target_id: targetUserId,
          });
          if (error) {
            if (error.code === "23505") {
              toast.info("Demande déjà envoyée");
            } else {
              toast.error("Erreur lors de l'envoi");
            }
          } else {
            setRequestStatus("pending");
            toast.success("Demande d'abonnement envoyée !");
          }
        } else {
          // Direct follow
          await supabase.from("follows").insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

          setIsFollowing(true);
          setFollowersCount((prev) => prev + 1);
          toast.success("Abonné !");
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowing,
    toggleFollow,
    isLoading,
    followersCount,
    followingCount,
    requestStatus,
    refetch: fetchFollowCounts,
  };
};
