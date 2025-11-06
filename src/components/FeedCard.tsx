import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface FeedCardProps {
  id: string;
  user: {
    name: string;
    avatar: string;
    isFollowing?: boolean;
  };
  image: string;
  caption: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export const FeedCard = ({ 
  user, 
  image, 
  caption, 
  likes: initialLikes, 
  comments,
  isLiked: initialIsLiked = false 
}: FeedCardProps) => {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="relative bg-card rounded-3xl overflow-hidden shadow-lg mb-4">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img 
          src={image} 
          alt={caption}
          className="w-full h-full object-cover"
        />
        
        {/* Caption Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-20">
          <p className="text-white font-medium text-lg mb-1">{user.name}</p>
          <p className="text-white/90 text-sm line-clamp-2">{caption}</p>
        </div>

        {/* Action Buttons */}
        <div className="absolute right-4 bottom-20 flex flex-col gap-4">
          <button 
            onClick={handleLike}
            className="flex flex-col items-center gap-1 transition-transform active:scale-90"
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors",
              isLiked ? "bg-red-500" : "bg-white/20"
            )}>
              <Heart 
                className={cn(
                  "w-6 h-6 transition-all",
                  isLiked ? "fill-white text-white" : "text-white"
                )}
              />
            </div>
            <span className="text-white text-xs font-semibold">
              {likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}
            </span>
          </button>

          <button className="flex flex-col items-center gap-1 transition-transform active:scale-90">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-semibold">{comments}</span>
          </button>

          <button className="flex flex-col items-center gap-1 transition-transform active:scale-90">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
          </button>

          <button className="transition-transform active:scale-90">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MoreHorizontal className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>

        {/* User Avatar with Follow Button */}
        <div className="absolute top-4 left-4 flex items-center gap-3">
          <Avatar className="w-10 h-10 ring-2 ring-white">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <Button
            size="sm"
            onClick={handleFollow}
            className={cn(
              "rounded-full px-6 font-semibold transition-all",
              isFollowing 
                ? "bg-white/20 text-white backdrop-blur-sm hover:bg-white/30" 
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      </div>
    </div>
  );
};
