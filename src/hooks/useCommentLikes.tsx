import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useCommentLikes = (commentId: string) => {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLikeStatus = useCallback(async () => {
    const { count } = await supabase
      .from("comment_likes")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", commentId);
    
    setLikesCount(count || 0);

    if (user) {
      const { data } = await supabase
        .from("comment_likes")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", user.id)
        .maybeSingle();
      setIsLiked(!!data);
    }
  }, [commentId, user]);

  useEffect(() => {
    fetchLikeStatus();
  }, [fetchLikeStatus]);

  const toggleLike = async () => {
    if (!user || isLoading) return;
    setIsLoading(true);

    try {
      if (isLiked) {
        await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase.from("comment_likes").insert({
          comment_id: commentId,
          user_id: user.id,
        });
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { likesCount, isLiked, toggleLike, isLoading };
};
