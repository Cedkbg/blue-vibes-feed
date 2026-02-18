import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hash, TrendingUp, ArrowLeft, Flame, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DesktopLayout } from "@/components/DesktopLayout";
import { supabase } from "@/integrations/supabase/client";
import { HashtagText } from "@/components/HashtagText";
import { Heart, MessageCircle, Play } from "lucide-react";

interface Hashtag {
  id: string;
  name: string;
  post_count: number;
}

interface Post {
  id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  user_id: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

const Trending = () => {
  const navigate = useNavigate();
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<Hashtag | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  const fetchTrendingHashtags = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("hashtags")
      .select("*")
      .gt("post_count", 0)
      .order("post_count", { ascending: false })
      .limit(50);

    if (!error && data) {
      setHashtags(data);
    }
    setIsLoading(false);
  };

  const fetchPostsByHashtag = async (hashtag: Hashtag) => {
    setIsLoadingPosts(true);
    setSelectedHashtag(hashtag);

    const { data: postHashtags } = await supabase
      .from("post_hashtags")
      .select("post_id")
      .eq("hashtag_id", hashtag.id);

    if (postHashtags && postHashtags.length > 0) {
      const postIds = postHashtags.map((ph) => ph.post_id);
      const { data: postsData } = await supabase
        .from("posts")
        .select("id, caption, media_url, media_type, likes_count, comments_count, user_id, created_at")
        .in("id", postIds)
        .order("created_at", { ascending: false });

      if (postsData) {
        const userIds = [...new Set(postsData.map((p) => p.user_id))];
        const { data: profiles } = await supabase
          .from("profiles_public")
          .select("id, display_name, username, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
        setPosts(
          postsData.map((p) => ({ ...p, profile: profileMap.get(p.user_id) }))
        );
      }
    } else {
      setPosts([]);
    }
    setIsLoadingPosts(false);
  };

  const filteredHashtags = searchQuery
    ? hashtags.filter((h) => h.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : hashtags;

  const getRankBadge = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  if (selectedHashtag) {
    return (
      <DesktopLayout showStories={false} title="Tendances">
        <div className="px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 gap-2"
            onClick={() => { setSelectedHashtag(null); setPosts([]); }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>

          <div className="bg-gradient-to-r from-primary to-primary/60 rounded-2xl p-6 text-primary-foreground mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Hash className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">#{selectedHashtag.name}</h2>
                <p className="text-primary-foreground/80">
                  {selectedHashtag.post_count} publication{selectedHashtag.post_count > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {isLoadingPosts ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Hash className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun post avec ce hashtag</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer relative group"
                  onClick={() => {
                    if (post.media_type === "video") navigate(`/video?id=${post.id}`);
                  }}
                >
                  {post.media_url ? (
                    post.media_type === "video" ? (
                      <>
                        <video src={post.media_url} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 bg-card">
                      <p className="text-xs text-muted-foreground line-clamp-4">{post.caption}</p>
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 fill-white" /> {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" /> {post.comments_count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout showStories={false} title="Tendances">
      <div className="px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tendances</h1>
            <p className="text-sm text-muted-foreground">Les hashtags les plus populaires</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un hashtag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredHashtags.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun hashtag tendance</p>
            <p className="text-sm mt-1">Utilisez des #hashtags dans vos publications !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHashtags.map((hashtag, index) => (
              <Card
                key={hashtag.id}
                className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
                onClick={() => fetchPostsByHashtag(hashtag)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {getRankBadge(index)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">#{hashtag.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {hashtag.post_count} publication{hashtag.post_count > 1 ? "s" : ""}
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DesktopLayout>
  );
};

export default Trending;
