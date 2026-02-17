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
  reply_to_id: string | null;
  created_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  reply_to?: GroupMessage;
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
        .from("profiles_public")
        .select("id, display_name, username, avatar_url")
        .in("id", Array.from(userIds));

      const profileMap = new Map(
        profiles?.map((p) => [p.id, p]) || []
      );

      // Fetch reply messages
      const replyIds = data.filter(m => m.reply_to_id).map(m => m.reply_to_id);
      let replyMap = new Map<string, GroupMessage>();
      
      if (replyIds.length > 0) {
        const { data: replies } = await supabase
          .from("group_messages")
          .select("*")
          .in("id", replyIds);
        
        if (replies) {
          for (const reply of replies) {
            replyMap.set(reply.id, {
              ...reply,
              profile: profileMap.get(reply.user_id),
            });
          }
        }
      }

      setMessages(
        data.map((m) => ({
          ...m,
          profile: profileMap.get(m.user_id),
          reply_to: m.reply_to_id ? replyMap.get(m.reply_to_id) : undefined,
        }))
      );
    } else {
      setMessages([]);
    }

    setLoading(false);
  }, [groupId, communityId]);

  const sendMessage = useCallback(
    async (content: string, mediaUrl?: string, mediaType?: string, replyToId?: string) => {
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
          reply_to_id: replyToId || null,
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

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!user) return false;

      const { error } = await supabase
        .from("group_messages")
        .delete()
        .eq("id", messageId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting message:", error);
        return false;
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      return true;
    },
    [user]
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
            .from("profiles_public")
            .select("id, display_name, username, avatar_url")
            .eq("id", newMessage.user_id)
            .single();

          // Fetch reply if exists
          let replyTo: GroupMessage | undefined;
          if (newMessage.reply_to_id) {
            const existingReply = messages.find(m => m.id === newMessage.reply_to_id);
            if (existingReply) {
              replyTo = existingReply;
            }
          }

          setMessages((prev) => [
            ...prev,
            { ...newMessage, profile: profile || undefined, reply_to: replyTo },
          ]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "group_messages",
          filter: groupId 
            ? `group_id=eq.${groupId}` 
            : `community_id=eq.${communityId}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, communityId, messages]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    sendMessage,
    deleteMessage,
    fetchMessages,
  };
};
