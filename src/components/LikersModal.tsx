import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";

interface LikerProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface LikersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const LikersModal = ({ open, onOpenChange, userId }: LikersModalProps) => {
  const navigate = useNavigate();
  const [likers, setLikers] = useState<LikerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      fetchLikers();
    }
  }, [open, userId]);

  const fetchLikers = async () => {
    setLoading(true);

    // Get all posts by user
    const { data: posts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId);

    if (!posts || posts.length === 0) {
      setLikers([]);
      setLoading(false);
      return;
    }

    const postIds = posts.map(p => p.id);

    // Get unique likers
    const { data: likes } = await supabase
      .from("likes")
      .select("user_id")
      .in("post_id", postIds);

    if (!likes || likes.length === 0) {
      setLikers([]);
      setLoading(false);
      return;
    }

    const uniqueUserIds = [...new Set(likes.map(l => l.user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", uniqueUserIds);

    setLikers(profiles || []);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            Personnes qui ont aimé
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : likers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun j'aime pour le moment</p>
          ) : (
            likers.map(profile => (
              <div
                key={profile.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => { onOpenChange(false); navigate(`/profile/${profile.id}`); }}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback>{profile.display_name?.[0] || profile.username?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{profile.display_name || profile.username || "Utilisateur"}</p>
                  <p className="text-sm text-muted-foreground truncate">@{profile.username || "user"}</p>
                </div>
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              </div>
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
