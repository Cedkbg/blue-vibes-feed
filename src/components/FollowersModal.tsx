import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { UserPlus, UserCheck } from "lucide-react";

interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface FollowersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  defaultTab?: "followers" | "following";
}

export const FollowersModal = ({ open, onOpenChange, userId, defaultTab = "followers" }: FollowersModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [myFollowingIds, setMyFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, userId]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch followers (people who follow this user)
    const { data: followerRows } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId);

    // Fetch following (people this user follows)
    const { data: followingRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    const followerIds = (followerRows?.map(f => f.follower_id) || []).filter(id => id !== userId);
    const followingIds = (followingRows?.map(f => f.following_id) || []).filter(id => id !== userId);
    const allIds = [...new Set([...followerIds, ...followingIds])];

    if (allIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", allIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setFollowers(followerIds.map(id => profileMap.get(id)).filter(Boolean) as Profile[]);
      setFollowing(followingIds.map(id => profileMap.get(id)).filter(Boolean) as Profile[]);
    } else {
      setFollowers([]);
      setFollowing([]);
    }

    // Fetch current user's following for follow/unfollow buttons
    if (user) {
      const { data: myFollows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      setMyFollowingIds(myFollows?.map(f => f.following_id) || []);
    }

    setLoading(false);
  };

  const handleToggleFollow = async (profileId: string) => {
    if (!user) return;
    if (myFollowingIds.includes(profileId)) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profileId);
      setMyFollowingIds(prev => prev.filter(id => id !== profileId));
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profileId });
      setMyFollowingIds(prev => [...prev, profileId]);
    }
  };

  const UserRow = ({ profile }: { profile: Profile }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors">
      <Avatar
        className="w-10 h-10 cursor-pointer"
        onClick={() => { onOpenChange(false); navigate(`/profile/${profile.id}`); }}
      >
        <AvatarImage src={profile.avatar_url || ""} />
        <AvatarFallback>{profile.display_name?.[0] || profile.username?.[0] || "U"}</AvatarFallback>
      </Avatar>
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => { onOpenChange(false); navigate(`/profile/${profile.id}`); }}
      >
        <p className="font-medium truncate">{profile.display_name || profile.username || "Utilisateur"}</p>
        <p className="text-sm text-muted-foreground truncate">@{profile.username || "user"}</p>
      </div>
      {user && profile.id !== user.id && (
        <Button
          size="sm"
          variant={myFollowingIds.includes(profile.id) ? "secondary" : "default"}
          onClick={(e) => { e.stopPropagation(); handleToggleFollow(profile.id); }}
        >
          {myFollowingIds.includes(profile.id) ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connexions</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">Abonnés ({followers.length})</TabsTrigger>
            <TabsTrigger value="following">Abonnements ({following.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="followers">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : followers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun abonné</p>
              ) : (
                followers.map(p => <UserRow key={p.id} profile={p} />)
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="following">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : following.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun abonnement</p>
              ) : (
                following.map(p => <UserRow key={p.id} profile={p} />)
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
