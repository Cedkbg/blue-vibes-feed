import { Play } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";

const videos = [
  { id: 1, thumbnail: "https://images.unsplash.com/photo-1682687982360-3fbab65f9d50?w=400&h=600&fit=crop", views: "1.2M", duration: "0:45" },
  { id: 2, thumbnail: "https://images.unsplash.com/photo-1682687981674-0927add86f2b?w=400&h=600&fit=crop", views: "890K", duration: "1:23" },
  { id: 3, thumbnail: "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=400&h=600&fit=crop", views: "2.3M", duration: "0:38" },
  { id: 4, thumbnail: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=600&fit=crop", views: "1.5M", duration: "1:05" },
  { id: 5, thumbnail: "https://images.unsplash.com/photo-1682687221038-404cb8830901?w=400&h=600&fit=crop", views: "670K", duration: "0:52" },
  { id: 6, thumbnail: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=400&h=600&fit=crop", views: "3.1M", duration: "1:15" },
];

const Video = () => {
  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <TopBar title="Videos" />
      
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {videos.map((video) => (
            <button
              key={video.id}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden group"
            >
              <img 
                src={video.thumbnail} 
                alt={`Video ${video.id}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110">
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </div>
              </div>
              
              {/* Video Info */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center justify-between text-white text-xs font-semibold">
                  <span>{video.views} views</span>
                  <span className="bg-black/60 px-2 py-1 rounded">{video.duration}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Video;
