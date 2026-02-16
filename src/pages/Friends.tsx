import { useState, useEffect } from "react";
import { DesktopLayout } from "@/components/DesktopLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChannels } from "@/hooks/useChannels";
import { useStories } from "@/hooks/useStories";
import { useLiveStreams } from "@/hooks/useLiveStreams";
import { useAuth } from "@/hooks/useAuth";
import { useGroupMembership } from "@/hooks/useGroupMembership";
import { StoriesCarousel } from "@/components/StoriesCarousel";
import { ChannelCard } from "@/components/ChannelCard";
import { StartLiveModal } from "@/components/StartLiveModal";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, Radio, Play, Eye, Plus, Tv, 
  Hash, Layers, Sparkles, BadgeCheck, TrendingUp, UserPlus, Crown, LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

const channelCategories = [
  "Divertissement",
  "Éducation",
  "Gaming",
  "Musique",
  "Sport",
  "Technologie",
  "Lifestyle",
  "Actualités",
];

interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_online: boolean;
  profession: string | null;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  members_count: number;
  creator_id: string;
}

interface Community {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  category: string | null;
  members_count: number;
  creator_id: string;
}

const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast: toastHook } = useToast();
  const { channels, subscribedChannelIds, loading: channelsLoading, createChannel, subscribeToChannel, unsubscribeFromChannel } = useChannels();
  const { liveStreams, loading: streamsLoading, joinStream } = useLiveStreams();
  const { 
    isMemberOfGroup, 
    isMemberOfCommunity, 
    joinGroup, 
    leaveGroup, 
    joinCommunity, 
    leaveCommunity 
  } = useGroupMembership();
  const [showStartLive, setShowStartLive] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelCategory, setNewChannelCategory] = useState("");
  
  // Discover data
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [popularCreators, setPopularCreators] = useState<Profile[]>([]);
  const [verifiedAccounts, setVerifiedAccounts] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Group creation state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  
  // Community creation state
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDesc, setNewCommunityDesc] = useState("");
  const [newCommunityCategory, setNewCommunityCategory] = useState("");

  const fetchFollowingIds = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    
    if (data) {
      setFollowingIds(data.map(f => f.following_id));
    }
  };

  const fetchDiscoverData = async () => {
    setLoading(true);
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, is_verified, is_online, profession")
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (profiles) {
      setPopularCreators(profiles);
      setVerifiedAccounts(profiles.filter(p => p.is_verified));
    }
    
    const { data: groupsData } = await supabase
      .from("groups")
      .select("*")
      .order("members_count", { ascending: false });
    
    if (groupsData) {
      setGroups(groupsData);
    }
    
    const { data: communitiesData } = await supabase
      .from("communities")
      .select("*")
      .order("members_count", { ascending: false });
    
    if (communitiesData) {
      setCommunities(communitiesData);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchDiscoverData();
    fetchFollowingIds();

    const profilesChannel = supabase
      .channel("profiles-realtime-friends")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchDiscoverData()
      )
      .subscribe();

    const groupsChannel = supabase
      .channel("groups-realtime-friends")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups" },
        () => fetchDiscoverData()
      )
      .subscribe();

    const communitiesChannel = supabase
      .channel("communities-realtime-friends")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "communities" },
        () => fetchDiscoverData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(groupsChannel);
      supabase.removeChannel(communitiesChannel);
    };
  }, [user]);

  const handleJoinStream = async (streamId: string) => {
    await joinStream(streamId);
    navigate(`/live/${streamId}`);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error("Veuillez entrer un nom de chaîne");
      return;
    }

    const channel = await createChannel(newChannelName, newChannelDesc, newChannelCategory);
    if (channel) {
      toast.success("Chaîne créée avec succès!");
      setShowCreateChannel(false);
      setNewChannelName("");
      setNewChannelDesc("");
      setNewChannelCategory("");
    } else {
      toast.error("Erreur lors de la création de la chaîne");
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    const { error } = await supabase.from("groups").insert({
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || null,
      creator_id: user.id,
    });

    if (error) {
      toastHook({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toastHook({ title: "Groupe créé !" });
      setShowCreateGroup(false);
      setNewGroupName("");
      setNewGroupDesc("");
      fetchDiscoverData();
    }
  };

  const handleCreateCommunity = async () => {
    if (!user || !newCommunityName.trim()) return;

    const { error } = await supabase.from("communities").insert({
      name: newCommunityName.trim(),
      description: newCommunityDesc.trim() || null,
      category: newCommunityCategory.trim() || null,
      creator_id: user.id,
    });

    if (error) {
      toastHook({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toastHook({ title: "Communauté créée !" });
      setShowCreateCommunity(false);
      setNewCommunityName("");
      setNewCommunityDesc("");
      setNewCommunityCategory("");
      fetchDiscoverData();
    }
  };

  const handleToggleFollow = async (profileId: string) => {
    if (!user) return;
    
    if (followingIds.includes(profileId)) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profileId);
      setFollowingIds(prev => prev.filter(id => id !== profileId));
    } else {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: profileId,
      });
      setFollowingIds(prev => [...prev, profileId]);
    }
  };

  const ProfileCard = ({ profile }: { profile: Profile }) => (
    <div 
      className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => navigate(`/profile/${profile.id}`)}
    >
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage src={profile.avatar_url || ""} />
          <AvatarFallback>{profile.display_name?.[0] || profile.username?.[0] || "U"}</AvatarFallback>
        </Avatar>
        {profile.is_online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium truncate">
            {profile.display_name || profile.username || "Utilisateur"}
          </span>
          {profile.is_verified && (
            <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
          )}
        </div>
        {profile.profession && (
          <p className="text-sm text-muted-foreground truncate">{profile.profession}</p>
        )}
      </div>
      <Button
        size="sm"
        variant={followingIds.includes(profile.id) ? "secondary" : "default"}
        onClick={(e) => {
          e.stopPropagation();
          handleToggleFollow(profile.id);
        }}
      >
        {followingIds.includes(profile.id) ? "Abonné" : <UserPlus className="w-4 h-4" />}
      </Button>
    </div>
  );

  const GroupCard = ({ group }: { group: Group }) => {
    const isMember = isMemberOfGroup(group.id);
    const isCreator = user?.id === group.creator_id;
    
    const handleToggleMembership = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isMember) {
        await leaveGroup(group.id);
      } else {
        await joinGroup(group.id);
      }
    };

    return (
      <div 
        className="p-4 rounded-xl bg-card border border-border hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/group/${group.id}`)}
      >
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={group.avatar_url || ""} />
            <AvatarFallback><Users className="w-6 h-6" /></AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{group.name}</h3>
            <p className="text-sm text-muted-foreground">{group.members_count || 0} membres</p>
          </div>
          {isCreator && <Badge variant="secondary">Créateur</Badge>}
        </div>
        {group.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{group.description}</p>
        )}
        <Button 
          size="sm" 
          className="w-full"
          variant={isMember ? "outline" : "default"}
          onClick={handleToggleMembership}
          disabled={isCreator}
        >
          {isMember ? (
            <>
              <LogOut className="w-4 h-4 mr-2" />
              Quitter
            </>
          ) : (
            "Rejoindre"
          )}
        </Button>
      </div>
    );
  };

  const CommunityCard = ({ community }: { community: Community }) => {
    const isMember = isMemberOfCommunity(community.id);
    const isCreator = user?.id === community.creator_id;
    
    const handleToggleMembership = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isMember) {
        await leaveCommunity(community.id);
      } else {
        await joinCommunity(community.id);
      }
    };

    return (
      <div 
        className="p-4 rounded-xl bg-card border border-border hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/community/${community.id}`)}
      >
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={community.avatar_url || ""} />
            <AvatarFallback><Crown className="w-6 h-6" /></AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{community.name}</h3>
            <p className="text-sm text-muted-foreground">{community.members_count || 0} membres</p>
          </div>
          {isCreator && <Badge variant="secondary">Créateur</Badge>}
        </div>
        {community.category && (
          <Badge variant="secondary" className="mb-2">{community.category}</Badge>
        )}
        {community.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{community.description}</p>
        )}
        <Button 
          size="sm" 
          className="w-full"
          variant={isMember ? "outline" : "default"}
          onClick={handleToggleMembership}
          disabled={isCreator}
        >
          {isMember ? (
            <>
              <LogOut className="w-4 h-4 mr-2" />
              Quitter
            </>
          ) : (
            "Rejoindre"
          )}
        </Button>
      </div>
    );
  };

  return (
    <DesktopLayout showRightSidebar={false}>

      <div className="px-4 py-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-6 mb-6 shadow-glow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full blur-2xl"></div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-foreground/20 rounded-xl backdrop-blur-sm">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">
                  Amis
                </h1>
                <p className="text-primary-foreground/80 text-sm">
                  Découvrez et connectez
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowStartLive(true)}
              className="gap-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground backdrop-blur-sm border border-primary-foreground/20"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              Go Live
            </Button>
          </div>
        </div>

        {/* Stories Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Statuts
            </h2>
          </div>
          <StoriesCarousel />
        </div>

        {/* Live Streams */}
        {(liveStreams.length > 0 || streamsLoading) && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary animate-pulse" />
              En direct maintenant
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {streamsLoading ? (
                [1, 2].map((i) => (
                  <Card key={i} className="min-w-[200px] animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <CardContent className="p-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                liveStreams.map((stream) => (
                  <Card
                    key={stream.id}
                    onClick={() => handleJoinStream(stream.id)}
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
                        {stream.viewers_count}
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={stream.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {stream.profile?.display_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate">
                          {stream.profile?.display_name || "Utilisateur"}
                        </span>
                      </div>
                      <p className="font-medium text-foreground text-sm truncate">
                        {stream.title}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="w-full mb-6 bg-card border border-border p-1 rounded-xl grid grid-cols-5">
            <TabsTrigger
              value="trending"
              className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <TrendingUp className="w-3 h-3" />
              Tendances
            </TabsTrigger>
            <TabsTrigger
              value="verified"
              className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <BadgeCheck className="w-3 h-3" />
              Certifiés
            </TabsTrigger>
            <TabsTrigger
              value="channels"
              className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <Tv className="w-3 h-3" />
              Chaînes
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <Users className="w-3 h-3" />
              Groupes
            </TabsTrigger>
            <TabsTrigger
              value="communities"
              className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <Crown className="w-3 h-3" />
              Communautés
            </TabsTrigger>
          </TabsList>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-2 animate-in fade-in-50">
            <h2 className="text-lg font-semibold mb-4">Créateurs populaires</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : popularCreators.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun créateur trouvé</p>
            ) : (
              popularCreators.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))
            )}
          </TabsContent>

          {/* Verified Tab */}
          <TabsContent value="verified" className="space-y-2 animate-in fade-in-50">
            <div className="flex items-center gap-2 mb-4">
              <BadgeCheck className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Comptes certifiés</h2>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : verifiedAccounts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun compte certifié</p>
            ) : (
              verifiedAccounts.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))
            )}
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-4 animate-in fade-in-50">
            {user && (
              <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
                <DialogTrigger asChild>
                  <Button className="w-full gap-2 gradient-primary hover:opacity-90 mb-4">
                    <Plus className="w-4 h-4" />
                    Créer une chaîne
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle chaîne</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="channel-name">Nom de la chaîne</Label>
                      <Input
                        id="channel-name"
                        placeholder="Ma super chaîne"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="channel-category">Catégorie</Label>
                      <Select value={newChannelCategory} onValueChange={setNewChannelCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {channelCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="channel-desc">Description</Label>
                      <Textarea
                        id="channel-desc"
                        placeholder="Description de votre chaîne..."
                        value={newChannelDesc}
                        onChange={(e) => setNewChannelDesc(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full gradient-primary"
                      onClick={handleCreateChannel}
                    >
                      Créer la chaîne
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {channelsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : channels.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Tv className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">
                    Aucune chaîne pour le moment
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Soyez le premier à créer une chaîne!
                  </p>
                </CardContent>
              </Card>
            ) : (
              channels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isSubscribed={subscribedChannelIds.includes(channel.id)}
                  onSubscribe={() => subscribeToChannel(channel.id)}
                  onUnsubscribe={() => unsubscribeFromChannel(channel.id)}
                />
              ))
            )}
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Groupes</h2>
              <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Créer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un groupe</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nom du groupe</Label>
                      <Input
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Mon groupe"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newGroupDesc}
                        onChange={(e) => setNewGroupDesc(e.target.value)}
                        placeholder="Description du groupe..."
                      />
                    </div>
                    <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                      Créer le groupe
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : groups.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun groupe disponible</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {groups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Communities Tab */}
          <TabsContent value="communities" className="space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Communautés</h2>
              <Dialog open={showCreateCommunity} onOpenChange={setShowCreateCommunity}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Créer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une communauté</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nom de la communauté</Label>
                      <Input
                        value={newCommunityName}
                        onChange={(e) => setNewCommunityName(e.target.value)}
                        placeholder="Ma communauté"
                      />
                    </div>
                    <div>
                      <Label>Catégorie</Label>
                      <Input
                        value={newCommunityCategory}
                        onChange={(e) => setNewCommunityCategory(e.target.value)}
                        placeholder="Tech, Art, Sport..."
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newCommunityDesc}
                        onChange={(e) => setNewCommunityDesc(e.target.value)}
                        placeholder="Description de la communauté..."
                      />
                    </div>
                    <Button onClick={handleCreateCommunity} disabled={!newCommunityName.trim()}>
                      Créer la communauté
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : communities.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune communauté disponible</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {communities.map((community) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <StartLiveModal
        open={showStartLive}
        onOpenChange={setShowStartLive}
        onStreamStarted={(id) => navigate(`/live/${id}`)}
      />

    </DesktopLayout>
  );
};

export default Friends;