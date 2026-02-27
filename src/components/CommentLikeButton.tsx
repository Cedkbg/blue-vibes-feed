import { Heart } from "lucide-react";
import { useCommentLikes } from "@/hooks/useCommentLikes";
import { cn } from "@/lib/utils";

interface CommentLikeButtonProps {
  commentId: string;
}

export const CommentLikeButton = ({ commentId }: CommentLikeButtonProps) => {
  const { likesCount, isLiked, toggleLike, isLoading } = useCommentLikes(commentId);

  return (
    <button
      onClick={toggleLike}
      disabled={isLoading}
      className="flex items-center gap-1 h-7 px-2 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
    >
      <Heart
        className={cn(
          "h-3.5 w-3.5 transition-all",
          isLiked ? "fill-primary text-primary" : ""
        )}
      />
      {likesCount > 0 && <span>{likesCount}</span>}
    </button>
  );
};
