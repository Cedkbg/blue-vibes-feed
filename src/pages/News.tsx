import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Newspaper, BadgeCheck, TrendingUp, Globe, Clock, Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  profession: string | null;
}

interface Post {
  id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  profiles?: Profile;
}

const News = () => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const [verifiedProfiles, setVerifiedProfiles] = useState<Profile[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      // Fetch profiles with most posts (simulating verified/popular accounts)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .not("display_name", "is", null)
        .limit(10);

      // Fetch trending posts (most liked)
      const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .order("likes_count", { ascending: false })
        .limit(20);

      // Fetch profiles for posts
      if (posts && posts.length > 0) {
        const userIds = [...new Set(posts.map((p) => p.user_id))];
        const { data: postProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);

        const postsWithProfiles = posts.map((post) => ({
          ...post,
          profiles: postProfiles?.find((p) => p.id === post.user_id),
        }));

        setTrendingPosts(postsWithProfiles);
      } else {
        setTrendingPosts([]);
      }

      setVerifiedProfiles(profiles || []);

      // Fetch current user's followings
      if (user) {
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);
        
        setFollowingIds(follows?.map(f => f.following_id) || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Subscribe to realtime updates for posts
  useEffect(() => {
    const channel = supabase
      .channel("news-posts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          fetchData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleFollow = async (profileId: string) => {
    if (!user) return;

    try {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: profileId,
      });

      // Send notification
      await createNotification(profileId, "follow", "a commencé à vous suivre");

      setFollowingIds(prev => [...prev, profileId]);
    } catch (error) {
      console.error("Error following:", error);
    }
  };

  const handleUnfollow = async (profileId: string) => {
    if (!user) return;

    try {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profileId);

      setFollowingIds(prev => prev.filter(id => id !== profileId));
    } catch (error) {
      console.error("Error unfollowing:", error);
    }
  };

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      
      <div className="pt-16 px-4 max-w-2xl mx-auto">
        {/* Header avec gradient */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 mb-6 shadow-glow">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-primary-foreground/20 rounded-xl backdrop-blur-sm">
              <Newspaper className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">Actualités</h1>
              <p className="text-primary-foreground/80 text-sm">Tendances & Comptes certifiés</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="w-full mb-6 bg-card border border-border p-1 rounded-xl">
            <TabsTrigger 
              value="trending" 
              className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <TrendingUp className="w-4 h-4" />
              Tendances
            </TabsTrigger>
            <TabsTrigger 
              value="verified" 
              className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <BadgeCheck className="w-4 h-4" />
              Certifiés
            </TabsTrigger>
            <TabsTrigger 
              value="world" 
              className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <Globe className="w-4 h-4" />
              Monde
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-4 animate-in fade-in-50">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-20 bg-muted rounded-lg"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : trendingPosts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune tendance pour le moment</p>
                </CardContent>
              </Card>
            ) : (
              trendingPosts.map((post, index) => (
                <Card 
                  key={post.id} 
                  className="group hover:shadow-medium transition-smooth border-border/50 overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-8 h-8 border-2 border-primary/20">
                            <AvatarImage src={post.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {post.profiles?.display_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-sm text-foreground">
                              {post.profiles?.display_name || "Utilisateur"}
                            </span>
                            <BadgeCheck className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(post.created_at)}
                          </span>
                        </div>
                        
                        {post.caption && (
                          <p className="text-foreground text-sm line-clamp-2 mb-3">
                            {post.caption}
                          </p>
                        )}
                        
                        {post.media_url && (
                          <div className="rounded-xl overflow-hidden mb-3">
                            {post.media_type === "video" ? (
                              <video 
                                src={post.media_url} 
                                className="w-full h-40 object-cover"
                                muted
                              />
                            ) : (
                              <img 
                                src={post.media_url} 
                                alt="" 
                                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <button className="flex items-center gap-1 hover:text-primary transition-colors text-sm">
                            <Heart className="w-4 h-4" />
                            {post.likes_count}
                          </button>
                          <button className="flex items-center gap-1 hover:text-primary transition-colors text-sm">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments_count}
                          </button>
                          <button className="flex items-center gap-1 hover:text-primary transition-colors text-sm">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button className="flex items-center gap-1 hover:text-primary transition-colors text-sm ml-auto">
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="verified" className="space-y-4 animate-in fade-in-50">
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-32 bg-muted rounded-lg"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : verifiedProfiles.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <BadgeCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun compte certifié</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {verifiedProfiles.map((profile) => {
                  const isFollowing = followingIds.includes(profile.id);
                  const isCurrentUser = user?.id === profile.id;
                  
                  return (
                    <Card 
                      key={profile.id} 
                      className="group hover:shadow-medium transition-smooth overflow-hidden"
                    >
                      <CardContent className="p-4 text-center">
                        <Avatar className="w-16 h-16 mx-auto mb-3 border-4 border-primary/20 group-hover:border-primary transition-colors">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xl">
                            {profile.display_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="font-semibold text-foreground truncate">
                            {profile.display_name || "Utilisateur"}
                          </span>
                          <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                        </div>
                        {profile.profession && (
                          <Badge variant="secondary" className="text-xs mb-2">
                            {profile.profession}
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {profile.bio || "Pas de bio"}
                        </p>
                        {!isCurrentUser && (
                          <Button 
                            size="sm" 
                            variant={isFollowing ? "outline" : "default"}
                            className={`w-full rounded-xl ${!isFollowing ? "gradient-primary hover:opacity-90" : ""} transition-opacity`}
                            onClick={() => isFollowing ? handleUnfollow(profile.id) : handleFollow(profile.id)}
                          >
                            {isFollowing ? "Suivi" : "Suivre"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="world" className="space-y-4 animate-in fade-in-50">
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Actualités mondiales</p>
                <p className="text-sm text-muted-foreground">Bientôt disponible</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default News;
