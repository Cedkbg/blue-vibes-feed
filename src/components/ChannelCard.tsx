import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BadgeCheck } from "lucide-react";

interface ChannelCardProps {
  channel: {
    id: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    category: string | null;
    subscribers_count: number;
    is_verified: boolean;
    profile?: {
      display_name: string | null;
      avatar_url: string | null;
    };
  };
  isSubscribed: boolean;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
}

export const ChannelCard = ({
  channel,
  isSubscribed,
  onSubscribe,
  onUnsubscribe,
}: ChannelCardProps) => {
  return (
    <Card className="group hover:shadow-medium transition-smooth overflow-hidden border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border-2 border-primary/20 group-hover:border-primary transition-colors">
            <AvatarImage src={channel.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {channel.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground truncate">
                {channel.name}
              </span>
              {channel.is_verified && (
                <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
              )}
            </div>
            
            {channel.category && (
              <Badge variant="secondary" className="text-xs mb-1">
                {channel.category}
              </Badge>
            )}
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{channel.subscribers_count.toLocaleString()} abonnés</span>
            </div>
          </div>

          <Button
            size="sm"
            variant={isSubscribed ? "outline" : "default"}
            className={`rounded-xl ${!isSubscribed ? "gradient-primary hover:opacity-90" : ""}`}
            onClick={isSubscribed ? onUnsubscribe : onSubscribe}
          >
            {isSubscribed ? "Abonné" : "S'abonner"}
          </Button>
        </div>

        {channel.description && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {channel.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
