import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedCard } from "@/components/FeedCard";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { StartLiveModal } from "@/components/StartLiveModal";
import { FeedFilter, FilterType } from "@/components/FeedFilter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";

interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  channel_id: string | null;
  group_id: string | null;
  community_id: string | null;
}

interface Profile {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  birthdate: string | null;
  profession: string | null;
  location: string | null;
}

interface SourceInfo {
  type: "channel" | "group" | "community";
  id: string;
  name: string;
}

interface PostWithProfile extends Post {
  profile?: Profile;
  source?: SourceInfo | null;
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStartLive, setShowStartLive] = useState(false);
  
  // Filter state
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterEntityId, setFilterEntityId] = useState<string | null>(null);

  // Track user presence (online status)
  usePresence(user?.id);

  const fetchPosts = async () => {
    setIsLoading(true);
    
    // Build query based on filter
    let query = supabase
      .from("posts")
      .select("*")
      .neq("media_type", "video")
      .order("created_at", { ascending: false });

    if (filterType === "personal") {
      // Only personal posts (no entity)
      query = query.is("channel_id", null).is("group_id", null).is("community_id", null);
    } else if (filterType === "channel") {
      if (filterEntityId) {
        query = query.eq("channel_id", filterEntityId);
      } else {
        query = query.not("channel_id", "is", null);
      }
    } else if (filterType === "group") {
      if (filterEntityId) {
        query = query.eq("group_id", filterEntityId);
      } else {
        query = query.not("group_id", "is", null);
      }
    } else if (filterType === "community") {
      if (filterEntityId) {
        query = query.eq("community_id", filterEntityId);
      } else {
        query = query.not("community_id", "is", null);
      }
    }
    // "all" = no filter, show everything

    const { data: postsData, error: postsError } = await query;

    if (postsError || !postsData) {
      setIsLoading(false);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(postsData.map((p) => p.user_id))];

    // Fetch profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, birthdate, profession, location")
      .in("id", userIds);

    const profilesMap = new Map<string, Profile>();
    profilesData?.forEach((p) => {
      profilesMap.set(p.id, p);
    });

    // Fetch source names (channels, groups, communities)
    const channelIds = [...new Set(postsData.filter(p => p.channel_id).map(p => p.channel_id!))];
    const groupIds = [...new Set(postsData.filter(p => p.group_id).map(p => p.group_id!))];
    const communityIds = [...new Set(postsData.filter(p => p.community_id).map(p => p.community_id!))];

    const channelNamesMap = new Map<string, string>();
    const groupNamesMap = new Map<string, string>();
    const communityNamesMap = new Map<string, string>();

    const [channelsRes, groupsRes, communitiesRes] = await Promise.all([
      channelIds.length > 0 
        ? supabase.from("channels").select("id, name").in("id", channelIds)
        : { data: [] },
      groupIds.length > 0
        ? supabase.from("groups").select("id, name").in("id", groupIds)
        : { data: [] },
      communityIds.length > 0
        ? supabase.from("communities").select("id, name").in("id", communityIds)
        : { data: [] },
    ]);

    channelsRes.data?.forEach(c => channelNamesMap.set(c.id, c.name));
    groupsRes.data?.forEach(g => groupNamesMap.set(g.id, g.name));
    communitiesRes.data?.forEach(c => communityNamesMap.set(c.id, c.name));

    // Combine posts with profiles and source
    const postsWithProfiles: PostWithProfile[] = postsData.map((post) => {
      let source: SourceInfo | null = null;
      if (post.channel_id && channelNamesMap.has(post.channel_id)) {
        source = { type: "channel", id: post.channel_id, name: channelNamesMap.get(post.channel_id)! };
      } else if (post.group_id && groupNamesMap.has(post.group_id)) {
        source = { type: "group", id: post.group_id, name: groupNamesMap.get(post.group_id)! };
      } else if (post.community_id && communityNamesMap.has(post.community_id)) {
        source = { type: "community", id: post.community_id, name: communityNamesMap.get(post.community_id)! };
      }

      return {
        ...post,
        profile: profilesMap.get(post.user_id),
        source,
      };
    });

    setPosts(postsWithProfiles);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [filterType, filterEntityId]);

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterType, filterEntityId]);

  const handleFilterChange = (type: FilterType, entityId: string | null) => {
    setFilterType(type);
    setFilterEntityId(entityId);
  };

  const calculateAge = (birthdate: string | null) => {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <TopBar />

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Filter */}
        <div className="mb-4">
          <FeedFilter
            selectedType={filterType}
            selectedEntityId={filterEntityId}
            onFilterChange={handleFilterChange}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">
              Aucun post pour le moment
            </p>
            <Button onClick={() => navigate("/create-post")}>
              Créer le premier post
            </Button>
          </div>
        ) : (
          posts.map((post) => (
            <FeedCard
              key={post.id}
              id={post.id}
              userId={post.user_id}
              user={{
                name: post.profile?.display_name || post.profile?.username || "Utilisateur",
                avatar: post.profile?.avatar_url || "",
                age: calculateAge(post.profile?.birthdate || null),
                profession: post.profile?.profession || null,
                location: post.profile?.location || null,
                isFollowing: false,
              }}
              image={post.media_url || undefined}
              mediaType={post.media_type}
              caption={post.caption || ""}
              likes={post.likes_count}
              comments={post.comments_count}
              source={post.source}
            />
          ))
        )}
      </main>

      {/* Floating action buttons */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-3 z-50">
        {user && (
          <Button
            size="icon"
            variant="outline"
            className="w-14 h-14 rounded-full shadow-lg bg-card border-primary/20 hover:bg-primary hover:text-primary-foreground"
            onClick={() => setShowStartLive(true)}
          >
            <Radio className="w-6 h-6" />
          </Button>
        )}
        <Button
          size="icon"
          className="w-14 h-14 rounded-full shadow-lg gradient-primary"
          onClick={() => navigate("/create-post")}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <StartLiveModal 
        open={showStartLive} 
        onOpenChange={setShowStartLive}
        onStreamStarted={(id) => navigate(`/live/${id}`)}
      />

      <BottomNav />
    </div>
  );
};

export default Index;
