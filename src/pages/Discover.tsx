import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BadgeCheck, Users, TrendingUp, Crown, Plus, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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

const Discover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
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

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch popular creators (users with most followers)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, is_verified, is_online, profession")
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (profiles) {
      setPopularCreators(profiles);
      setVerifiedAccounts(profiles.filter(p => p.is_verified));
    }
    
    // Fetch groups
    const { data: groupsData } = await supabase
      .from("groups")
      .select("*")
      .order("members_count", { ascending: false });
    
    if (groupsData) {
      setGroups(groupsData);
    }
    
    // Fetch communities
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
    fetchData();
    fetchFollowingIds();

    // Subscribe to real-time profile updates (for online status)
    const profilesChannel = supabase
      .channel("profiles-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchData()
      )
      .subscribe();

    // Subscribe to real-time groups updates
    const groupsChannel = supabase
      .channel("groups-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups" },
        () => fetchData()
      )
      .subscribe();

    // Subscribe to real-time communities updates
    const communitiesChannel = supabase
      .channel("communities-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "communities" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(groupsChannel);
      supabase.removeChannel(communitiesChannel);
    };
  }, [user]);

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    const { error } = await supabase.from("groups").insert({
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || null,
      creator_id: user.id,
    });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Groupe créé !" });
      setShowCreateGroup(false);
      setNewGroupName("");
      setNewGroupDesc("");
      fetchData();
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
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Communauté créée !" });
      setShowCreateCommunity(false);
      setNewCommunityName("");
      setNewCommunityDesc("");
      setNewCommunityCategory("");
      fetchData();
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

  const GroupCard = ({ group }: { group: Group }) => (
    <div className="p-4 rounded-xl bg-card border border-border hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={group.avatar_url || ""} />
          <AvatarFallback><Users className="w-6 h-6" /></AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{group.name}</h3>
          <p className="text-sm text-muted-foreground">{group.members_count} membres</p>
        </div>
      </div>
      {group.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{group.description}</p>
      )}
      <Button size="sm" className="w-full">Rejoindre</Button>
    </div>
  );

  const CommunityCard = ({ community }: { community: Community }) => (
    <div className="p-4 rounded-xl bg-card border border-border hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={community.avatar_url || ""} />
          <AvatarFallback><Crown className="w-6 h-6" /></AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{community.name}</h3>
          <p className="text-sm text-muted-foreground">{community.members_count} membres</p>
        </div>
      </div>
      {community.category && (
        <Badge variant="secondary" className="mb-2">{community.category}</Badge>
      )}
      {community.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{community.description}</p>
      )}
      <Button size="sm" className="w-full">Rejoindre</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <TopBar />

      <main className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Découvrir</h1>
        </div>

        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="trending" className="text-xs">Tendances</TabsTrigger>
            <TabsTrigger value="verified" className="text-xs">Certifiés</TabsTrigger>
            <TabsTrigger value="groups" className="text-xs">Groupes</TabsTrigger>
            <TabsTrigger value="communities" className="text-xs">Communautés</TabsTrigger>
          </TabsList>

          <TabsContent value="trending">
            <div className="space-y-2">
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
            </div>
          </TabsContent>

          <TabsContent value="verified">
            <div className="space-y-2">
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
            </div>
          </TabsContent>

          <TabsContent value="groups">
            <div className="space-y-4">
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
                <p className="text-center text-muted-foreground py-8">Aucun groupe disponible</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {groups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="communities">
            <div className="space-y-4">
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
                <p className="text-center text-muted-foreground py-8">Aucune communauté disponible</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {communities.map((community) => (
                    <CommunityCard key={community.id} community={community} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Discover;
