import { useEffect, useState, useRef } from "react";
import { 
  Play, Heart, MessageCircle, Share2, Volume2, VolumeX, 
  Bookmark, Download, ChevronDown, ChevronUp,
  Send, Link2, Plus, Repeat2, Check, Hash, Users
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLikes } from "@/hooks/useLikes";
import { useFavorites } from "@/hooks/useFavorites";
import { useFollows } from "@/hooks/useFollows";
import { useReposts } from "@/hooks/useReposts";
import { useAuth } from "@/hooks/useAuth";
import { CommentsSection } from "@/components/CommentsSection";
import { VideoWatermark } from "@/components/VideoWatermark";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SourceInfo {
  type: "channel" | "group" | "community";
  id: string;
  name: string;
}

interface VideoPost {
  id: string;
  user_id: string;
  media_url: string;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  channel_id: string | null;
  group_id: string | null;
  community_id: string | null;
  profile?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  source?: SourceInfo | null;
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
      .select("id, user_id, media_url, caption, likes_count, comments_count, created_at, channel_id, group_id, community_id")
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

      // Fetch source names
      const channelIds = [...new Set(postsData.filter(p => p.channel_id).map(p => p.channel_id!))];
      const groupIds = [...new Set(postsData.filter(p => p.group_id).map(p => p.group_id!))];
      const communityIds = [...new Set(postsData.filter(p => p.community_id).map(p => p.community_id!))];

      const channelNamesMap = new Map<string, string>();
      const groupNamesMap = new Map<string, string>();
      const communityNamesMap = new Map<string, string>();

      const [channelsRes, groupsRes, communitiesRes] = await Promise.all([
        channelIds.length > 0 
          ? supabase.from("channels").select("id, name").in("id", channelIds)
          : { data: [] },
        groupIds.length > 0
          ? supabase.from("groups").select("id, name").in("id", groupIds)
          : { data: [] },
        communityIds.length > 0
          ? supabase.from("communities").select("id, name").in("id", communityIds)
          : { data: [] },
      ]);

      channelsRes.data?.forEach(c => channelNamesMap.set(c.id, c.name));
      groupsRes.data?.forEach(g => groupNamesMap.set(g.id, g.name));
      communitiesRes.data?.forEach(c => communityNamesMap.set(c.id, c.name));

      const videosWithProfiles = postsData.map((video) => {
        let source: SourceInfo | null = null;
        if (video.channel_id && channelNamesMap.has(video.channel_id)) {
          source = { type: "channel", id: video.channel_id, name: channelNamesMap.get(video.channel_id)! };
        } else if (video.group_id && groupNamesMap.has(video.group_id)) {
          source = { type: "group", id: video.group_id, name: groupNamesMap.get(video.group_id)! };
        } else if (video.community_id && communityNamesMap.has(video.community_id)) {
          source = { type: "community", id: video.community_id, name: communityNamesMap.get(video.community_id)! };
        }

        return {
          ...video,
          profile: profilesMap.get(video.user_id),
          source,
        };
      });

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
          className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLiked, toggleLike } = useLikes(video.id, video.likes_count);
  const { isFavorited, toggleFavorite } = useFavorites(video.id);
  const { isFollowing, toggleFollow, isLoading: isFollowLoading } = useFollows(video.user_id);
  const { repostVideo, isLoading: isRepostLoading } = useReposts();
  const [localLikes, setLocalLikes] = useState(video.likes_count);
  const [localComments, setLocalComments] = useState(video.comments_count);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRepostOpen, setIsRepostOpen] = useState(false);
  const [repostComment, setRepostComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOutro, setShowOutro] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isOwnVideo = user?.id === video.user_id;

  // Reset video when leaving and returning + track time for progress bar
  useEffect(() => {
    const videoEl = videoRefs.current[index];
    if (!videoEl) return;

    const handlePlay = () => {
      if (!hasPlayedIntro) {
        setShowIntro(true);
        setHasPlayedIntro(true);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoEl.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(videoEl.duration);
      // Reset to beginning when video loads
      videoEl.currentTime = 0;
      setCurrentTime(0);
    };

    const handleEnded = () => {
      setShowIntro(false);
    };

    videoEl.addEventListener("play", handlePlay);
    videoEl.addEventListener("timeupdate", handleTimeUpdate);
    videoEl.addEventListener("loadedmetadata", handleLoadedMetadata);

    // Reset when becoming active video
    if (isPlaying) {
      videoEl.currentTime = 0;
      setCurrentTime(0);
      setHasPlayedIntro(false);
      setShowIntro(false);
    }

    return () => {
      videoEl.removeEventListener("play", handlePlay);
      videoEl.removeEventListener("timeupdate", handleTimeUpdate);
      videoEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [index, hasPlayedIntro, videoRefs, isPlaying]);

  // Handle video ended event for outro
  useEffect(() => {
    const videoEl = videoRefs.current[index];
    if (!videoEl) return;

    const handleEnded = () => {
      setShowOutro(true);
      // Hide outro after 2 seconds and restart video
      setTimeout(() => {
        setShowOutro(false);
        videoEl.currentTime = 0;
        if (isPlaying) {
          videoEl.play().catch(() => {});
        }
      }, 2000);
    };

    // Only show outro if video doesn't loop
    videoEl.loop = false;
    videoEl.addEventListener("ended", handleEnded);

    return () => {
      videoEl.removeEventListener("ended", handleEnded);
    };
  }, [index, isPlaying, videoRefs]);

  // Subscribe to comment count changes
  useEffect(() => {
    const channel = supabase
      .channel(`video-comments-${video.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: `id=eq.${video.id}`,
        },
        (payload) => {
          if (payload.new) {
            setLocalComments((payload.new as any).comments_count || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [video.id]);

  const handleSourceClick = () => {
    if (!video.source) return;
    switch (video.source.type) {
      case "channel":
        navigate(`/channel/${video.source.id}`);
        break;
      case "group":
        navigate(`/group/${video.source.id}`);
        break;
      case "community":
        navigate(`/community/${video.source.id}`);
        break;
    }
  };

  const getSourceIcon = () => {
    if (!video.source) return null;
    switch (video.source.type) {
      case "channel":
        return <Hash className="w-3 h-3" />;
      case "group":
      case "community":
        return <Users className="w-3 h-3" />;
    }
  };

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

  const handleRepost = async () => {
    if (!user) {
      toast.error("Connectez-vous pour reposter");
      return;
    }
    await repostVideo(video.id, repostComment);
    setRepostComment("");
    setIsRepostOpen(false);
    toast.success("Vidéo repostée !");
  };

  const caption = video.caption || "";
  const shouldTruncate = caption.length > 100;
  const displayCaption = isExpanded ? caption : caption.slice(0, 100);

  return (
    <>
      <div
        className="relative w-full snap-start snap-always flex items-center justify-center"
        style={{ height: "100vh" }}
      >
        {/* Video */}
        <video
          ref={(el) => (videoRefs.current[index] = el)}
          src={video.media_url}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          muted={isMuted}
          playsInline
          onClick={onTogglePlay}
        />

        {/* CedLite Watermark with progress */}
        <VideoWatermark 
          showOutro={showOutro} 
          showIntro={showIntro} 
          creatorName={video.profile?.display_name || video.profile?.username || ""}
          currentTime={currentTime}
          duration={duration}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Play/Pause indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Right side actions - compact spacing */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-3 z-10">
          {/* Profile avatar with follow button */}
          <div className="relative">
            <button onClick={() => onProfileClick(video.user_id)}>
              <Avatar className="w-11 h-11 border-2 border-white shadow-lg">
                <AvatarImage src={video.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {video.profile?.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </button>
            {!isOwnVideo && (
              <button
                onClick={toggleFollow}
                disabled={isFollowLoading}
                className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-md ${
                  isFollowing ? "bg-white text-primary" : "bg-primary text-white"
                }`}
              >
                {isFollowing ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Like */}
          <button onClick={handleLike} className="flex flex-col items-center gap-0.5">
            <div className={`w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center ${isLiked ? "text-red-500" : "text-white"}`}>
              <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
            </div>
            <span className="text-white text-xs font-medium">{formatCount(localLikes)}</span>
          </button>

          {/* Comments */}
          <button onClick={() => setIsCommentsOpen(true)} className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-white text-xs font-medium">{formatCount(localComments)}</span>
          </button>

          {/* Repost */}
          <button onClick={() => setIsRepostOpen(true)} className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
              <Repeat2 className="w-6 h-6" />
            </div>
            <span className="text-white text-xs font-medium">Reposter</span>
          </button>

          {/* Share */}
          <button onClick={() => setIsShareOpen(true)} className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
              <Share2 className="w-6 h-6" />
            </div>
            <span className="text-white text-xs font-medium">Partager</span>
          </button>

          {/* Favorite/Save */}
          <button onClick={toggleFavorite} className="flex flex-col items-center gap-0.5">
            <div className={`w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center ${isFavorited ? "text-yellow-400" : "text-white"}`}>
              <Bookmark className={`w-6 h-6 ${isFavorited ? "fill-current" : ""}`} />
            </div>
          </button>

          {/* Download */}
          <button onClick={handleDownload} className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
              <Download className="w-5 h-5" />
            </div>
          </button>

          {/* Mute/Unmute */}
          <button onClick={onToggleMute} className="flex flex-col items-center gap-0.5">
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </div>
          </button>
        </div>

        {/* Bottom info - better spacing */}
        <div className="absolute left-4 right-16 bottom-20 z-10">
          {/* Source badge */}
          {video.source && (
            <button 
              onClick={handleSourceClick}
              className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full mb-2 hover:bg-white/30 transition-colors"
            >
              {getSourceIcon()}
              <span>{video.source.name}</span>
            </button>
          )}
          
          <button
            onClick={() => onProfileClick(video.user_id)}
            className="flex items-center gap-2 mb-2"
          >
            <span className="text-white font-bold text-base drop-shadow-lg">
              @{video.profile?.username || video.profile?.display_name || "utilisateur"}
            </span>
          </button>
          {caption && (
            <div>
              <p className="text-white text-sm drop-shadow-md">
                {displayCaption}
                {shouldTruncate && !isExpanded && "..."}
              </p>
              {shouldTruncate && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-white/80 text-xs mt-1 hover:text-white transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Voir moins
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
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
        initialCount={localComments}
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
            <button onClick={() => handleShare("copy")} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Link2 className="w-6 h-6" />
              </div>
              <span className="text-xs">Copier</span>
            </button>
            <button onClick={() => handleShare("whatsapp")} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs">WhatsApp</span>
            </button>
            <button onClick={() => handleShare("telegram")} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs">Telegram</span>
            </button>
            <button onClick={() => handleShare("facebook")} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">f</span>
              </div>
              <span className="text-xs">Facebook</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Repost Sheet */}
      <Sheet open={isRepostOpen} onOpenChange={setIsRepostOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="text-center">Reposter</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <Input
              placeholder="Ajouter un commentaire (optionnel)..."
              value={repostComment}
              onChange={(e) => setRepostComment(e.target.value)}
            />
            <Button onClick={handleRepost} disabled={isRepostLoading} className="w-full">
              <Repeat2 className="w-4 h-4 mr-2" />
              Reposter
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Video;
