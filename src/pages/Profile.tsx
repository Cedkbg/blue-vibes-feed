import { useState, useEffect } from "react";
import { Settings, Grid, Video, ArrowLeft, LogOut, Bookmark, UserPlus, UserCheck, Heart, Eye, MessageCircle, BarChart3, Clock, Lock, Share2, MapPin, Briefcase, Link2, Globe, BadgeCheck, Pencil } from "lucide-react";
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
  is_verified?: boolean;
  language: string | null;
  profession: string | null;
  location: string | null;
}

interface Post {
  id: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
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
  
  const viewingUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;
  
  const { isFollowing, toggleFollow, isLoading: isFollowLoading, followersCount, followingCount, requestStatus } = useFollows(viewingUserId);

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

  useEffect(() => {
    const recordVisit = async () => {
      if (!user || !viewingUserId || isOwnProfile) return;
      try {
        await (supabase as any).from("profile_visits").insert({
          profile_id: viewingUserId,
          visitor_id: user.id,
        });
        await supabase.from("notifications").insert({
          user_id: viewingUserId,
          type: "profile_visit",
          content: "a consulté votre profil",
          from_user_id: user.id,
        });
      } catch (e) {}
    };
    recordVisit();
  }, [viewingUserId, user, isOwnProfile]);

  const fetchProfile = async () => {
    if (!viewingUserId) return;
    const { data, error } = await supabase
      .from("profiles_public")
      .select("username, display_name, bio, avatar_url, external_link, is_private, is_verified, language, profession, location")
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
      .select(`id, post_id, post:posts(id, media_url, media_type, likes_count)`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const validFavorites = data
        .filter((f: any) => f.post)
        .map((f: any) => f.post as Post);
      setFavorites(validFavorites);
    }
  };

  const handleShareProfile = async () => {
    const username = profile?.username;
    const shareUrl = username
      ? `${window.location.origin}/u/${username}`
      : `${window.location.origin}/profile/${viewingUserId}`;
    const shareText = `${profile?.display_name || profile?.username || "Profil"} sur CedLite`;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    navigator.clipboard.writeText(shareUrl);
    toast.success("Lien copié !");
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
    } else {
      navigate(`/?highlight=${postId}`);
    }
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

  const totalPosts = posts.length + videos.length;

  return (
    <DesktopLayout showRightSidebar={false} showTopBar={false}>
      {/* LinkedIn-style Cover Banner */}
      <div className="relative">
        <div className="h-36 sm:h-48 bg-gradient-to-r from-primary via-primary/80 to-primary/60 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-primary-foreground/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-primary-foreground/10 rounded-full translate-x-1/3 translate-y-1/3" />
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-primary-foreground/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Top actions over banner */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {!isOwnProfile && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-primary-foreground bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-full"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="text-primary-foreground bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-full"
              onClick={handleShareProfile}
            >
              <Share2 className="w-5 h-5" />
            </Button>
            {isOwnProfile && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-primary-foreground bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-full"
                onClick={() => navigate("/settings")}
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Avatar overlapping banner */}
        <div className="absolute -bottom-16 left-4 sm:left-6">
          <Avatar className="w-32 h-32 ring-4 ring-background shadow-lg">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || "User"} />
            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
              {profile?.username?.[0]?.toUpperCase() || profile?.display_name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profile Info - LinkedIn style */}
      <div className="pt-20 px-4 sm:px-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-foreground">
                {profile?.display_name || profile?.username || "Utilisateur"}
              </h1>
              {profile?.is_verified && (
                <BadgeCheck className="w-6 h-6 text-primary flex-shrink-0" />
              )}
              {profile?.is_private && (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-muted-foreground text-sm">@{profile?.username || "user"}</p>
            
            {/* Professional info */}
            {profile?.profession && (
              <div className="flex items-center gap-2 mt-2 text-foreground">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{profile.profession}</span>
              </div>
            )}
            {profile?.location && (
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{profile.location}</span>
              </div>
            )}
            {profile?.external_link && (
              <a 
                href={profile.external_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 mt-1 text-primary hover:underline"
              >
                <Link2 className="w-4 h-4" />
                <span className="text-sm truncate max-w-xs">{profile.external_link.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
            {profile?.language && (
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <Globe className="w-4 h-4" />
                <span className="text-sm">{profile.language}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 sm:mt-0">
            {isOwnProfile ? (
              <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="rounded-full gap-2">
                    <Pencil className="w-4 h-4" />
                    Modifier le profil
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
                  <EditProfileSheet 
                    profile={profile} 
                    userId={user?.id || ""} 
                    onUpdate={() => fetchProfile()}
                    onClose={() => setIsEditOpen(false)}
                  />
                </SheetContent>
              </Sheet>
            ) : (
              <>
                <Button 
                  className={`rounded-full gap-2 ${isFollowing ? "bg-muted text-foreground hover:bg-muted/80" : requestStatus === "pending" ? "bg-muted text-foreground hover:bg-muted/80" : ""}`}
                  onClick={toggleFollow}
                  disabled={isFollowLoading}
                >
                  {isFollowing ? (
                    <><UserCheck className="w-4 h-4" /> Abonné</>
                  ) : requestStatus === "pending" ? (
                    <><Clock className="w-4 h-4" /> En attente</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> S'abonner</>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => navigate(`/chat/${viewingUserId}`)}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className="text-foreground mt-4 whitespace-pre-line text-sm leading-relaxed">{profile.bio}</p>
        )}

        {/* Stats bar - LinkedIn style */}
        <div className="flex items-center gap-6 mt-5 py-4 border-y border-border">
          <button
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
            onClick={() => { setFollowersTab("followers"); setShowFollowers(true); }}
          >
            <span className="text-lg font-bold text-foreground">{followersCount}</span>
            <span className="text-sm text-muted-foreground">abonnés</span>
          </button>
          <button
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
            onClick={() => { setFollowersTab("following"); setShowFollowers(true); }}
          >
            <span className="text-lg font-bold text-foreground">{followingCount}</span>
            <span className="text-sm text-muted-foreground">abonnements</span>
          </button>
          <button
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
            onClick={() => setShowLikers(true)}
          >
            <span className="text-lg font-bold text-foreground">{totalLikes}</span>
            <span className="text-sm text-muted-foreground">j'aime</span>
          </button>
        </div>

        {/* Activity summary - LinkedIn style */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-card rounded-xl border border-border">
            <Grid className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{totalPosts}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Posts</p>
          </div>
          <div className="text-center p-3 bg-card rounded-xl border border-border">
            <Heart className="w-5 h-5 mx-auto text-destructive mb-1" />
            <p className="text-lg font-bold text-foreground">{totalLikes}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Likes</p>
          </div>
          <div className="text-center p-3 bg-card rounded-xl border border-border">
            <MessageCircle className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{totalComments}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Commentaires</p>
          </div>
          <div className="text-center p-3 bg-card rounded-xl border border-border">
            <Eye className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold text-foreground">{totalViews}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vues</p>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      {!isOwnProfile && profile?.is_private && !isFollowing ? (
        <div className="text-center py-16 px-4">
          <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Ce compte est privé</h3>
          <p className="text-muted-foreground text-sm">
            Abonnez-vous à ce compte pour voir ses publications.
          </p>
        </div>
      ) : (
      <Tabs defaultValue="posts" className="px-4 sm:px-6 pb-24">
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
                  className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group relative"
                  onClick={() => handlePostClick(post.id, post.media_type)}
                >
                  {post.media_url && (
                    <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-4 text-white text-sm font-medium">
                      <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{post.likes_count}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{post.comments_count}</span>
                    </div>
                  </div>
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
                    <video src={video.media_url} className="w-full h-full object-cover" muted />
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
                        <video src={fav.media_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={fav.media_url} alt="" className="w-full h-full object-cover" />
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
      )}

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
