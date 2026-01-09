import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OnlineUser {
  id: string;
  is_online: boolean;
  last_seen: string | null;
}

export const usePresence = (userId: string | undefined) => {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(new Map());

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
    const presenceChannel = supabase.channel(`presence-global`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const newOnlineUsers = new Map<string, boolean>();
        
        Object.entries(state).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            newOnlineUsers.set(key, true);
          }
        });
        
        setOnlineUsers(newOnlineUsers);
        console.log('Presence state synced:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        setOnlineUsers(prev => new Map(prev).set(key, true));
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        setOnlineUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Also subscribe to profiles table for is_online changes
    const profilesChannel = supabase
      .channel('profiles-online-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const profile = payload.new as OnlineUser;
          setOnlineUsers(prev => {
            const newMap = new Map(prev);
            if (profile.is_online) {
              newMap.set(profile.id, true);
            } else {
              newMap.delete(profile.id);
            }
            return newMap;
          });
        }
      )
      .subscribe();

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
      setOffline();
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
      supabase.removeChannel(profilesChannel);
    };
  }, [userId, setOnline, setOffline]);

  const isUserOnline = useCallback((id: string) => {
    return onlineUsers.has(id);
  }, [onlineUsers]);

  return { setOnline, setOffline, onlineUsers, isUserOnline };
};
