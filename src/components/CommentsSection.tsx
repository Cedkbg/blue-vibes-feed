import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  text: string;
  parent_id: string | null;
  created_at: string;
  username?: string | null;
  avatar_url?: string | null;
}

interface CommentsSectionProps {
  postId: string;
  initialCount?: number;
}

export const CommentsSection = ({ postId, initialCount = 0 }: CommentsSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    setLoading(true);
    
    // Fetch comments
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

    // Get unique user IDs
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    
    // Fetch profiles for those users
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    // Merge comments with profile data
    const commentsWithProfiles: Comment[] = commentsData.map(comment => ({
      ...comment,
      username: profilesMap.get(comment.user_id)?.username || null,
      avatar_url: profilesMap.get(comment.user_id)?.avatar_url || null,
    }));

    setComments(commentsWithProfiles);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      post_id: postId,
      text: newComment.trim(),
      parent_id: replyTo,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout du commentaire");
      console.error(error);
    } else {
      setNewComment("");
      setReplyTo(null);
      fetchComments();
      toast.success("Commentaire ajouté");
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
    } else {
      fetchComments();
      toast.success("Commentaire supprimé");
    }
  };

  const topLevelComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId);

  return (
    <div className="w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        <span>{comments.length || initialCount}</span>
      </Button>

      {isOpen && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {/* Add Comment Form */}
          {user && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <Textarea
                placeholder={replyTo ? "Répondre..." : "Ajouter un commentaire..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 min-h-[60px]"
                maxLength={1000}
              />
              <Button type="submit" size="icon" disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}

          {/* Comments List */}
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <div className="space-y-4">
              {topLevelComments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.avatar_url || ""} />
                      <AvatarFallback>
                        {comment.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {comment.username || "Utilisateur"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.text}</p>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setReplyTo(comment.id)}
                        >
                          Répondre
                        </Button>
                        {user?.id === comment.user_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-destructive"
                            onClick={() => handleDelete(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nested Replies */}
                  {getReplies(comment.id).map((reply) => (
                    <div key={reply.id} className="ml-10 flex gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={reply.avatar_url || ""} />
                        <AvatarFallback>
                          {reply.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs">
                            {reply.username || "Utilisateur"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>
                        <p className="text-xs mt-1">{reply.text}</p>
                        {user?.id === reply.user_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-destructive mt-1"
                            onClick={() => handleDelete(reply.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
