import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Share2, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import cedliteLogo from "@/assets/cedlite-logo.png";
import { CommentsSection } from "@/components/CommentsSection";
import { useAuth } from "@/hooks/useAuth";

interface Post {
  id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    if (postId) fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, caption, media_url, media_type, likes_count, comments_count, created_at, user_id")
      .eq("id", postId!)
      .maybeSingle();

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles_public")
      .select("username, display_name, avatar_url")
      .eq("id", data.user_id)
      .maybeSingle();

    setPost({ ...data, profile: profileData || undefined });
    setLoading(false);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = post?.caption?.slice(0, 100) || `Post de ${post?.profile?.display_name || post?.profile?.username || "CedLite"}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `CedLite – ${shareText}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    navigator.clipboard.writeText(shareUrl);
    toast.success("Lien copié !");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <img src={cedliteLogo} alt="CedLite" className="w-16 h-16" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <img src={cedliteLogo} alt="CedLite" className="w-20 h-20" />
        <h2 className="text-2xl font-bold">Publication introuvable</h2>
        <p className="text-muted-foreground">Ce contenu n'existe pas ou a été supprimé.</p>
        <Button onClick={() => navigate("/")}>Retour à CedLite</Button>
      </div>
    );
  }

  const isVideo = post.media_type === "video";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={cedliteLogo} alt="CedLite" className="w-7 h-7" />
          <span className="font-bold text-lg">CedLite</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="text-primary-foreground hover:bg-primary-foreground/10"
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Author */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(`/profile/${post.user_id}`)}>
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage src={post.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {(post.profile?.display_name || post.profile?.username || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
          <div>
            <button
              onClick={() => navigate(`/profile/${post.user_id}`)}
              className="font-semibold hover:underline"
            >
              {post.profile?.display_name || post.profile?.username || "Utilisateur"}
            </button>
            {post.profile?.username && (
              <p className="text-xs text-muted-foreground">@{post.profile.username}</p>
            )}
          </div>
        </div>

        {/* Media */}
        {post.media_url && (
          <div className="w-full bg-muted">
            {isVideo ? (
              <video
                src={post.media_url}
                className="w-full max-h-[70vh] object-contain"
                controls
                playsInline
              />
            ) : (
              <img
                src={post.media_url}
                alt={post.caption || ""}
                className="w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="px-4 py-3">
            <p className="text-foreground whitespace-pre-line">{post.caption}</p>
          </div>
        )}

        {/* Stats & Actions */}
        <div className="flex items-center gap-6 px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="w-5 h-5" />
            <span className="text-sm">{post.likes_count}</span>
          </div>
          <button
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setCommentsOpen(true)}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments_count} commentaires</span>
          </button>
          <button
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors ml-auto"
            onClick={handleShare}
          >
            <Copy className="w-4 h-4" />
            <span className="text-sm">Partager</span>
          </button>
        </div>

        {/* Open in app CTA */}
        <div className="mx-4 my-4 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={cedliteLogo} alt="CedLite" className="w-10 h-10" />
            <div>
              <p className="font-semibold text-sm">Voir sur CedLite</p>
              <p className="text-xs text-muted-foreground">Rejoins la communauté</p>
            </div>
          </div>
          <Button size="sm" onClick={() => user ? navigate("/") : navigate("/auth")}>
            <ExternalLink className="w-4 h-4 mr-1" />
            Ouvrir
          </Button>
        </div>
      </div>

      <CommentsSection
        postId={post.id}
        isOpen={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </div>
  );
};

export default PostDetail;
