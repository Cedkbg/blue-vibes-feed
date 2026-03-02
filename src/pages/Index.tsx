import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedCard } from "@/components/FeedCard";
import { DesktopLayout } from "@/components/DesktopLayout";
import { FollowRequestsSection } from "@/components/FollowRequestsSection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  media_url: string | null;
  media_urls: string[] | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface Profile {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  profession: string | null;
  location: string | null;
}

interface PostWithProfile extends Post {
  profile?: Profile;
}

const PAGE_SIZE = 15;

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  

  usePresence(user?.id);

  const fetchPosts = async (offset = 0, append = false) => {
    if (offset === 0) setIsLoading(true);
    else setIsLoadingMore(true);

    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .not("media_type", "eq", "video")
      .is("channel_id", null)
      .is("group_id", null)
      .is("community_id", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (postsError || !postsData) {
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    setHasMore(postsData.length === PAGE_SIZE);

    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles_public")
      .select("id, display_name, username, avatar_url, profession, location")
      .in("id", userIds);

    const profilesMap = new Map<string, Profile>();
    profilesData?.forEach((p) => { profilesMap.set(p.id, p); });

    const newPosts = postsData.map((post) => ({ ...post, profile: profilesMap.get(post.user_id) }));

    if (append) {
      setPosts((prev) => [...prev, ...newPosts]);
    } else {
      setPosts(newPosts);
    }
    setIsLoading(false);
    setIsLoadingMore(false);
  };

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchPosts(posts.length, true);
    }
  }, [posts.length, isLoadingMore, hasMore]);

  const { setSentinelRef } = useInfiniteScroll(loadMore, hasMore, isLoadingMore);

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fetchPosts(), 2000);
      })
      .subscribe();
    return () => { clearTimeout(debounceTimer); supabase.removeChannel(channel); };
  }, []);

  return (
    <DesktopLayout showStories={false} showRightSidebar>
      <main className="px-4 py-4">
        {/* Follow Requests for private accounts */}
        <FollowRequestsSection />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">Aucun post pour le moment</p>
            <Button onClick={() => navigate("/create-post")}>Créer le premier post</Button>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <FeedCard
                key={post.id}
                id={post.id}
                userId={post.user_id}
                user={{
                  name: post.profile?.display_name || post.profile?.username || "Utilisateur",
                  avatar: post.profile?.avatar_url || "",
                  age: null,
                  profession: post.profile?.profession || null,
                  location: post.profile?.location || null,
                  isFollowing: false,
                }}
                image={post.media_url || undefined}
                mediaUrls={post.media_urls || null}
                mediaType={post.media_type}
                caption={post.caption || ""}
                likes={post.likes_count}
                comments={post.comments_count}
                moodAura={(post as any).mood_aura}
              />
            ))}
            {/* Infinite scroll sentinel */}
            <div ref={setSentinelRef} className="h-10 flex items-center justify-center">
              {isLoadingMore && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              )}
            </div>
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Vous avez tout vu ! 🎉
              </p>
            )}
          </>
        )}
      </main>

      {/* Floating action button - mobile only */}
      {isMobile && (
        <div className="fixed bottom-24 right-4 z-50">
          <Button
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg gradient-primary"
            onClick={() => navigate("/create-post")}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}
    </DesktopLayout>
  );
};

export default Index;
