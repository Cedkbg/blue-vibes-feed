import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Radio, Video, UserPlus, Play, Eye, Clock, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  profession: string | null;
}

interface Follow {
  id: string;
  following_id: string;
  follower_id: string;
  created_at: string;
  profiles?: Profile;
}

const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch following (friends)
      const { data: followingData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followingData && followingData.length > 0) {
        const followingIds = followingData.map((f) => f.following_id);
        const { data: friendProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", followingIds);

        setFriends(friendProfiles || []);
      }

      // Fetch suggestions (profiles not followed)
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .limit(10);

      const followingIds = (followingData || []).map((f) => f.following_id);
      const suggestedProfiles = (allProfiles || []).filter(
        (p) => !followingIds.includes(p.id)
      );

      setSuggestions(suggestedProfiles);

      // Simulate live streams (would be real in production)
      setLiveStreams([
        { id: 1, title: "En direct maintenant", viewers: 127, isLive: true },
        { id: 2, title: "Gaming session", viewers: 89, isLive: true },
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (profileId: string) => {
    if (!user) return;

    try {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: profileId,
      });

      // Move from suggestions to friends
      const profile = suggestions.find((s) => s.id === profileId);
      if (profile) {
        setFriends((prev) => [...prev, profile]);
        setSuggestions((prev) => prev.filter((s) => s.id !== profileId));
      }
    } catch (error) {
      console.error("Error following:", error);
    }
  };

  const startLive = () => {
    // Future: Implement live streaming
    navigate("/create-post");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <div className="pt-16 px-4 max-w-2xl mx-auto">
        {/* Header avec effet néon */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-6 mb-6 shadow-glow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full blur-2xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-foreground/20 rounded-xl backdrop-blur-sm">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">Amis & Lives</h1>
                <p className="text-primary-foreground/80 text-sm">Connectez-vous en direct</p>
              </div>
            </div>
            <Button 
              onClick={startLive}
              className="gap-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground backdrop-blur-sm border border-primary-foreground/20"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              Go Live
            </Button>
          </div>
        </div>

        {/* Lives en cours */}
        {liveStreams.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary animate-pulse" />
              En direct maintenant
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {liveStreams.map((stream) => (
                <Card 
                  key={stream.id}
                  className="min-w-[200px] group cursor-pointer hover:shadow-medium transition-smooth overflow-hidden border-primary/20"
                >
                  <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-12 h-12 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground gap-1">
                      <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></span>
                      LIVE
                    </Badge>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                      <Eye className="w-3 h-3" />
                      {stream.viewers}
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-foreground text-sm truncate">{stream.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="w-full mb-6 bg-card border border-border p-1 rounded-xl">
            <TabsTrigger 
              value="friends" 
              className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <Users className="w-4 h-4" />
              Amis ({friends.length})
            </TabsTrigger>
            <TabsTrigger 
              value="discover" 
              className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <Sparkles className="w-4 h-4" />
              Découvrir
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4 animate-in fade-in-50">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : friends.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Pas encore d'amis</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Découvrez des personnes à suivre
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => document.querySelector('[data-value="discover"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
                    className="gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Trouver des amis
                  </Button>
                </CardContent>
              </Card>
            ) : (
              friends.map((friend) => (
                <Card 
                  key={friend.id} 
                  className="group hover:shadow-medium transition-smooth overflow-hidden"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-14 h-14 border-2 border-primary/20 group-hover:border-primary transition-colors">
                          <AvatarImage src={friend.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {friend.display_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online indicator */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-card rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate">
                            {friend.display_name || "Utilisateur"}
                          </span>
                          {friend.profession && (
                            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                              {friend.profession}
                            </Badge>
                          )}
                        </div>
                        {friend.username && (
                          <p className="text-sm text-muted-foreground">@{friend.username}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => navigate(`/chat/${friend.id}`)}
                        >
                          Message
                        </Button>
                        <Button 
                          size="sm"
                          className="rounded-xl gradient-primary hover:opacity-90"
                        >
                          <Video className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="discover" className="space-y-4 animate-in fade-in-50">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune suggestion disponible</p>
                </CardContent>
              </Card>
            ) : (
              suggestions.map((profile) => (
                <Card 
                  key={profile.id} 
                  className="group hover:shadow-medium transition-smooth overflow-hidden"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 border-2 border-border group-hover:border-primary transition-colors">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {profile.display_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-foreground block truncate">
                          {profile.display_name || "Utilisateur"}
                        </span>
                        {profile.username && (
                          <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        )}
                        {profile.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {profile.bio}
                          </p>
                        )}
                      </div>
                      <Button 
                        size="sm"
                        className="rounded-xl gap-2 gradient-primary hover:opacity-90"
                        onClick={() => handleFollow(profile.id)}
                      >
                        <UserPlus className="w-4 h-4" />
                        Suivre
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Friends;
