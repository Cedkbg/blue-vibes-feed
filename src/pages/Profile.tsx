import { useState, useEffect } from "react";
import { Settings, Grid, Video, ArrowLeft, LogOut, Bookmark, UserPlus, UserCheck, Heart, Eye, MessageCircle, BarChart3 } from "lucide-react";
import { FollowersModal } from "@/components/FollowersModal";
import { LikersModal } from "@/components/LikersModal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DesktopLayout } from "@/components/DesktopLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { EditProfileSheet } from "@/components/EditProfileSheet";
import cedliteLogo from "@/assets/cedlite-logo.png";

interface Profile {
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  external_link: string | null;
  is_private: boolean;
  language: string | null;
}

interface Post {
  id: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
}

interface FavoritePost {
  id: string;
  post_id: string;
  post: Post;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const [followersTab, setFollowersTab] = useState<"followers" | "following">("followers");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [videos, setVideos] = useState<Post[]>([]);
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  
  // Determine if viewing own profile or someone else's
  const viewingUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;
  
  const { isFollowing, toggleFollow, isLoading: isFollowLoading, followersCount, followingCount } = useFollows(viewingUserId);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (viewingUserId) {
      fetchProfile();
      fetchPosts();
      if (isOwnProfile) {
        fetchFavorites();
      }
    }
  }, [viewingUserId, isOwnProfile]);

  // Track profile visit
  useEffect(() => {
    const recordVisit = async () => {
      if (!user || !viewingUserId || isOwnProfile) return;
      try {
        // Record visit - may fail if table doesn't exist yet
        await (supabase as any).from("profile_visits").insert({
          profile_id: viewingUserId,
          visitor_id: user.id,
        });
        // Send notification
        await supabase.from("notifications").insert({
          user_id: viewingUserId,
          type: "profile_visit",
          content: "a consulté votre profil",
          from_user_id: user.id,
        });
      } catch (e) {
        // Silently fail
      }
    };
    recordVisit();
  }, [viewingUserId, user, isOwnProfile]);

  const fetchProfile = async () => {
    if (!viewingUserId) return;
    
    const { data, error } = await supabase
      .from("profiles_public")
      .select("username, display_name, bio, avatar_url, external_link, is_private, language")
      .eq("id", viewingUserId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } else {
      setProfile(data);
    }
    setLoadingProfile(false);
  };

  const fetchPosts = async () => {
    if (!viewingUserId) return;

    const { data, error } = await supabase
      .from("posts")
      .select("id, media_url, media_type, likes_count, comments_count")
      .eq("user_id", viewingUserId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data.filter(p => p.media_type === "image" || !p.media_type));
      setVideos(data.filter(p => p.media_type === "video"));
      setTotalLikes(data.reduce((sum, p) => sum + (p.likes_count || 0), 0));
      setTotalComments(data.reduce((sum, p) => sum + (p.comments_count || 0), 0));
    }

    // Fetch story views as "total views"
    const { data: storiesData } = await supabase
      .from("stories")
      .select("views_count")
      .eq("user_id", viewingUserId);
    
    if (storiesData) {
      setTotalViews(storiesData.reduce((sum, s) => sum + (s.views_count || 0), 0));
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("favorites")
      .select(`
        id,
        post_id,
        post:posts(id, media_url, media_type, likes_count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const validFavorites = data
        .filter((f: any) => f.post)
        .map((f: any) => f.post as Post);
      setFavorites(validFavorites);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion");
    } else {
      toast.success("Déconnecté avec succès");
      navigate("/auth");
    }
  };

  const handlePostClick = (postId: string, mediaType?: string | null) => {
    if (mediaType === "video") {
      navigate(`/video?id=${postId}`);
    }
    // For images, do nothing (or could open a detail view later)
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <img src={cedliteLogo} alt="CedLite" className="w-16 h-16" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <DesktopLayout showRightSidebar={false} showTopBar={false}>
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {!isOwnProfile && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <img src={cedliteLogo} alt="CedLite" className="w-8 h-8" />
          <h1 className="text-xl font-bold">
            {isOwnProfile ? "Profil" : profile?.username || "Profil"}
          </h1>
        </div>
        {isOwnProfile && (
          <div className="flex items-center gap-2">
            <Button 
              size="icon" 
              variant="ghost" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/settings")}
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        )}
      </header>

      {/* Profile Info */}
      <div className="px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6">
          <Avatar className="w-24 h-24 ring-4 ring-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || "User"} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {profile?.username?.[0]?.toUpperCase() || profile?.display_name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold mb-1">
              {profile?.display_name || profile?.username || "Utilisateur"}
            </h2>
            <p className="text-muted-foreground">@{profile?.username || "user"}</p>
            {profile?.is_private && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                🔒 Compte privé
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          <div
            className="text-center p-3 bg-card rounded-xl cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setShowLikers(true)}
          >
            <div className="text-xl font-bold flex items-center justify-center gap-1">
              <Heart className="w-4 h-4 text-destructive fill-destructive" />
              {totalLikes}
            </div>
            <div className="text-xs text-muted-foreground">J'aime</div>
          </div>
          <div className="text-center p-3 bg-card rounded-xl">
            <div className="text-xl font-bold flex items-center justify-center gap-1">
              <Eye className="w-4 h-4 text-primary" />
              {totalViews}
            </div>
            <div className="text-xs text-muted-foreground">Vues</div>
          </div>
          <div className="text-center p-3 bg-card rounded-xl">
            <div className="text-xl font-bold flex items-center justify-center gap-1">
              <MessageCircle className="w-4 h-4 text-primary" />
              {totalComments}
            </div>
            <div className="text-xs text-muted-foreground">Comm.</div>
          </div>
          <div
            className="text-center p-3 bg-card rounded-xl cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => { setFollowersTab("followers"); setShowFollowers(true); }}
          >
            <div className="text-xl font-bold">{followersCount}</div>
            <div className="text-xs text-muted-foreground">Abonnés</div>
          </div>
          <div
            className="text-center p-3 bg-card rounded-xl cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => { setFollowersTab("following"); setShowFollowers(true); }}
          >
            <div className="text-xl font-bold">{followingCount}</div>
            <div className="text-xs text-muted-foreground">Abos</div>
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className="text-foreground mb-4 whitespace-pre-line">{profile.bio}</p>
        )}
        
        {/* External Link */}
        {profile?.external_link && (
          <a 
            href={profile.external_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm block mb-4"
          >
            🔗 {profile.external_link}
          </a>
        )}

        {/* Action Buttons */}
        {isOwnProfile ? (
          <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
            <SheetTrigger asChild>
              <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-semibold">
                Modifier le profil
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
              <EditProfileSheet 
                profile={profile} 
                userId={user?.id || ""} 
                onUpdate={() => {
                  fetchProfile();
                }}
                onClose={() => setIsEditOpen(false)}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <Button 
            className={`w-full rounded-xl font-semibold ${isFollowing ? "bg-muted text-foreground hover:bg-muted/80" : ""}`}
            onClick={toggleFollow}
            disabled={isFollowLoading}
          >
            {isFollowing ? (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Abonné
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                S'abonner
              </>
            )}
          </Button>
        )}
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="px-4 sm:px-6">
        <TabsList className={`w-full grid mb-4 ${isOwnProfile ? "grid-cols-3" : "grid-cols-2"}`}>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Vidéos
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Favoris
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Grid className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun post pour le moment</p>
              {isOwnProfile && <p className="text-sm mt-2">Partagez votre premier contenu !</p>}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => handlePostClick(post.id, post.media_type)}
                >
                  {post.media_url && (
                    <img 
                      src={post.media_url} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos">
          {videos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune vidéo pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {videos.map((video) => (
                <div 
                  key={video.id} 
                  className="aspect-[9/16] bg-muted rounded-lg overflow-hidden cursor-pointer relative"
                  onClick={() => handlePostClick(video.id, "video")}
                >
                  {video.media_url && (
                    <video 
                      src={video.media_url} 
                      className="w-full h-full object-cover"
                      muted
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="favorites">
            {favorites.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun favori pour le moment</p>
                <p className="text-sm mt-2">Enregistrez des vidéos pour les retrouver ici !</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {favorites.map((fav) => (
                  <div 
                    key={fav.id} 
                    className="aspect-[9/16] bg-muted rounded-lg overflow-hidden cursor-pointer relative"
                    onClick={() => handlePostClick(fav.id, fav.media_type)}
                  >
                    {fav.media_url && (
                      fav.media_type === "video" ? (
                        <video 
                          src={fav.media_url} 
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img 
                          src={fav.media_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      )
                    )}
                    <div className="absolute top-2 right-2">
                      <Bookmark className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <FollowersModal
        open={showFollowers}
        onOpenChange={setShowFollowers}
        userId={viewingUserId || ""}
        defaultTab={followersTab}
      />

      <LikersModal
        open={showLikers}
        onOpenChange={setShowLikers}
        userId={viewingUserId || ""}
      />

    </DesktopLayout>
  );
};

export default Profile;
