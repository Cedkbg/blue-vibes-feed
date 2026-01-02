import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/integrations/supabase/client";

interface VideoPost {
  id: string;
  media_url: string;
  caption: string | null;
  likes_count: number;
  created_at: string;
}

const Video = () => {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, media_url, caption, likes_count, created_at")
      .eq("media_type", "video")
      .not("media_url", "is", null)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVideos(data);
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
          // Only refetch if it's a video
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

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <TopBar title="Vidéos" />

      <div className="px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Aucune vidéo pour le moment</p>
            <p className="text-sm mt-2">Publiez votre première vidéo !</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {videos.map((video) => (
              <button
                key={video.id}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden group bg-muted"
              >
                <video
                  src={video.media_url}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Video Info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center justify-between text-white text-xs font-semibold">
                    <span>{formatViews(video.likes_count)} ❤️</span>
                  </div>
                  {video.caption && (
                    <p className="text-white text-xs mt-1 line-clamp-2">
                      {video.caption}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Video;