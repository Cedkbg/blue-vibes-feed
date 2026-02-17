import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { UserPlus, Check } from "lucide-react";

interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const SuggestedAccountItem = ({ profile, onNavigate }: { profile: Profile; onNavigate: () => void }) => {
  const navigate = useNavigate();
  const { isFollowing, toggleFollow, isLoading } = useFollows(profile.id);

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar
        className="w-9 h-9 cursor-pointer flex-shrink-0"
        onClick={() => { onNavigate(); navigate(`/profile/${profile.id}`); }}
      >
        <AvatarImage src={profile.avatar_url || ""} />
        <AvatarFallback className="text-xs">{profile.display_name?.[0] || "U"}</AvatarFallback>
      </Avatar>
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => { onNavigate(); navigate(`/profile/${profile.id}`); }}
      >
        <p className="text-xs font-medium truncate">{profile.display_name || profile.username || "Utilisateur"}</p>
        {profile.username && <p className="text-[10px] text-muted-foreground truncate">@{profile.username}</p>}
      </div>
      <Button
        size="sm"
        variant={isFollowing ? "outline" : "default"}
        className="h-7 text-[10px] px-2"
        onClick={toggleFollow}
        disabled={isLoading}
      >
        {isFollowing ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
      </Button>
    </div>
  );
};

interface SuggestedAccountsProps {
  onNavigate: () => void;
}

export const SuggestedAccounts = ({ onNavigate }: SuggestedAccountsProps) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) return;

      // Get users the current user already follows
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = follows?.map(f => f.following_id) || [];
      const excludeIds = [user.id, ...followingIds];

      const { data } = await supabase
        .from("profiles_public")
        .select("id, display_name, username, avatar_url, bio")
        .not("id", "in", `(${excludeIds.join(",")})`)
        .limit(6);

      if (data) setProfiles(data);
    };

    fetchSuggestions();
  }, [user]);

  if (profiles.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Suggestions</h3>
      </div>
      <div className="space-y-0.5">
        {profiles.map(profile => (
          <SuggestedAccountItem key={profile.id} profile={profile} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
};
