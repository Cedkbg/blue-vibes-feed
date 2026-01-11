import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface GroupMessage {
  id: string;
  group_id: string | null;
  community_id: string | null;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface UseGroupChatOptions {
  groupId?: string;
  communityId?: string;
}

export const useGroupChat = ({ groupId, communityId }: UseGroupChatOptions) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!groupId && !communityId) return;

    setLoading(true);
    
    let query = supabase
      .from("group_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);

    if (groupId) {
      query = query.eq("group_id", groupId);
    } else if (communityId) {
      query = query.eq("community_id", communityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching group messages:", error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const userIds = new Set(data.map((m) => m.user_id));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", Array.from(userIds));

      const profileMap = new Map(
        profiles?.map((p) => [p.id, p]) || []
      );

      setMessages(
        data.map((m) => ({
          ...m,
          profile: profileMap.get(m.user_id),
        }))
      );
    } else {
      setMessages([]);
    }

    setLoading(false);
  }, [groupId, communityId]);

  const sendMessage = useCallback(
    async (content: string, mediaUrl?: string, mediaType?: string) => {
      if (!user || (!groupId && !communityId) || (!content.trim() && !mediaUrl)) return null;

      const { data, error } = await supabase
        .from("group_messages")
        .insert({
          user_id: user.id,
          group_id: groupId || null,
          community_id: communityId || null,
          content: content.trim() || "",
          media_url: mediaUrl || null,
          media_type: mediaType || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error sending message:", error);
        return null;
      }

      return data;
    },
    [user, groupId, communityId]
  );

  // Subscribe to realtime updates
  useEffect(() => {
    if (!groupId && !communityId) return;

    const channel = supabase
      .channel(`group-messages-${groupId || communityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: groupId 
            ? `group_id=eq.${groupId}` 
            : `community_id=eq.${communityId}`,
        },
        async (payload) => {
          const newMessage = payload.new as GroupMessage;
          
          // Fetch profile for the new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, display_name, username, avatar_url")
            .eq("id", newMessage.user_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMessage, profile: profile || undefined },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, communityId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    sendMessage,
    fetchMessages,
  };
};
