import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Trash2, Reply, ChevronDown, ChevronUp, X, CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  text: string;
  parent_id: string | null;
  created_at: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  replies?: Comment[];
}

interface CommentsSectionProps {
  postId: string;
  initialCount?: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommentsSection = ({ postId, initialCount = 0, isOpen, onOpenChange }: CommentsSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [currentUserProfile, setCurrentUserProfile] = useState<{avatar_url: string | null, username: string | null}>({avatar_url: null, username: null});

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Erreur lors du chargement des commentaires");
      console.error(error);
      setLoading(false);
      return;
    }

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    const commentsWithProfiles: Comment[] = commentsData.map(comment => ({
      ...comment,
      username: profilesMap.get(comment.user_id)?.username || null,
      display_name: profilesMap.get(comment.user_id)?.display_name || null,
      avatar_url: profilesMap.get(comment.user_id)?.avatar_url || null,
    }));

    setComments(commentsWithProfiles);
    setLoading(false);
  }, [postId]);

  // Fetch current user profile
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, username")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setCurrentUserProfile(data);
      }
    };
    fetchCurrentUserProfile();
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, fetchComments]);

  // Real-time subscription
  useEffect(() => {
    if (!isOpen || !postId) return;

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, postId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      post_id: postId,
      text: newComment.trim(),
      parent_id: replyTo?.id || null,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout du commentaire");
      console.error(error);
    } else {
      // Increment comments_count on the post
      const { data: postData } = await supabase
        .from("posts")
        .select("comments_count")
        .eq("id", postId)
        .single();
      
      if (postData) {
        await supabase
          .from("posts")
          .update({ comments_count: (postData.comments_count || 0) + 1 })
          .eq("id", postId);
      }
      
      setNewComment("");
      setReplyTo(null);
      if (replyTo) {
        setExpandedReplies(prev => new Set([...prev, replyTo.id]));
      }
    }
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const topLevelComments = comments.filter((c) => !c.parent_id);
  
  const getReplies = (parentId: string): Comment[] => {
    const directReplies = comments.filter((c) => c.parent_id === parentId);
    return directReplies.map(reply => ({
      ...reply,
      replies: getReplies(reply.id)
    }));
  };

  const getReplyCount = (commentId: string): number => {
    const directReplies = comments.filter(c => c.parent_id === commentId);
    return directReplies.reduce((acc, reply) => acc + 1 + getReplyCount(reply.id), 0);
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const replies = getReplies(comment.id);
    const replyCount = getReplyCount(comment.id);
    const isExpanded = expandedReplies.has(comment.id);
    const displayName = comment.display_name || comment.username || "Utilisateur";
    const maxDepth = 3;
    const effectiveDepth = Math.min(depth, maxDepth);
    
    return (
      <div className={cn("animate-in fade-in duration-200", effectiveDepth > 0 && "ml-8 border-l-2 border-muted pl-3")}>
        <div className="flex gap-3 py-3">
          <Avatar className={cn("shrink-0", depth > 0 ? "h-8 w-8" : "h-10 w-10")}>
            <AvatarImage src={comment.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{displayName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
            <p className="text-sm mt-1 break-words">{comment.text}</p>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={() => setReplyTo(comment)}
              >
                <Reply className="h-3.5 w-3.5 mr-1" />
                Répondre
              </Button>
              {user?.id === comment.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Show replies button */}
        {replyCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-primary ml-12 mb-2"
            onClick={() => toggleReplies(comment.id)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 mr-1" />
                Masquer {replyCount} réponse{replyCount > 1 ? "s" : ""}
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                Voir {replyCount} réponse{replyCount > 1 ? "s" : ""}
              </>
            )}
          </Button>
        )}

        {/* Nested Replies */}
        {isExpanded && replies.length > 0 && (
          <div className="space-y-0">
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">
              {comments.length} Commentaire{comments.length !== 1 ? "s" : ""}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        {/* Comments List */}
        <ScrollArea className="flex-1 px-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucun commentaire</p>
              <p className="text-sm text-muted-foreground/70">Soyez le premier à commenter !</p>
            </div>
          ) : (
            <div className="divide-y">
              {topLevelComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Reply indicator */}
        {replyTo && (
          <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CornerDownRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Répondre à</span>
              <span className="font-medium">{replyTo.display_name || replyTo.username || "Utilisateur"}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleSubmit} className="p-4 border-t bg-background shrink-0">
            <div className="flex gap-3 items-end">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={currentUserProfile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {currentUserProfile.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Textarea
                  placeholder={replyTo ? `Répondre à ${replyTo.display_name || replyTo.username}...` : "Ajouter un commentaire..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[44px] max-h-[120px] resize-none pr-12 rounded-2xl"
                  maxLength={1000}
                  rows={1}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!newComment.trim()}
                  className="absolute right-1 bottom-1 h-8 w-8 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-4 border-t text-center text-sm text-muted-foreground">
            Connectez-vous pour commenter
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// Compact button for triggering comments
interface CommentsButtonProps {
  count: number;
  onClick: () => void;
  variant?: "overlay" | "inline";
}

export const CommentsButton = ({ count, onClick, variant = "inline" }: CommentsButtonProps) => {
  const [currentCount, setCurrentCount] = useState(count);
  const { postId } = { postId: '' }; // Will be passed as prop

  const formatCount = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  // Update count when prop changes
  useEffect(() => {
    setCurrentCount(count);
  }, [count]);

  if (variant === "overlay") {
    return (
      <button 
        onClick={onClick}
        className="flex flex-col items-center gap-1 transition-transform active:scale-90"
      >
        <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <span className="text-white text-xs font-semibold drop-shadow">
          {formatCount(currentCount)}
        </span>
      </button>
    );
  }

  return (
    <button onClick={onClick} className="flex items-center gap-2">
      <MessageCircle className="w-5 h-5 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{formatCount(currentCount)}</span>
    </button>
  );
};