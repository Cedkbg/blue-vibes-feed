import { useState } from "react";
import { Heart, Share2, MoreHorizontal, MapPin, Briefcase } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CommentsSection, CommentsButton } from "./CommentsSection";
import { useLikes } from "@/hooks/useLikes";

interface FeedCardProps {
  id: string;
  user: {
    name: string;
    avatar: string;
    age?: number | null;
    profession?: string | null;
    location?: string | null;
    isFollowing?: boolean;
  };
  image?: string;
  mediaType?: string | null;
  caption: string;
  likes: number;
  comments: number;
}

export const FeedCard = ({ 
  id,
  user, 
  image, 
  mediaType,
  caption, 
  likes: initialLikes, 
  comments,
}: FeedCardProps) => {
  const { likesCount, isLiked, toggleLike, isLoading: likesLoading } = useLikes(id, initialLikes);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const isVideo = mediaType === "video";

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const hasImage = image && image.trim() !== "";

  return (
    <>
      <div className="relative bg-card rounded-2xl overflow-hidden shadow-lg mb-4">
        {hasImage ? (
          /* Media Container */
          <div className="relative aspect-[3/4] overflow-hidden bg-muted">
            {isVideo ? (
              <video
                src={image}
                className="w-full h-full object-cover"
                controls
                playsInline
                muted
                loop
              />
            ) : (
              <img 
                src={image} 
                alt={caption}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* User Info Overlay */}
            <div className="absolute bottom-0 left-0 right-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16">
              <div className="flex items-baseline gap-2">
                <h3 className="text-white font-bold text-xl">
                  {user.name}{user.age ? `, ${user.age}` : ""}
                </h3>
              </div>
              {(user.profession || user.location) && (
                <div className="flex items-center gap-2 mt-1 text-white/90 text-sm">
                  {user.profession && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {user.profession}
                    </span>
                  )}
                  {user.profession && user.location && <span>-</span>}
                  {user.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {user.location}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons - Right Side */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-5">
              {/* Avatar */}
              <button className="transition-transform active:scale-90">
                <Avatar className="w-11 h-11 ring-2 ring-white/50">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
              </button>

              {/* Like */}
              <button 
                onClick={toggleLike}
                disabled={likesLoading}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90 disabled:opacity-50"
              >
                <div className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors",
                  isLiked ? "bg-primary" : "bg-white/20"
                )}>
                  <Heart 
                    className={cn(
                      "w-5 h-5 transition-all",
                      isLiked ? "fill-white text-white" : "text-white"
                    )}
                  />
                </div>
                <span className="text-white text-xs font-semibold drop-shadow">
                  {formatCount(likesCount)}
                </span>
              </button>

              {/* Comments */}
              <CommentsButton 
                count={comments} 
                onClick={() => setCommentsOpen(true)} 
                variant="overlay"
              />

              {/* Share */}
              <button className="flex flex-col items-center gap-1 transition-transform active:scale-90">
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
              </button>

              {/* More */}
              <button className="transition-transform active:scale-90">
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MoreHorizontal className="w-5 h-5 text-white" />
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Text-only post */
          <div className="p-4">
            {/* User Header */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-bold">
                  {user.name}{user.age ? `, ${user.age}` : ""}
                </h3>
                {(user.profession || user.location) && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    {user.profession && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {user.profession}
                      </span>
                    )}
                    {user.profession && user.location && <span>-</span>}
                    {user.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {user.location}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Caption */}
            <p className="text-foreground text-base mb-4">{caption}</p>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleLike}
                disabled={likesLoading}
                className="flex items-center gap-2 transition-transform active:scale-90 disabled:opacity-50"
              >
                <Heart 
                  className={cn(
                    "w-5 h-5 transition-all",
                    isLiked ? "fill-primary text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="text-sm text-muted-foreground">{formatCount(likesCount)}</span>
              </button>
              <CommentsButton 
                count={comments} 
                onClick={() => setCommentsOpen(true)} 
                variant="inline"
              />
              <button>
                <Share2 className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="ml-auto">
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {hasImage && (
          <>
            {/* Match Button */}
            <div className="p-3">
              <Button className="w-full rounded-full font-bold text-base py-5">
                Match!
              </Button>
            </div>

            {/* Comment Input Trigger */}
            <div 
              className="px-3 pb-3 flex items-center gap-3 cursor-pointer"
              onClick={() => setCommentsOpen(true)}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted rounded-full px-4 py-2 text-sm text-muted-foreground">
                Ajouter un commentaire...
              </div>
            </div>
          </>
        )}
      </div>

      {/* Comments Sheet */}
      <CommentsSection 
        postId={id}
        initialCount={comments}
        isOpen={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </>
  );
};