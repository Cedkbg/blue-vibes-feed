import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useLikes = (postId: string, initialLikesCount: number) => {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has liked the post
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user) {
        setIsLiked(false);
        return;
      }

      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      setIsLiked(!!data);
    };

    checkLikeStatus();
  }, [postId, user]);

  // Subscribe to likes count updates
  useEffect(() => {
    const channel = supabase
      .channel(`likes-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes",
          filter: `post_id=eq.${postId}`,
        },
        async () => {
          // Refetch likes count
          const { count } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", postId);
          
          setLikesCount(count || 0);
          
          // Check if current user still likes
          if (user) {
            const { data } = await supabase
              .from("likes")
              .select("id")
              .eq("post_id", postId)
              .eq("user_id", user.id)
              .maybeSingle();
            setIsLiked(!!data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, user]);

  const toggleLike = async () => {
    if (!user || isLoading) return;

    setIsLoading(true);

    try {
      // Get post owner for notification
      const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (isLiked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        // Update post likes count
        await supabase
          .from("posts")
          .update({ likes_count: Math.max(0, likesCount - 1) })
          .eq("id", postId);

        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        // Like
        await supabase.from("likes").insert({
          post_id: postId,
          user_id: user.id,
        });

        // Update post likes count
        await supabase
          .from("posts")
          .update({ likes_count: likesCount + 1 })
          .eq("id", postId);

        // Send notification to post owner
        if (post && post.user_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: post.user_id,
            type: "like",
            content: "a aimé votre publication",
            from_user_id: user.id,
            post_id: postId,
          });
        }

        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { likesCount, isLiked, toggleLike, isLoading };
};
