import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useFavorites = (postId: string) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) {
        setIsFavorited(false);
        return;
      }

      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      setIsFavorited(!!data);
    };

    checkFavoriteStatus();
  }, [postId, user]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Connectez-vous pour enregistrer");
      return;
    }
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isFavorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        setIsFavorited(false);
        toast.success("Retiré des favoris");
      } else {
        await supabase.from("favorites").insert({
          post_id: postId,
          user_id: user.id,
        });

        setIsFavorited(true);
        toast.success("Ajouté aux favoris");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return { isFavorited, toggleFavorite, isLoading };
};
