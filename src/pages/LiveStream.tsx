import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLiveStreams } from "@/hooks/useLiveStreams";
import { Radio, Eye, Send, Heart, X, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface LiveComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

const LiveStream = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { liveStreams, myStream, endStream, leaveStream } = useLiveStreams();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<LiveComment[]>([]);

  const stream = streamId ? liveStreams.find(s => s.id === streamId) || myStream : myStream;
  const isMyStream = stream?.user_id === user?.id;

  useEffect(() => {
    // Simulate live comments (in production, would use realtime)
    const mockComments: LiveComment[] = [
      { id: "1", user_id: "u1", content: "Super live !", created_at: new Date().toISOString(), profile: { display_name: "Marie", avatar_url: null } },
      { id: "2", user_id: "u2", content: "🔥🔥🔥", created_at: new Date().toISOString(), profile: { display_name: "Paul", avatar_url: null } },
    ];
    setComments(mockComments);
  }, []);

  const handleSendComment = () => {
    if (!comment.trim() || !user) return;

    const newComment: LiveComment = {
      id: Date.now().toString(),
      user_id: user.id,
      content: comment,
      created_at: new Date().toISOString(),
      profile: { display_name: "Vous", avatar_url: null },
    };

    setComments(prev => [...prev, newComment]);
    setComment("");
  };

  const handleEndStream = async () => {
    await endStream();
    navigate("/friends");
  };

  const handleLeaveStream = async () => {
    if (streamId) {
      await leaveStream(streamId);
    }
    navigate("/friends");
  };

  if (!stream) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Radio className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Ce live n'est plus disponible</p>
            <Button onClick={() => navigate("/friends")} className="mt-4">
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Video area */}
      <div className="relative flex-1 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        {/* Close button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 text-white bg-black/30 hover:bg-black/50 z-10"
          onClick={isMyStream ? handleEndStream : handleLeaveStream}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Stream info */}
        <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarImage src={stream.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {stream.profile?.display_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold text-sm">
              {stream.profile?.display_name || "Utilisateur"}
            </p>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </Badge>
              <span className="text-white/70 text-xs flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {stream.viewers_count}
              </span>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="text-center text-white">
          <Radio className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold mb-2">{stream.title}</h2>
          {stream.description && (
            <p className="text-white/70">{stream.description}</p>
          )}
          {isMyStream && (
            <Button
              onClick={handleEndStream}
              variant="destructive"
              className="mt-4"
            >
              Terminer le live
            </Button>
          )}
        </div>
      </div>

      {/* Comments section */}
      <div className="bg-background border-t border-border p-4 max-h-[40vh]">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {stream.viewers_count} spectateur{stream.viewers_count > 1 ? "s" : ""}
          </span>
        </div>

        <ScrollArea className="h-32 mb-3">
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={c.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {c.profile?.display_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-foreground">
                    {c.profile?.display_name}
                  </span>
                  <p className="text-sm text-foreground">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Écrivez un commentaire..."
            className="flex-1 rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
          />
          <Button
            size="icon"
            onClick={handleSendComment}
            disabled={!comment.trim()}
            className="rounded-xl gradient-primary"
          >
            <Send className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="outline" className="rounded-xl">
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveStream;
