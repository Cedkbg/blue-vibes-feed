import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, BadgeCheck, Share2, Bell, BellOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChannels } from "@/hooks/useChannels";
import { toast } from "sonner";
import { CreateContentModal } from "@/components/CreateContentModal";

interface Channel {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  category: string | null;
  subscribers_count: number;
  is_verified: boolean;
  user_id: string;
  created_at: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

const ChannelDetails = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribedChannelIds, subscribeToChannel, unsubscribeFromChannel } = useChannels();
  
  const [channel, setChannel] = useState<Channel | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateContent, setShowCreateContent] = useState(false);

  const isSubscribed = channelId ? subscribedChannelIds.includes(channelId) : false;
  const isOwner = user?.id === channel?.user_id;

  useEffect(() => {
    const fetchChannel = async () => {
      if (!channelId) return;

      const { data: channelData, error } = await supabase
        .from("channels")
        .select("*")
        .eq("id", channelId)
        .single();

      if (error || !channelData) {
        toast.error("Chaîne non trouvée");
        navigate("/friends");
        return;
      }

      setChannel(channelData);

      // Fetch owner profile
      const { data: ownerData } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .eq("id", channelData.user_id)
        .single();

      if (ownerData) {
        setOwner(ownerData);
      }

      setLoading(false);
    };

    fetchChannel();
  }, [channelId, navigate]);

  const handleSubscribe = async () => {
    if (!channelId) return;
    if (isSubscribed) {
      await unsubscribeFromChannel(channelId);
    } else {
      await subscribeToChannel(channelId);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/channel/${channelId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: channel?.name || "Chaîne",
          text: channel?.description || "Découvrez cette chaîne",
          url: shareUrl,
        });
      } catch {
        navigator.clipboard.writeText(shareUrl);
        toast.success("Lien copié !");
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié !");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!channel) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with cover */}
      <div className="relative">
        {channel.cover_url ? (
          <img
            src={channel.cover_url}
            alt=""
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary via-primary to-accent" />
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white"
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5" />
        </Button>

        {/* Channel avatar */}
        <div className="absolute -bottom-12 left-4">
          <Avatar className="w-24 h-24 border-4 border-background">
            <AvatarImage src={channel.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {channel.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Channel info */}
      <div className="pt-16 px-4 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{channel.name}</h1>
              {channel.is_verified && (
                <BadgeCheck className="w-6 h-6 text-primary" />
              )}
            </div>
            {channel.category && (
              <Badge variant="secondary" className="mt-1">
                {channel.category}
              </Badge>
            )}
          </div>
          
          {!isOwner && (
            <Button
              onClick={handleSubscribe}
              variant={isSubscribed ? "outline" : "default"}
              className="gap-2"
            >
              {isSubscribed ? (
                <>
                  <BellOff className="w-4 h-4" />
                  Abonné
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  S'abonner
                </>
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{channel.subscribers_count.toLocaleString()} abonnés</span>
          </div>
        </div>

        {channel.description && (
          <p className="text-muted-foreground mb-6">{channel.description}</p>
        )}

        {/* Owner info */}
        {owner && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Créée par</p>
              <button
                onClick={() => navigate(`/profile/${owner.id}`)}
                className="flex items-center gap-3 hover:bg-accent/50 -mx-2 px-2 py-1 rounded-lg transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={owner.avatar_url || ""} />
                  <AvatarFallback>
                    {owner.display_name?.[0] || owner.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  {owner.display_name || owner.username || "Utilisateur"}
                </span>
              </button>
            </CardContent>
          </Card>
        )}

        {/* Content section */}
        <div className="text-center py-12">
          {isOwner ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Commencez à publier du contenu sur votre chaîne
              </p>
              <Button onClick={() => setShowCreateContent(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Créer un post
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Aucun contenu pour le moment
            </p>
          )}
        </div>
      </div>

      {/* Create Content Modal */}
      {channel && (
        <CreateContentModal
          open={showCreateContent}
          onOpenChange={setShowCreateContent}
          type="channel"
          targetId={channel.id}
          targetName={channel.name}
        />
      )}
    </div>
  );
};

export default ChannelDetails;