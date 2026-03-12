import { useState, useEffect } from "react";
import { Settings, Grid, Video, ArrowLeft, Bookmark, UserPlus, UserCheck, Heart, Eye, MessageCircle, Clock, Lock, Share2, MapPin, Briefcase, Link2, Globe, BadgeCheck, Pencil, Camera } from "lucide-react";
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
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (viewingUserId) {
      fetchProfile();
      fetchPosts();
      if (isOwnProfile) fetchFavorites();
    }
  }, [viewingUserId, isOwnProfile]);

  useEffect(() => {
    const recordVisit = async () => {
      if (!user || !viewingUserId || isOwnProfile) return;
      try {
        await (supabase as any).from("profile_visits").insert({ profile_id: viewingUserId, visitor_id: user.id });
        await supabase.from("notifications").insert({ user_id: viewingUserId, type: "profile_visit", content: "a consulté votre profil", from_user_id: user.id });
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
    if (error) { toast.error("Erreur lors du chargement du profil"); }
    else { setProfile(data); }
    setLoadingProfile(false);
  };

  const fetchPosts = async () => {
    if (!viewingUserId) return;
    const { data } = await supabase.from("posts").select("id, media_url, media_type, likes_count, comments_count").eq("user_id", viewingUserId).order("created_at", { ascending: false });
    if (data) {
      setPosts(data.filter(p => p.media_type === "image" || !p.media_type));
      setVideos(data.filter(p => p.media_type === "video"));
      setTotalLikes(data.reduce((sum, p) => sum + (p.likes_count || 0), 0));
      setTotalComments(data.reduce((sum, p) => sum + (p.comments_count || 0), 0));
    }
    const { data: storiesData } = await supabase.from("stories").select("views_count").eq("user_id", viewingUserId);
    if (storiesData) setTotalViews(storiesData.reduce((sum, s) => sum + (s.views_count || 0), 0));
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase.from("favorites").select(`id, post_id, post:posts(id, media_url, media_type, likes_count)`).eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) {
      setFavorites(data.filter((f: any) => f.post).map((f: any) => f.post as Post));
    }
  };

  const handleShareProfile = async () => {
    const username = profile?.username;
    const shareUrl = username ? `${window.location.origin}/u/${username}` : `${window.location.origin}/profile/${viewingUserId}`;
    if (navigator.share) {
      try { await navigator.share({ title: `${profile?.display_name || "Profil"} sur CedLite`, url: shareUrl }); return; } catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    navigator.clipboard.writeText(shareUrl);
    toast.success("Lien copié !");
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Erreur lors de la déconnexion");
    else { toast.success("Déconnecté"); navigate("/auth"); }
  };

  const handlePostClick = (postId: string, mediaType?: string | null) => {
    if (mediaType === "video") navigate(`/video?id=${postId}`);
    else navigate(`/?highlight=${postId}`);
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
      {/* Compact cover — LinkedIn-style */}
      <div className="relative">
        <div className="h-28 sm:h-36 bg-gradient-to-r from-primary/80 via-accent/50 to-primary/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-60" />
        </div>

        {/* Top actions */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <div>
            {!isOwnProfile && (
              <Button size="icon" variant="ghost" className="text-primary-foreground bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-full h-8 w-8" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="ghost" className="text-primary-foreground bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-full h-8 w-8" onClick={handleShareProfile}>
              <Share2 className="w-4 h-4" />
            </Button>
            {isOwnProfile && (
              <Button size="icon" variant="ghost" className="text-primary-foreground bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-full h-8 w-8" onClick={() => navigate("/settings")}>
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Avatar — overlapping */}
        <div className="absolute -bottom-12 left-4 sm:left-6">
          <Avatar className="w-24 h-24 ring-[3px] ring-background shadow-md">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || "User"} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {profile?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profile info */}
      <div className="pt-14 px-4 sm:px-6 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold text-foreground truncate">
                {profile?.display_name || profile?.username || "Utilisateur"}
              </h1>
              {profile?.is_verified && <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" />}
              {profile?.is_private && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground">@{profile?.username || "user"}</p>
          </div>

          {/* Action buttons — compact */}
          <div className="flex gap-1.5 mt-1">
            {isOwnProfile ? (
              <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs h-8">
                    <Pencil className="w-3.5 h-3.5" />
                    Modifier
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
                  <EditProfileSheet profile={profile} userId={user?.id || ""} onUpdate={() => fetchProfile()} onClose={() => setIsEditOpen(false)} />
                </SheetContent>
              </Sheet>
            ) : (
              <>
                <Button
                  size="sm"
                  className={`rounded-full gap-1.5 text-xs h-8 ${isFollowing || requestStatus === "pending" ? "bg-muted text-foreground hover:bg-muted/80" : ""}`}
                  onClick={toggleFollow}
                  disabled={isFollowLoading}
                >
                  {isFollowing ? <><UserCheck className="w-3.5 h-3.5" /> Abonné</> : requestStatus === "pending" ? <><Clock className="w-3.5 h-3.5" /> En attente</> : <><UserPlus className="w-3.5 h-3.5" /> S'abonner</>}
                </Button>
                <Button variant="outline" size="sm" className="rounded-full h-8 w-8 p-0" onClick={() => navigate(`/chat/${viewingUserId}`)}>
                  <MessageCircle className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Professional details — compact row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-muted-foreground">
          {profile?.profession && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> {profile.profession}
            </span>
          )}
          {profile?.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {profile.location}
            </span>
          )}
          {profile?.language && (
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> {profile.language}
            </span>
          )}
          {profile?.external_link && (
            <a href={profile.external_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
              <Link2 className="w-3.5 h-3.5" /> {profile.external_link.replace(/^https?:\/\//, '').split('/')[0]}
            </a>
          )}
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className="text-sm text-foreground mt-2.5 whitespace-pre-line leading-relaxed">{profile.bio}</p>
        )}

        {/* Stats row — LinkedIn-style inline */}
        <div className="flex items-center gap-5 mt-4 text-sm">
          <button className="hover:text-primary transition-colors" onClick={() => { setFollowersTab("followers"); setShowFollowers(true); }}>
            <span className="font-bold text-foreground">{followersCount}</span> <span className="text-muted-foreground">abonnés</span>
          </button>
          <button className="hover:text-primary transition-colors" onClick={() => { setFollowersTab("following"); setShowFollowers(true); }}>
            <span className="font-bold text-foreground">{followingCount}</span> <span className="text-muted-foreground">abonnements</span>
          </button>
          <button className="hover:text-primary transition-colors" onClick={() => setShowLikers(true)}>
            <span className="font-bold text-foreground">{totalPosts}</span> <span className="text-muted-foreground">posts</span>
          </button>
        </div>

        {/* Compact activity cards */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center py-2 px-1 rounded-lg bg-muted/50">
            <p className="text-sm font-bold text-foreground">{totalPosts}</p>
            <p className="text-[10px] text-muted-foreground">Posts</p>
          </div>
          <div className="text-center py-2 px-1 rounded-lg bg-muted/50">
            <p className="text-sm font-bold text-foreground">{totalLikes}</p>
            <p className="text-[10px] text-muted-foreground">Likes</p>
          </div>
          <div className="text-center py-2 px-1 rounded-lg bg-muted/50">
            <p className="text-sm font-bold text-foreground">{totalComments}</p>
            <p className="text-[10px] text-muted-foreground">Commentaires</p>
          </div>
          <div className="text-center py-2 px-1 rounded-lg bg-muted/50">
            <p className="text-sm font-bold text-foreground">{totalViews}</p>
            <p className="text-[10px] text-muted-foreground">Vues</p>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-border" />

      {/* Content Tabs */}
      {!isOwnProfile && profile?.is_private && !isFollowing ? (
        <div className="text-center py-16 px-4">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
          <h3 className="text-base font-semibold mb-1">Compte privé</h3>
          <p className="text-muted-foreground text-sm">Abonnez-vous pour voir les publications.</p>
        </div>
      ) : (
        <Tabs defaultValue="posts" className="px-4 sm:px-6 pb-24">
          <TabsList className={`w-full grid mb-4 ${isOwnProfile ? "grid-cols-3" : "grid-cols-2"} h-10`}>
            <TabsTrigger value="posts" className="flex items-center gap-1.5 text-xs">
              <Grid className="w-4 h-4" /> Posts
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1.5 text-xs">
              <Video className="w-4 h-4" /> Vidéos
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="favorites" className="flex items-center gap-1.5 text-xs">
                <Bookmark className="w-4 h-4" /> Favoris
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Grid className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Aucun post</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5">
                {posts.map((post) => (
                  <div key={post.id} className="aspect-square bg-muted overflow-hidden cursor-pointer group relative" onClick={() => handlePostClick(post.id, post.media_type)}>
                    {post.media_url && <img src={post.media_url} alt="" className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-3 text-white text-xs font-medium">
                        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{post.likes_count}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{post.comments_count}</span>
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
                <Video className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Aucune vidéo</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5">
                {videos.map((video) => (
                  <div key={video.id} className="aspect-[9/16] bg-muted overflow-hidden cursor-pointer relative" onClick={() => handlePostClick(video.id, "video")}>
                    {video.media_url && <video src={video.media_url} className="w-full h-full object-cover" muted />}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Video className="w-5 h-5 text-white" />
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
                  <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Aucun favori</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-0.5">
                  {favorites.map((fav) => (
                    <div key={fav.id} className="aspect-[9/16] bg-muted overflow-hidden cursor-pointer relative" onClick={() => handlePostClick(fav.id, fav.media_type)}>
                      {fav.media_url && (
                        fav.media_type === "video" ? (
                          <video src={fav.media_url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={fav.media_url} alt="" className="w-full h-full object-cover" />
                        )
                      )}
                      <div className="absolute top-1.5 right-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      )}

      <FollowersModal open={showFollowers} onOpenChange={setShowFollowers} userId={viewingUserId || ""} defaultTab={followersTab} />
      <LikersModal open={showLikers} onOpenChange={setShowLikers} userId={viewingUserId || ""} />
    </DesktopLayout>
  );
};

export default Profile;
