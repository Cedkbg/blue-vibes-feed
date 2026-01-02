import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
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
import { StoriesCarousel } from "@/components/StoriesCarousel";
import { ChannelCard } from "@/components/ChannelCard";
import { StartLiveModal } from "@/components/StartLiveModal";
import { 
  TrendingUp, Radio, Play, Eye, Users, Plus, Tv, 
  Layers, Hash, Sparkles, BadgeCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { channels, subscribedChannelIds, loading: channelsLoading, createChannel, subscribeToChannel, unsubscribeFromChannel } = useChannels();
  const { liveStreams, loading: streamsLoading, joinStream } = useLiveStreams();
  const [showStartLive, setShowStartLive] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelCategory, setNewChannelCategory] = useState("");

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <div className="pt-16 px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-6 mb-6 shadow-glow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full blur-2xl"></div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-foreground/20 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">
                  Tendances
                </h1>
                <p className="text-primary-foreground/80 text-sm">
                  Chaînes, canaux et statuts
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

        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="w-full mb-6 bg-card border border-border p-1 rounded-xl">
            <TabsTrigger
              value="channels"
              className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <Tv className="w-4 h-4" />
              Chaînes
            </TabsTrigger>
            <TabsTrigger
              value="canals"
              className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <Hash className="w-4 h-4" />
              Canaux
            </TabsTrigger>
            <TabsTrigger
              value="pages"
              className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-smooth"
            >
              <Layers className="w-4 h-4" />
              Pages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-4 animate-in fade-in-50">
            {/* Create Channel Button */}
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

          <TabsContent value="canals" className="space-y-4 animate-in fade-in-50">
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Hash className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  Canaux de discussion
                </p>
                <p className="text-sm text-muted-foreground">
                  Bientôt disponible
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-4 animate-in fade-in-50">
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  Pages et communautés
                </p>
                <p className="text-sm text-muted-foreground">
                  Bientôt disponible
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <StartLiveModal
        open={showStartLive}
        onOpenChange={setShowStartLive}
        onStreamStarted={(id) => navigate(`/live/${id}`)}
      />

      <BottomNav />
    </div>
  );
};

export default Friends;
