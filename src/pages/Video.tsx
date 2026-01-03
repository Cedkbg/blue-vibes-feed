import { useEffect, useState, useRef } from "react";
import { 
  Play, Heart, MessageCircle, Share2, Volume2, VolumeX, Pause, 
  Bookmark, Download, MoreHorizontal, ChevronDown, ChevronUp,
  Copy, Send, Link2
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLikes } from "@/hooks/useLikes";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { CommentsSection } from "@/components/CommentsSection";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface VideoPost {
  id: string;
  user_id: string;
  media_url: string;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

const Video = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const fetchVideos = async () => {
    const { data: postsData, error } = await supabase
      .from("posts")
      .select("id, user_id, media_url, caption, likes_count, comments_count, created_at")
      .eq("media_type", "video")
      .not("media_url", "is", null)
      .order("created_at", { ascending: false });

    if (!error && postsData) {
      const userIds = [...new Set(postsData.map((p) => p.user_id))];

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map();
      profilesData?.forEach((p) => profilesMap.set(p.id, p));

      const videosWithProfiles = postsData.map((video) => ({
        ...video,
        profile: profilesMap.get(video.user_id),
      }));

      setVideos(videosWithProfiles);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVideos();

    const channel = supabase
      .channel("videos-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          if (
            payload.eventType === "DELETE" ||
            (payload.new as any)?.media_type === "video"
          ) {
            fetchVideos();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      const newIndex = Math.round(scrollTop / height);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
        setCurrentIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentIndex, videos.length]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex && isPlaying) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex, isPlaying]);

  const toggleMute = () => setIsMuted(!isMuted);
  const togglePlay = () => setIsPlaying(!isPlaying);

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen bg-black">
      <TopBar title="Vidéos" />

      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex items-center justify-center h-screen text-white">
          <div className="text-center">
            <p className="text-muted-foreground">Aucune vidéo pour le moment</p>
            <p className="text-sm mt-2 text-muted-foreground">Publiez votre première vidéo !</p>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide pt-16 pb-20"
          style={{ scrollSnapType: "y mandatory" }}
        >
          {videos.map((video, index) => (
            <VideoItem
              key={video.id}
              video={video}
              index={index}
              isMuted={isMuted}
              isPlaying={isPlaying && index === currentIndex}
              videoRefs={videoRefs}
              onToggleMute={toggleMute}
              onTogglePlay={togglePlay}
              onProfileClick={handleProfileClick}
              formatCount={formatCount}
            />
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

interface VideoItemProps {
  video: VideoPost;
  index: number;
  isMuted: boolean;
  isPlaying: boolean;
  videoRefs: React.MutableRefObject<(HTMLVideoElement | null)[]>;
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onProfileClick: (userId: string) => void;
  formatCount: (count: number) => string;
}

const VideoItem = ({
  video,
  index,
  isMuted,
  isPlaying,
  videoRefs,
  onToggleMute,
  onTogglePlay,
  onProfileClick,
  formatCount,
}: VideoItemProps) => {
  const { user } = useAuth();
  const { isLiked, toggleLike } = useLikes(video.id, video.likes_count);
  const { isFavorited, toggleFavorite } = useFavorites(video.id);
  const [localLikes, setLocalLikes] = useState(video.likes_count);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error("Connectez-vous pour aimer");
      return;
    }
    const wasLiked = isLiked;
    await toggleLike();
    setLocalLikes((prev) => (wasLiked ? prev - 1 : prev + 1));
  };

  const handleDownload = async () => {
    try {
      toast.info("Téléchargement en cours...");
      const response = await fetch(video.media_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `video-${video.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Vidéo téléchargée !");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleShare = (platform: string) => {
    const videoUrl = `${window.location.origin}/video?id=${video.id}`;
    const text = video.caption || "Regardez cette vidéo sur CedLite !";

    switch (platform) {
      case "copy":
        navigator.clipboard.writeText(videoUrl);
        toast.success("Lien copié !");
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + videoUrl)}`, "_blank");
        break;
      case "telegram":
        window.open(`https://t.me/share/url?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(text)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(text)}`, "_blank");
        break;
    }
    setIsShareOpen(false);
  };

  const caption = video.caption || "";
  const shouldTruncate = caption.length > 100;
  const displayCaption = isExpanded ? caption : caption.slice(0, 100);

  return (
    <>
      <div
        className="relative h-screen w-full snap-start snap-always flex items-center justify-center"
        style={{ height: "calc(100vh - 8rem)" }}
      >
        {/* Video */}
        <video
          ref={(el) => (videoRefs.current[index] = el)}
          src={video.media_url}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          onClick={onTogglePlay}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Play/Pause indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Right side actions */}
        <div className="absolute right-3 bottom-32 flex flex-col items-center gap-4">
          {/* Profile avatar */}
          <button
            onClick={() => onProfileClick(video.user_id)}
            className="relative"
          >
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarImage src={video.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {video.profile?.display_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Like */}
          <button onClick={handleLike} className="flex flex-col items-center gap-1">
            <div className={`w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center ${isLiked ? "text-red-500" : "text-white"}`}>
              <Heart className={`w-7 h-7 ${isLiked ? "fill-current" : ""}`} />
            </div>
            <span className="text-white text-xs font-semibold">{formatCount(localLikes)}</span>
          </button>

          {/* Comments */}
          <button 
            onClick={() => setIsCommentsOpen(true)} 
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
              <MessageCircle className="w-7 h-7" />
            </div>
            <span className="text-white text-xs font-semibold">{formatCount(video.comments_count)}</span>
          </button>

          {/* Share */}
          <button 
            onClick={() => setIsShareOpen(true)} 
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
              <Share2 className="w-7 h-7" />
            </div>
            <span className="text-white text-xs font-semibold">Partager</span>
          </button>

          {/* Favorite/Save */}
          <button onClick={toggleFavorite} className="flex flex-col items-center gap-1">
            <div className={`w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center ${isFavorited ? "text-yellow-400" : "text-white"}`}>
              <Bookmark className={`w-7 h-7 ${isFavorited ? "fill-current" : ""}`} />
            </div>
            <span className="text-white text-xs font-semibold">Enregistrer</span>
          </button>

          {/* Download */}
          <button onClick={handleDownload} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
              <Download className="w-6 h-6" />
            </div>
          </button>

          {/* Mute/Unmute */}
          <button onClick={onToggleMute} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </div>
          </button>
        </div>

        {/* Bottom info */}
        <div className="absolute left-4 right-20 bottom-24">
          <button
            onClick={() => onProfileClick(video.user_id)}
            className="flex items-center gap-2 mb-2"
          >
            <span className="text-white font-bold text-base">
              @{video.profile?.username || video.profile?.display_name || "utilisateur"}
            </span>
          </button>
          {caption && (
            <div>
              <p className="text-white text-sm">
                {displayCaption}
                {shouldTruncate && !isExpanded && "..."}
              </p>
              {shouldTruncate && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-white/70 text-xs mt-1 hover:text-white transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Voir moins
                    </>
                  ) : (
                    <>
                      <MoreHorizontal className="w-4 h-4" />
                      Lire plus
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments Sheet */}
      <CommentsSection
        postId={video.id}
        initialCount={video.comments_count}
        isOpen={isCommentsOpen}
        onOpenChange={setIsCommentsOpen}
      />

      {/* Share Sheet */}
      <Sheet open={isShareOpen} onOpenChange={setIsShareOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="text-center">Partager</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-4 py-6">
            <button
              onClick={() => handleShare("copy")}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Link2 className="w-6 h-6" />
              </div>
              <span className="text-xs">Copier</span>
            </button>
            <button
              onClick={() => handleShare("whatsapp")}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs">WhatsApp</span>
            </button>
            <button
              onClick={() => handleShare("telegram")}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs">Telegram</span>
            </button>
            <button
              onClick={() => handleShare("facebook")}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">f</span>
              </div>
              <span className="text-xs">Facebook</span>
            </button>
            <button
              onClick={() => handleShare("twitter")}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center">
                <span className="text-white font-bold text-lg">𝕏</span>
              </div>
              <span className="text-xs">Twitter</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Video;
