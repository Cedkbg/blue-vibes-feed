import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface LiveChatMessage {
  id: string;
  stream_id: string;
  user_id: string;
  message: string;
  is_reaction: boolean;
  reaction_type: string | null;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useLiveChat = (streamId: string | undefined) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial messages
  useEffect(() => {
    if (!streamId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("live_chat_messages")
        .select("*")
        .eq("stream_id", streamId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error fetching chat messages:", error);
      } else if (data) {
        // Fetch profiles for all unique users
        const userIds = [...new Set(data.map(m => m.user_id))];
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .in("id", userIds);

          const messagesWithProfiles = data.map(msg => ({
            ...msg,
            profile: profiles?.find(p => p.id === msg.user_id)
          }));

          setMessages(messagesWithProfiles);
        } else {
          setMessages(data);
        }
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`live_chat_${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
          filter: `stream_id=eq.${streamId}`,
        },
        async (payload) => {
          const newMessage = payload.new as LiveChatMessage;
          
          // Fetch profile for new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .eq("id", newMessage.user_id)
            .single();

          setMessages(prev => [...prev, {
            ...newMessage,
            profile: profile || undefined
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const sendMessage = useCallback(async (message: string) => {
    if (!user || !streamId || !message.trim()) return null;

    const { data, error } = await supabase
      .from("live_chat_messages")
      .insert({
        stream_id: streamId,
        user_id: user.id,
        message: message.trim(),
        is_reaction: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return null;
    }

    return data;
  }, [user, streamId]);

  const sendReaction = useCallback(async (reactionType: string) => {
    if (!user || !streamId) return null;

    const { data, error } = await supabase
      .from("live_chat_messages")
      .insert({
        stream_id: streamId,
        user_id: user.id,
        message: reactionType,
        is_reaction: true,
        reaction_type: reactionType,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending reaction:", error);
      return null;
    }

    return data;
  }, [user, streamId]);

  return {
    messages,
    loading,
    sendMessage,
    sendReaction,
  };
};
