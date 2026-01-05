import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useReposts = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const repostVideo = async (postId: string, comment?: string) => {
    if (!user) {
      toast.error("Connectez-vous pour reposter");
      return false;
    }
    if (isLoading) return false;

    setIsLoading(true);

    try {
      const { error } = await supabase.from("reposts").insert({
        user_id: user.id,
        original_post_id: postId,
        comment: comment || null,
      });

      if (error) throw error;

      toast.success("Vidéo repostée sur votre fil !");
      return true;
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Erreur lors du repost");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { repostVideo, isLoading };
};
