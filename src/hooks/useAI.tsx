import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);

  const generateCaption = useCallback(async (theme?: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action: "generate_caption", text: theme },
      });
      if (error) throw error;
      return data?.result || null;
    } catch (e: any) {
      console.error("AI caption error:", e);
      toast.error("Erreur lors de la génération IA");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const translateText = useCallback(async (text: string, language: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action: "translate", text, language },
      });
      if (error) throw error;
      return data?.result || null;
    } catch (e: any) {
      console.error("AI translate error:", e);
      toast.error("Erreur de traduction");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const improveText = useCallback(async (text: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action: "improve_text", text },
      });
      if (error) throw error;
      return data?.result || null;
    } catch (e: any) {
      console.error("AI improve error:", e);
      toast.error("Erreur d'amélioration IA");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generateCaption, translateText, improveText, isLoading };
};
