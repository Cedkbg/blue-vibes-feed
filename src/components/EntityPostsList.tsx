import { PostWithProfile } from "@/hooks/useEntityPosts";
import { FeedCard } from "@/components/FeedCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon } from "lucide-react";

interface EntityPostsListProps {
  posts: PostWithProfile[];
  loading: boolean;
  emptyMessage?: string;
}

const calculateAge = (birthdate: string | null) => {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const EntityPostsList = ({ 
  posts, 
  loading, 
  emptyMessage = "Aucune publication pour le moment" 
}: EntityPostsListProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <FeedCard
          key={post.id}
          id={post.id}
          userId={post.user_id}
          user={{
            name: post.profile?.display_name || post.profile?.username || "Utilisateur",
            avatar: post.profile?.avatar_url || "",
            age: calculateAge(post.profile?.birthdate || null),
            profession: post.profile?.profession || null,
            location: post.profile?.location || null,
            isFollowing: false,
          }}
          image={post.media_url || undefined}
          mediaType={post.media_type}
          caption={post.caption || ""}
          likes={post.likes_count}
          comments={post.comments_count}
        />
      ))}
    </div>
  );
};
