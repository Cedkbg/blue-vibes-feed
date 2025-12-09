import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedCard } from "@/components/FeedCard";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
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

interface PostWithProfile extends Post {
  profile?: Profile;
}

const Index = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    // Fetch posts
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

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

    // Combine posts with profiles
    const postsWithProfiles: PostWithProfile[] = postsData.map((post) => ({
      ...post,
      profile: profilesMap.get(post.user_id),
    }));

    setPosts(postsWithProfiles);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPosts();

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
  }, []);

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

      {/* Floating action button */}
      <Button
        size="icon"
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg z-50"
        onClick={() => navigate("/create-post")}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <BottomNav />
    </div>
  );
};

export default Index;
