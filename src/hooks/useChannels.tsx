import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Channel {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  category: string | null;
  subscribers_count: number;
  is_verified: boolean;
  created_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export const useChannels = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [subscribedChannelIds, setSubscribedChannelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    try {
      const { data: channelsData, error } = await supabase
        .from("channels")
        .select("*")
        .order("subscribers_count", { ascending: false });

      if (error) throw error;

      if (channelsData && channelsData.length > 0) {
        // Fetch profiles for channel owners
        const userIds = [...new Set(channelsData.map((c) => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .in("id", userIds);

        const channelsWithProfiles = channelsData.map((channel) => ({
          ...channel,
          profile: profiles?.find((p) => p.id === channel.user_id),
        }));

        setChannels(channelsWithProfiles);
      } else {
        setChannels([]);
      }

      // Fetch user subscriptions
      if (user) {
        const { data: subs } = await supabase
          .from("channel_subscribers")
          .select("channel_id")
          .eq("user_id", user.id);
        
        setSubscribedChannelIds(subs?.map((s) => s.channel_id) || []);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("channels-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channels",
        },
        () => {
          fetchChannels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchChannels]);

  const createChannel = async (name: string, description?: string, category?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("channels")
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          category: category || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating channel:", error);
      return null;
    }
  };

  const subscribeToChannel = async (channelId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase.from("channel_subscribers").insert({
        channel_id: channelId,
        user_id: user.id,
      });

      if (error) throw error;
      setSubscribedChannelIds((prev) => [...prev, channelId]);

      // Update subscriber count
      const channel = channels.find((c) => c.id === channelId);
      if (channel) {
        await supabase
          .from("channels")
          .update({ subscribers_count: channel.subscribers_count + 1 })
          .eq("id", channelId);
      }

      return true;
    } catch (error) {
      console.error("Error subscribing to channel:", error);
      return false;
    }
  };

  const unsubscribeFromChannel = async (channelId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("channel_subscribers")
        .delete()
        .eq("channel_id", channelId)
        .eq("user_id", user.id);

      if (error) throw error;
      setSubscribedChannelIds((prev) => prev.filter((id) => id !== channelId));

      // Update subscriber count
      const channel = channels.find((c) => c.id === channelId);
      if (channel && channel.subscribers_count > 0) {
        await supabase
          .from("channels")
          .update({ subscribers_count: channel.subscribers_count - 1 })
          .eq("id", channelId);
      }

      return true;
    } catch (error) {
      console.error("Error unsubscribing from channel:", error);
      return false;
    }
  };

  const deleteChannel = async (channelId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("channels")
        .delete()
        .eq("id", channelId)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting channel:", error);
      return false;
    }
  };

  return {
    channels,
    subscribedChannelIds,
    loading,
    createChannel,
    subscribeToChannel,
    unsubscribeFromChannel,
    deleteChannel,
    refetch: fetchChannels,
  };
};
