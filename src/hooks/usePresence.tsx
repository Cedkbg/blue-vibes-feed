import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePresence = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    // Set user as online
    const setOnline = async () => {
      await supabase
        .from("profiles")
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq("id", userId);
    };

    // Set user as offline
    const setOffline = async () => {
      await supabase
        .from("profiles")
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq("id", userId);
    };

    setOnline();

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setOnline();
      } else {
        setOffline();
      }
    };

    // Handle beforeunload
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
        JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Heartbeat to keep online status
    const heartbeat = setInterval(setOnline, 60000); // Every minute

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(heartbeat);
      setOffline();
    };
  }, [userId]);
};
