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
  };

  const fetchFollowCounts = async () => {
    if (!targetUserId) return;

    // Get followers count
    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetUserId);

    // Get following count
    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetUserId);

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
      } else {
        await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        toast.success("Abonné !");
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
    refetch: fetchFollowCounts 
  };
};
