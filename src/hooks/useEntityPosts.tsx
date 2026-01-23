import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface Profile {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  birthdate: string | null;
  profession: string | null;
  location: string | null;
}

export interface PostWithProfile extends Post {
  profile?: Profile;
}

type EntityType = "channel" | "group" | "community";

interface UseEntityPostsOptions {
  entityType: EntityType;
  entityId: string | undefined;
}

export const useEntityPosts = ({ entityType, entityId }: UseEntityPostsOptions) => {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    if (!entityId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    let query = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (entityType === "channel") {
      query = query.eq("channel_id", entityId);
    } else if (entityType === "group") {
      query = query.eq("group_id", entityId);
    } else if (entityType === "community") {
      query = query.eq("community_id", entityId);
    }
    
    const { data: postsData, error: postsError } = await query;

    if (postsError || !postsData) {
      setLoading(false);
      return;
    }

    if (postsData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Fetch profiles
    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, birthdate, profession, location")
      .in("id", userIds);

    const profilesMap = new Map<string, Profile>();
    profilesData?.forEach((p) => {
      profilesMap.set(p.id, p);
    });

    const postsWithProfiles: PostWithProfile[] = postsData.map((post) => ({
      ...post,
      profile: profilesMap.get(post.user_id),
    }));

    setPosts(postsWithProfiles);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();

    if (!entityId) return;

    let filterColumn = "channel_id";
    if (entityType === "group") filterColumn = "group_id";
    else if (entityType === "community") filterColumn = "community_id";

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`${entityType}-posts-${entityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: `${filterColumn}=eq.${entityId}`,
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityId, entityType]);

  return { posts, loading, refetch: fetchPosts };
};
