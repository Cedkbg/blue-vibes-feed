import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { playNotificationSound } from "@/utils/sounds";

export interface Notification {
  id: string;
  user_id: string;
  type: "like" | "comment" | "follow" | "message" | "live";
  content: string;
  from_user_id: string | null;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
  from_profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
      } else if (data) {
        // Fetch from_user profiles
        const fromUserIds = [...new Set(data.filter(n => n.from_user_id).map(n => n.from_user_id))];
        
        if (fromUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles_public")
            .select("id, display_name, username, avatar_url")
            .in("id", fromUserIds as string[]);

          const notificationsWithProfiles = data.map(notification => ({
            ...notification,
            type: notification.type as Notification["type"],
            from_profile: profiles?.find(p => p.id === notification.from_user_id)
          }));

          setNotifications(notificationsWithProfiles);
          setUnreadCount(notificationsWithProfiles.filter(n => !n.is_read).length);
        } else {
          const typedNotifications = data.map(n => ({
            ...n,
            type: n.type as Notification["type"]
          }));
          setNotifications(typedNotifications);
          setUnreadCount(typedNotifications.filter(n => !n.is_read).length);
        }
      }
      setLoading(false);
    };

    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotification = payload.new as Notification;
          
          // Fetch from_user profile if exists
          if (newNotification.from_user_id) {
            const { data: profile } = await supabase
              .from("profiles_public")
              .select("id, display_name, username, avatar_url")
              .eq("id", newNotification.from_user_id)
              .single();

            newNotification.from_profile = profile || undefined;
          }

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          playNotificationSound();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => (n.id === updatedNotification.id ? { ...n, ...updatedNotification } : n))
          );
          setUnreadCount(prev => {
            if (updatedNotification.is_read) return Math.max(0, prev - 1);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const createNotification = async (
    targetUserId: string,
    type: Notification["type"],
    content: string,
    postId?: string
  ) => {
    if (!user || user.id === targetUserId) return;

    await supabase.from("notifications").insert({
      user_id: targetUserId,
      type,
      content,
      from_user_id: user.id,
      post_id: postId || null,
    });
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
  };
};
