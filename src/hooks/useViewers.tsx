import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Viewer {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  joined_at: string;
}

export const useViewers = (streamId: string | undefined) => {
  const { user } = useAuth();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!streamId || !user) return;

    const channel = supabase.channel(`stream-viewers:${streamId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const viewersList: Viewer[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (!viewersList.some(v => v.id === presence.user_id)) {
              viewersList.push({
                id: presence.user_id,
                display_name: presence.display_name,
                username: presence.username,
                avatar_url: presence.avatar_url,
                joined_at: presence.joined_at,
              });
            }
          });
        });
        
        setViewers(viewersList);
        setViewerCount(viewersList.length);
        
        // Update viewer count in database
        supabase
          .from("live_streams")
          .update({ viewers_count: viewersList.length })
          .eq("id", streamId)
          .then();
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Viewer joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Viewer left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        
        // Fetch current user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, username, avatar_url")
          .eq("id", user.id)
          .single();
        
        // Track this user's presence
        await channel.track({
          user_id: user.id,
          display_name: profile?.display_name || "Utilisateur",
          username: profile?.username,
          avatar_url: profile?.avatar_url,
          joined_at: new Date().toISOString(),
        });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, user]);

  return { viewers, viewerCount };
};
