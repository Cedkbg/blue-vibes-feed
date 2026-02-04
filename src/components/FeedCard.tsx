import { useState, useEffect } from "react";
import { Heart, Share2, MoreHorizontal, MapPin, Briefcase, ChevronDown, Link2, Hash, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CommentsSection, CommentsButton } from "./CommentsSection";
import { useLikes } from "@/hooks/useLikes";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface SourceInfo {
  type: "channel" | "group" | "community";
  id: string;
  name: string;
}

interface FeedCardProps {
  id: string;
  userId: string;
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
  source?: SourceInfo | null;
}

export const FeedCard = ({ 
  id,
  userId,
  user, 
  image, 
  mediaType,
  caption, 
  likes: initialLikes, 
  comments: initialComments,
  source,
}: FeedCardProps) => {
  const navigate = useNavigate();
  const { likesCount, isLiked, toggleLike, isLoading: likesLoading } = useLikes(id, initialLikes);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentsCount, setCommentsCount] = useState(initialComments);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const isVideo = mediaType === "video";

  const handleSourceClick = () => {
    if (!source) return;
    switch (source.type) {
      case "channel":
        navigate(`/channel/${source.id}`);
        break;
      case "group":
        navigate(`/group/${source.id}`);
        break;
      case "community":
        navigate(`/community/${source.id}`);
        break;
    }
  };

  const getSourceIcon = () => {
    if (!source) return null;
    switch (source.type) {
      case "channel":
        return <Hash className="w-3 h-3" />;
      case "group":
      case "community":
        return <Users className="w-3 h-3" />;
    }
  };

  // Fetch real-time comments count
  useEffect(() => {
    const fetchCommentsCount = async () => {
      const { data } = await supabase
        .from("posts")
        .select("comments_count")
        .eq("id", id)
        .single();
      
      if (data) {
        setCommentsCount(data.comments_count);
      }
    };
    
    fetchCommentsCount();
    
    // Subscribe to changes
    const channel = supabase
      .channel(`post-comments-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${id}`
        },
        () => fetchCommentsCount()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `id=eq.${id}`
        },
        (payload: any) => {
          if (payload.new?.comments_count !== undefined) {
            setCommentsCount(payload.new.comments_count);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleProfileClick = () => {
    navigate(`/profile/${userId}`);
  };
  
  const shouldTruncate = caption.length > 100;
  const displayCaption = shouldTruncate && !isExpanded 
    ? caption.slice(0, 100) + "..." 
    : caption;

  const handleShare = async (platform?: string) => {
    const shareUrl = `${window.location.origin}/post/${id}`;
    const shareText = caption.slice(0, 100) || `Post de ${user.name}`;
    
    if (!platform) {
      // Try native share first
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Post de ${user.name}`,
            text: shareText,
            url: shareUrl,
          });
          return;
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            copyToClipboard(shareUrl);
          }
          return;
        }
      }
      copyToClipboard(shareUrl);
      return;
    }

    switch (platform) {
      case "copy":
        copyToClipboard(shareUrl);
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
        break;
      case "telegram":
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
        break;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Lien copié dans le presse-papiers !");
  };

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
          /* Media Container - Adaptive sizing */
          <div className="relative w-full overflow-hidden bg-muted" style={{ maxHeight: '70vh' }}>
            {isVideo ? (
              <video
                src={image}
                className="w-full h-auto max-h-[70vh] object-contain"
                controls
                playsInline
                muted
                loop
              />
            ) : (
              <img 
                src={image} 
                alt={caption}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            )}
            
            {/* User Info Overlay */}
            <div className="absolute bottom-0 left-0 right-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16">
              {source && (
                <button 
                  onClick={handleSourceClick}
                  className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full mb-2 hover:bg-white/30 transition-colors"
                >
                  {getSourceIcon()}
                  <span>{source.name}</span>
                </button>
              )}
              <button onClick={handleProfileClick} className="flex items-baseline gap-2 text-left">
                <h3 className="text-white font-bold text-xl hover:underline">
                  {user.name}{user.age ? `, ${user.age}` : ""}
                </h3>
              </button>
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
              <button onClick={handleProfileClick} className="transition-transform active:scale-90">
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
                count={commentsCount} 
                onClick={() => setCommentsOpen(true)} 
                variant="overlay"
              />

              {/* Share */}
              <button 
                onClick={() => setIsShareOpen(true)}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90"
              >
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
              </button>

              {/* More */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="transition-transform active:scale-90">
                    <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                      <MoreHorizontal className="w-5 h-5 text-white" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/post/${id}`)}>
                    Copier le lien
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Signalement envoyé")}>
                    Signaler
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Publication masquée")}>
                    Masquer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          /* Text-only post */
          <div className="p-4">
            {/* User Header */}
            <div className="flex items-center gap-3 mb-3">
              <button onClick={handleProfileClick}>
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1">
                {source && (
                  <button 
                    onClick={handleSourceClick}
                    className="inline-flex items-center gap-1 text-primary text-xs mb-0.5 hover:underline"
                  >
                    {getSourceIcon()}
                    <span>{source.name}</span>
                  </button>
                )}
                <button onClick={handleProfileClick} className="text-left block">
                  <h3 className="font-bold hover:underline">
                    {user.name}{user.age ? `, ${user.age}` : ""}
                  </h3>
                </button>
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
            <div className="mb-4">
              <p className="text-foreground text-base">{displayCaption}</p>
              {shouldTruncate && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-primary text-sm font-medium mt-1 flex items-center gap-1"
                >
                  {isExpanded ? "Voir moins" : "Lire plus..."}
                  <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                </button>
              )}
            </div>

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
                count={commentsCount} 
                onClick={() => setCommentsOpen(true)} 
                variant="inline"
              />
              <button onClick={() => setIsShareOpen(true)}>
                <Share2 className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-auto">
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/post/${id}`)}>
                    Copier le lien
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Signalement envoyé")}>
                    Signaler
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Publication masquée")}>
                    Masquer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {hasImage && (
          <div 
            className="px-3 py-3 flex items-center gap-3 cursor-pointer"
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
        )}
      </div>

      {/* Comments Sheet */}
      <CommentsSection 
        postId={id}
        initialCount={commentsCount}
        isOpen={commentsOpen}
        onOpenChange={setCommentsOpen}
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
                <span className="text-white text-xl font-bold">W</span>
              </div>
              <span className="text-xs">WhatsApp</span>
            </button>
            <button onClick={() => handleShare("telegram")} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xl font-bold">T</span>
              </div>
              <span className="text-xs">Telegram</span>
            </button>
            <button onClick={() => handleShare("facebook")} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">f</span>
              </div>
              <span className="text-xs">Facebook</span>
            </button>
            <button onClick={() => handleShare("twitter")} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center">
                <span className="text-white text-xl font-bold">X</span>
              </div>
              <span className="text-xs">Twitter</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};