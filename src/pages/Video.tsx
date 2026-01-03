import { useEffect, useState, useRef } from "react";
import { Play, Heart, MessageCircle, Share2, Volume2, VolumeX, Pause } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLikes } from "@/hooks/useLikes";
import { useAuth } from "@/hooks/useAuth";

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
      // Get unique user IDs
      const userIds = [...new Set(postsData.map((p) => p.user_id))];

      // Fetch profiles
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

    // Subscribe to real-time updates for videos
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

  // Handle scroll snap
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

  // Play/pause videos based on current index
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
  const [localLikes, setLocalLikes] = useState(video.likes_count);

  const handleLike = async () => {
    if (!user) return;
    const wasLiked = isLiked;
    await toggleLike();
    setLocalLikes((prev) => (wasLiked ? prev - 1 : prev + 1));
  };

  return (
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
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
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
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
            <MessageCircle className="w-7 h-7" />
          </div>
          <span className="text-white text-xs font-semibold">{formatCount(video.comments_count)}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
            <Share2 className="w-7 h-7" />
          </div>
          <span className="text-white text-xs font-semibold">Partager</span>
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
        {video.caption && (
          <p className="text-white text-sm line-clamp-3">{video.caption}</p>
        )}
      </div>
    </div>
  );
};

export default Video;