import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface UserSettings {
  notifications_push: boolean;
  notifications_likes: boolean;
  notifications_comments: boolean;
  notifications_followers: boolean;
  notifications_messages: boolean;
  notifications_lives: boolean;
  notifications_recommendations: boolean;
  notifications_promotions: boolean;
  privacy_allow_suggestions: boolean;
  privacy_sync_contacts: boolean;
  privacy_allow_comments: string;
  privacy_allow_messages: string;
  privacy_allow_mentions: string;
  privacy_allow_duets: string;
  privacy_show_following: boolean;
  privacy_allow_downloads: boolean;
  privacy_auto_share: boolean;
  content_auto_subtitles: boolean;
  content_auto_translate: boolean;
  content_sensitive_filter: boolean;
  content_restricted_mode: boolean;
  content_high_contrast: boolean;
  content_auto_play: boolean;
  dark_mode: boolean;
  screen_time_daily_limit: number;
  screen_time_break_reminders: boolean;
  screen_time_sleep_mode: boolean;
  screen_time_sleep_start: string;
  screen_time_sleep_end: string;
}

const defaultSettings: UserSettings = {
  notifications_push: true,
  notifications_likes: true,
  notifications_comments: true,
  notifications_followers: true,
  notifications_messages: true,
  notifications_lives: true,
  notifications_recommendations: false,
  notifications_promotions: false,
  privacy_allow_suggestions: true,
  privacy_sync_contacts: false,
  privacy_allow_comments: "everyone",
  privacy_allow_messages: "followers",
  privacy_allow_mentions: "everyone",
  privacy_allow_duets: "followers",
  privacy_show_following: true,
  privacy_allow_downloads: true,
  privacy_auto_share: false,
  content_auto_subtitles: true,
  content_auto_translate: false,
  content_sensitive_filter: true,
  content_restricted_mode: false,
  content_high_contrast: false,
  content_auto_play: true,
  dark_mode: false,
  screen_time_daily_limit: 0,
  screen_time_break_reminders: false,
  screen_time_sleep_mode: false,
  screen_time_sleep_start: "22:00",
  screen_time_sleep_end: "07:00",
};

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await (supabase as any)
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching settings:", error);
    } else if (data) {
      const merged = { ...defaultSettings };
      for (const key of Object.keys(defaultSettings)) {
        if (data[key] !== undefined && data[key] !== null) {
          (merged as any)[key] = data[key];
        }
      }
      setSettings(merged);
    } else {
      // Create default settings row
      await (supabase as any)
        .from("user_settings")
        .insert({ user_id: user.id, ...defaultSettings });
    }
    setLoading(false);
  };

  const updateSetting = useCallback(async (key: keyof UserSettings, value: any) => {
    if (!user) return;

    setSettings(prev => ({ ...prev, [key]: value }));

    const { error } = await (supabase as any)
      .from("user_settings")
      .update({ [key]: value })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating setting:", error);
      toast.error("Erreur lors de la sauvegarde");
      // Revert
      fetchSettings();
    }
  }, [user]);

  const updateMultiple = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) return;

    setSettings(prev => ({ ...prev, ...updates }));

    const { error } = await (supabase as any)
      .from("user_settings")
      .update(updates)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating settings:", error);
      toast.error("Erreur lors de la sauvegarde");
      fetchSettings();
    }
  }, [user]);

  return { settings, loading, updateSetting, updateMultiple, refetch: fetchSettings };
};
