import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePresence = (userId: string | undefined) => {
  const setOnline = useCallback(async () => {
    if (!userId) return;
    
    try {
      await supabase
        .from("profiles")
        .update({ 
          is_online: true, 
          last_seen: new Date().toISOString() 
        })
        .eq("id", userId);
    } catch (error) {
      console.error("Error setting online status:", error);
    }
  }, [userId]);

  const setOffline = useCallback(async () => {
    if (!userId) return;
    
    try {
      await supabase
        .from("profiles")
        .update({ 
          is_online: false, 
          last_seen: new Date().toISOString() 
        })
        .eq("id", userId);
    } catch (error) {
      console.error("Error setting offline status:", error);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Set user as online immediately
    setOnline();

    // Use Supabase Realtime Presence for more reliable tracking
    const presenceChannel = supabase.channel(`presence-${userId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('Presence state synced:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setOnline();
      } else {
        setOffline();
      }
    };

    // Handle beforeunload - use sendBeacon for reliability
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status update
      const data = JSON.stringify({ 
        is_online: false, 
        last_seen: new Date().toISOString() 
      });
      
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
        new Blob([data], { type: 'application/json' })
      );
    };

    // Handle page focus/blur
    const handleFocus = () => setOnline();
    const handleBlur = () => setOffline();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Heartbeat to keep online status (every 30 seconds)
    const heartbeat = setInterval(setOnline, 30000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      clearInterval(heartbeat);
      setOffline();
      supabase.removeChannel(presenceChannel);
    };
  }, [userId, setOnline, setOffline]);

  return { setOnline, setOffline };
};
