import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error("Les notifications ne sont pas supportées sur ce navigateur");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast.success("Notifications activées !");
        return true;
      } else if (result === "denied") {
        toast.error("Notifications refusées");
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return;

      try {
        new Notification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...options,
        });
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    },
    [isSupported, permission]
  );

  // Subscribe to new group/community messages for logged-in user
  useEffect(() => {
    if (!user || permission !== "granted") return;

    // Subscribe to group messages
    const groupChannel = supabase
      .channel("push-group-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
        },
        async (payload) => {
          const message = payload.new as {
            id: string;
            user_id: string;
            content: string;
            group_id: string | null;
            community_id: string | null;
          };

          // Don't notify for own messages
          if (message.user_id === user.id) return;

          // Check if user is member of this group/community
          let isMember = false;
          
          if (message.group_id) {
            const { data } = await supabase
              .from("group_members")
              .select("id")
              .eq("group_id", message.group_id)
              .eq("user_id", user.id)
              .single();
            isMember = !!data;
          } else if (message.community_id) {
            const { data } = await supabase
              .from("community_members")
              .select("id")
              .eq("community_id", message.community_id)
              .eq("user_id", user.id)
              .single();
            isMember = !!data;
          }

          if (!isMember) return;

          // Get sender profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, username")
            .eq("id", message.user_id)
            .single();

          // Get group/community name
          let groupName = "Groupe";
          if (message.group_id) {
            const { data: group } = await supabase
              .from("groups")
              .select("name")
              .eq("id", message.group_id)
              .single();
            groupName = group?.name || "Groupe";
          } else if (message.community_id) {
            const { data: community } = await supabase
              .from("communities")
              .select("name")
              .eq("id", message.community_id)
              .single();
            groupName = community?.name || "Communauté";
          }

          const senderName = profile?.display_name || profile?.username || "Quelqu'un";
          
          showNotification(`${senderName} dans ${groupName}`, {
            body: message.content || "A envoyé un fichier",
            tag: `group-message-${message.id}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(groupChannel);
    };
  }, [user, permission, showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
  };
};
