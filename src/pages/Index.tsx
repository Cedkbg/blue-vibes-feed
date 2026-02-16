import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedCard } from "@/components/FeedCard";
import { StartLiveModal } from "@/components/StartLiveModal";
import { DesktopLayout } from "@/components/DesktopLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface PostWithProfile extends Post {
  profile?: Profile;
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStartLive, setShowStartLive] = useState(false);

  usePresence(user?.id);

  const fetchPosts = async () => {
    setIsLoading(true);
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .neq("media_type", "video")
      .is("channel_id", null)
      .is("group_id", null)
      .is("community_id", null)
      .order("created_at", { ascending: false });

    if (postsError || !postsData) {
      setIsLoading(false);
      return;
    }

    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, birthdate, profession, location")
      .in("id", userIds);

    const profilesMap = new Map<string, Profile>();
    profilesData?.forEach((p) => { profilesMap.set(p.id, p); });

    setPosts(postsData.map((post) => ({ ...post, profile: profilesMap.get(post.user_id) })));
    setIsLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const calculateAge = (birthdate: string | null) => {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <DesktopLayout showStories showRightSidebar>
      <main className="px-4 py-4">
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
            />
          ))
        )}
      </main>

      {/* Floating action buttons - mobile only */}
      {isMobile && (
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
      )}

      <StartLiveModal
        open={showStartLive}
        onOpenChange={setShowStartLive}
        onStreamStarted={(id) => navigate(`/live/${id}`)}
      />
    </DesktopLayout>
  );
};

export default Index;
