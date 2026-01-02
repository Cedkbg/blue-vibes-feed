import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  views_count: number;
  expires_at: string;
  created_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface GroupedStories {
  user_id: string;
  profile: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

export const useStories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [groupedStories, setGroupedStories] = useState<GroupedStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewedStoryIds, setViewedStoryIds] = useState<string[]>([]);

  const fetchStories = useCallback(async () => {
    try {
      // Fetch non-expired stories
      const { data: storiesData, error } = await supabase
        .from("stories")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (storiesData && storiesData.length > 0) {
        // Fetch profiles for stories
        const userIds = [...new Set(storiesData.map((s) => s.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .in("id", userIds);

        // Fetch viewed stories for current user
        if (user) {
          const { data: views } = await supabase
            .from("story_views")
            .select("story_id")
            .eq("user_id", user.id);
          
          setViewedStoryIds(views?.map((v) => v.story_id) || []);
        }

        const storiesWithProfiles = storiesData.map((story) => ({
          ...story,
          profile: profiles?.find((p) => p.id === story.user_id),
        }));

        setStories(storiesWithProfiles);

        // Group stories by user
        const grouped = userIds.map((userId) => {
          const userStories = storiesWithProfiles.filter((s) => s.user_id === userId);
          const profile = profiles?.find((p) => p.id === userId);
          const hasUnviewed = userStories.some(
            (s) => !viewedStoryIds.includes(s.id)
          );

          return {
            user_id: userId,
            profile: profile || { id: userId, display_name: null, username: null, avatar_url: null },
            stories: userStories,
            hasUnviewed,
          };
        });

        setGroupedStories(grouped);
      } else {
        setStories([]);
        setGroupedStories([]);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  }, [user, viewedStoryIds]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("stories-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories",
        },
        () => {
          fetchStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStories]);

  const createStory = async (mediaUrl: string, mediaType: string, caption?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          caption: caption || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating story:", error);
      return null;
    }
  };

  const viewStory = async (storyId: string) => {
    if (!user || viewedStoryIds.includes(storyId)) return;

    try {
      await supabase.from("story_views").insert({
        story_id: storyId,
        user_id: user.id,
      });

      setViewedStoryIds((prev) => [...prev, storyId]);
    } catch (error) {
      console.error("Error marking story as viewed:", error);
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", storyId)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting story:", error);
      return false;
    }
  };

  return {
    stories,
    groupedStories,
    loading,
    viewedStoryIds,
    createStory,
    viewStory,
    deleteStory,
    refetch: fetchStories,
  };
};
