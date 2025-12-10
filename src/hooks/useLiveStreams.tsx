import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface LiveStream {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_live: boolean;
  viewers_count: number;
  started_at: string;
  ended_at: string | null;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export const useLiveStreams = () => {
  const { user } = useAuth();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [myStream, setMyStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch live streams
  useEffect(() => {
    const fetchLiveStreams = async () => {
      const { data, error } = await supabase
        .from("live_streams")
        .select("*")
        .eq("is_live", true)
        .order("viewers_count", { ascending: false });

      if (error) {
        console.error("Error fetching live streams:", error);
      } else if (data) {
        // Fetch profiles for streamers
        const userIds = [...new Set(data.map(s => s.user_id))];
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name, username, avatar_url")
            .in("id", userIds);

          const streamsWithProfiles = data.map(stream => ({
            ...stream,
            profile: profiles?.find(p => p.id === stream.user_id)
          }));

          setLiveStreams(streamsWithProfiles);
          
          if (user) {
            const userStream = streamsWithProfiles.find(s => s.user_id === user.id);
            setMyStream(userStream || null);
          }
        } else {
          setLiveStreams(data);
        }
      }
      setLoading(false);
    };

    fetchLiveStreams();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("live_streams_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_streams",
        },
        async () => {
          // Refetch all live streams when any change happens
          fetchLiveStreams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const startStream = async (title: string, description?: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("live_streams")
      .insert({
        user_id: user.id,
        title,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error starting stream:", error);
      return null;
    }

    setMyStream(data);
    return data;
  };

  const endStream = async () => {
    if (!user || !myStream) return;

    await supabase
      .from("live_streams")
      .update({
        is_live: false,
        ended_at: new Date().toISOString(),
      })
      .eq("id", myStream.id);

    setMyStream(null);
  };

  const joinStream = async (streamId: string) => {
    // Increment viewers count
    const stream = liveStreams.find(s => s.id === streamId);
    if (stream) {
      await supabase
        .from("live_streams")
        .update({ viewers_count: stream.viewers_count + 1 })
        .eq("id", streamId);
    }
  };

  const leaveStream = async (streamId: string) => {
    // Decrement viewers count
    const stream = liveStreams.find(s => s.id === streamId);
    if (stream && stream.viewers_count > 0) {
      await supabase
        .from("live_streams")
        .update({ viewers_count: Math.max(0, stream.viewers_count - 1) })
        .eq("id", streamId);
    }
  };

  return {
    liveStreams,
    myStream,
    loading,
    startStream,
    endStream,
    joinStream,
    leaveStream,
  };
};
