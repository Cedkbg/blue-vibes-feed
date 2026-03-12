import { useState, useEffect } from "react";
import { Settings, Grid, Video, ArrowLeft, Bookmark, UserPlus, UserCheck, Heart, Eye, MessageCircle, Clock, Lock, Share2, MapPin, Briefcase, Link2, Globe, BadgeCheck, Pencil, Camera, Mail, Phone, Plus, MoreHorizontal, ShieldCheck } from "lucide-react";
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
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

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

  const handlePostClick = (postId: string, mediaType?: string | null) => {
    if (mediaType === "video") navigate(`/video?id=${postId}`);
    else navigate(`/?highlight=${postId}`);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 5 Mo"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setCoverUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    toast.success("Photo de couverture mise à jour");
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
  const displayName = profile?.display_name || profile?.username || "Utilisateur";

  return (
    <DesktopLayout showRightSidebar={false} showTopBar={false}>
      <div className="max-w-4xl mx-auto pb-24">

        {/* ===== COVER PHOTO — LinkedIn style ===== */}
        <div className="relative group">
          <div className="h-32 sm:h-48 md:h-56 bg-gradient-to-r from-primary/60 via-accent/40 to-primary/30 rounded-b-xl overflow-hidden">
            {coverUrl ? (
              <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/50 via-accent/30 to-muted/40 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-60" />
              </div>
            )}
          </div>

          {/* Cover edit button */}
          {isOwnProfile && (
            <label className="absolute top-3 right-3 cursor-pointer">
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-sm border border-border hover:bg-background transition-colors opacity-0 group-hover:opacity-100">
                <Camera className="w-3.5 h-3.5" />
                Modifier la couverture
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>
          )}

          {/* Back button for other profiles */}
          {!isOwnProfile && (
            <Button size="icon" variant="ghost" className="absolute top-3 left-3 text-primary-foreground bg-background/30 backdrop-blur-sm hover:bg-background/50 rounded-full h-8 w-8" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}

          {/* Settings for own profile */}
          {isOwnProfile && (
            <Button size="icon" variant="ghost" className="absolute top-3 left-3 text-foreground bg-background/80 backdrop-blur-sm hover:bg-background rounded-full h-8 w-8 border border-border opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate("/settings")}>
              <Settings className="w-4 h-4" />
            </Button>
          )}

          {/* Avatar overlapping cover */}
          <div className="absolute -bottom-16 left-5 sm:left-8">
            <div className="relative">
              <Avatar className="w-32 h-32 ring-4 ring-background shadow-lg">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                  {profile?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {profile?.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                  <BadgeCheck className="w-7 h-7 text-primary" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== PROFILE INFO SECTION ===== */}
        <div className="pt-20 px-5 sm:px-8">

          {/* Top row: Name + action buttons */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground truncate">{displayName}</h1>
                {profile?.is_private && <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </div>

              {/* Headline / Profession */}
              {profile?.profession && (
                <p className="text-base text-foreground/80 mt-0.5">{profile.profession}</p>
              )}

              {/* Location + language */}
              <div className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground mt-1">
                {profile?.location && <span>{profile.location}</span>}
                {profile?.location && profile?.language && <span>·</span>}
                {profile?.language && <span>{profile.language}</span>}
                {(profile?.location || profile?.language) && (
                  <>
                    <span>·</span>
                    <button className="text-primary font-medium hover:underline" onClick={() => setShowFollowers(true)}>Coordonnées</button>
                  </>
                )}
              </div>

              {/* External link */}
              {profile?.external_link && (
                <a href={profile.external_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1">
                  <Link2 className="w-3.5 h-3.5" />
                  {profile.external_link.replace(/^https?:\/\//, '').split('/')[0]}
                </a>
              )}

              {/* Connections / followers count */}
              <div className="flex items-center gap-4 mt-2">
                <button className="text-sm hover:underline" onClick={() => { setFollowersTab("followers"); setShowFollowers(true); }}>
                  <span className="font-semibold text-primary">{followersCount}</span> <span className="text-muted-foreground">abonnés</span>
                </button>
                <button className="text-sm hover:underline" onClick={() => { setFollowersTab("following"); setShowFollowers(true); }}>
                  <span className="font-semibold text-primary">{followingCount}</span> <span className="text-muted-foreground">abonnements</span>
                </button>
              </div>
            </div>

            {/* Share + More */}
            <div className="flex items-center gap-1.5 mt-1">
              <Button size="icon" variant="outline" className="rounded-full h-9 w-9" onClick={handleShareProfile}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="rounded-full h-9 w-9">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* ===== ACTION BUTTONS ROW — LinkedIn style ===== */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {isOwnProfile ? (
              <>
                {/* Badge de vérification */}
                {!profile?.is_verified && (
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs border-primary text-primary hover:bg-primary/5" onClick={() => navigate("/certified")}>
                    <ShieldCheck className="w-4 h-4" />
                    Ajouter un badge de vérification
                  </Button>
                )}

                <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs">
                      <Pencil className="w-3.5 h-3.5" />
                      Améliorer le profil
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
                    <EditProfileSheet profile={profile} userId={user?.id || ""} onUpdate={() => fetchProfile()} onClose={() => setIsEditOpen(false)} />
                  </SheetContent>
                </Sheet>

                <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs" onClick={handleShareProfile}>
                  <Share2 className="w-3.5 h-3.5" />
                  Partager le profil
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  className={`rounded-full gap-1.5 text-xs ${isFollowing || requestStatus === "pending" ? "bg-muted text-foreground hover:bg-muted/80" : ""}`}
                  onClick={toggleFollow}
                  disabled={isFollowLoading}
                >
                  {isFollowing ? <><UserCheck className="w-3.5 h-3.5" /> Abonné</> : requestStatus === "pending" ? <><Clock className="w-3.5 h-3.5" /> En attente</> : <><UserPlus className="w-3.5 h-3.5" /> Se connecter</>}
                </Button>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs" onClick={() => navigate(`/chat/${viewingUserId}`)}>
                  <MessageCircle className="w-3.5 h-3.5" /> Message
                </Button>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs">
                  <MoreHorizontal className="w-3.5 h-3.5" /> Plus
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ===== BIO / À PROPOS SECTION ===== */}
        {profile?.bio && (
          <div className="mx-5 sm:mx-8 mt-5 p-4 rounded-xl border border-border bg-card">
            <h2 className="text-base font-semibold text-foreground mb-2">À propos</h2>
            <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* ===== ACTIVITY / STATS SECTION ===== */}
        <div className="mx-5 sm:mx-8 mt-4 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Activité</h2>
            <button className="text-sm text-primary font-medium hover:underline" onClick={() => setShowLikers(true)}>
              Voir tout
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center py-3 rounded-lg bg-muted/40">
              <p className="text-lg font-bold text-foreground">{totalPosts}</p>
              <p className="text-[11px] text-muted-foreground">Publications</p>
            </div>
            <div className="text-center py-3 rounded-lg bg-muted/40">
              <p className="text-lg font-bold text-foreground">{totalLikes}</p>
              <p className="text-[11px] text-muted-foreground">J'aime</p>
            </div>
            <div className="text-center py-3 rounded-lg bg-muted/40">
              <p className="text-lg font-bold text-foreground">{totalComments}</p>
              <p className="text-[11px] text-muted-foreground">Commentaires</p>
            </div>
            <div className="text-center py-3 rounded-lg bg-muted/40">
              <p className="text-lg font-bold text-foreground">{totalViews}</p>
              <p className="text-[11px] text-muted-foreground">Vues</p>
            </div>
          </div>
        </div>

        {/* ===== INFORMATIONS CARD (like LinkedIn right sidebar) ===== */}
        <div className="mx-5 sm:mx-8 mt-4 p-4 rounded-xl border border-border bg-card">
          <h2 className="text-base font-semibold text-foreground mb-3">Informations</h2>
          <div className="space-y-3 text-sm">
            {profile?.profession && (
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{profile.profession}</p>
                  <p className="text-xs text-muted-foreground">Profession</p>
                </div>
              </div>
            )}
            {profile?.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{profile.location}</p>
                  <p className="text-xs text-muted-foreground">Localisation</p>
                </div>
              </div>
            )}
            {profile?.language && (
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{profile.language}</p>
                  <p className="text-xs text-muted-foreground">Langue du profil</p>
                </div>
              </div>
            )}
            {profile?.external_link && (
              <div className="flex items-start gap-3">
                <Link2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <a href={profile.external_link} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline break-all">
                    {profile.external_link.replace(/^https?:\/\//, '')}
                  </a>
                  <p className="text-xs text-muted-foreground">Profil public et URL</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">@{profile?.username || "user"}</p>
                <p className="text-xs text-muted-foreground">Nom d'utilisateur</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== CONTENT TABS ===== */}
        <div className="mx-5 sm:mx-8 mt-4">
          {!isOwnProfile && profile?.is_private && !isFollowing ? (
            <div className="text-center py-16 px-4 rounded-xl border border-border bg-card">
              <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
              <h3 className="text-base font-semibold mb-1">Compte privé</h3>
              <p className="text-muted-foreground text-sm">Abonnez-vous pour voir les publications.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Tabs defaultValue="posts">
                <TabsList className={`w-full grid ${isOwnProfile ? "grid-cols-3" : "grid-cols-2"} h-11 rounded-none border-b border-border bg-transparent`}>
                  <TabsTrigger value="posts" className="flex items-center gap-1.5 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                    <Grid className="w-4 h-4" /> Publications
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="flex items-center gap-1.5 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                    <Video className="w-4 h-4" /> Vidéos
                  </TabsTrigger>
                  {isOwnProfile && (
                    <TabsTrigger value="favorites" className="flex items-center gap-1.5 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                      <Bookmark className="w-4 h-4" /> Favoris
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="posts" className="mt-0 p-0">
                  {posts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Grid className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Aucune publication</p>
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

                <TabsContent value="videos" className="mt-0 p-0">
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
                  <TabsContent value="favorites" className="mt-0 p-0">
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
            </div>
          )}
        </div>
      </div>

      <FollowersModal open={showFollowers} onOpenChange={setShowFollowers} userId={viewingUserId || ""} defaultTab={followersTab} />
      <LikersModal open={showLikers} onOpenChange={setShowLikers} userId={viewingUserId || ""} />
    </DesktopLayout>
  );
};

export default Profile;
