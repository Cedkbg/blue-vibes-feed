import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useLiveStreams } from "@/hooks/useLiveStreams";
import { useLiveChat } from "@/hooks/useLiveChat";
import { useViewers } from "@/hooks/useViewers";
import { LiveChatMessage } from "@/components/LiveChatMessage";
import { LiveChatReactions } from "@/components/LiveChatReactions";
import { ViewersList } from "@/components/ViewersList";
import { Radio, Eye, Send, X, Users, Smile } from "lucide-react";

const EMOJIS = ["😀", "😂", "😍", "🔥", "👏", "💯", "❤️", "🎉"];

const LiveStream = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { liveStreams, myStream, endStream, leaveStream } = useLiveStreams();
  const [comment, setComment] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [lastReaction, setLastReaction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentStreamId = streamId || myStream?.id;
  const { messages, sendMessage, sendReaction } = useLiveChat(currentStreamId);
  const { viewers, viewerCount } = useViewers(currentStreamId);

  const stream = streamId 
    ? liveStreams.find(s => s.id === streamId) || myStream 
    : myStream;
  const isMyStream = stream?.user_id === user?.id;

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle incoming reactions
  useEffect(() => {
    const latestReaction = messages
      .filter(m => m.is_reaction)
      .slice(-1)[0];
    
    if (latestReaction && latestReaction.reaction_type) {
      setLastReaction(latestReaction.reaction_type);
      setTimeout(() => setLastReaction(null), 100);
    }
  }, [messages]);

  const handleSendComment = async () => {
    if (!comment.trim() || !user) return;
    await sendMessage(comment);
    setComment("");
  };

  const handleSendReaction = async (emoji: string) => {
    await sendReaction(emoji);
  };

  const handleEmojiClick = (emoji: string) => {
    setComment(prev => prev + emoji);
    setShowEmojis(false);
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
                <motion.span 
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                LIVE
              </Badge>
              <ViewersList viewers={viewers} viewerCount={viewerCount} />
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="text-center text-white">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Radio className="w-16 h-16 mx-auto mb-4" />
          </motion.div>
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

      {/* Chat section */}
      <div className="bg-background border-t border-border p-4 max-h-[40vh]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              <motion.span
                key={viewerCount}
                initial={{ scale: 1.5, color: "hsl(var(--primary))" }}
                animate={{ scale: 1, color: "hsl(var(--muted-foreground))" }}
                transition={{ duration: 0.3 }}
              >
                {viewerCount}
              </motion.span>
              {" "}spectateur{viewerCount > 1 ? "s" : ""} en ligne
            </span>
          </div>
          
          {/* Mini avatars of viewers */}
          <div className="flex -space-x-2">
            {viewers.slice(0, 5).map((viewer) => (
              <Avatar key={viewer.id} className="w-6 h-6 border-2 border-background">
                <AvatarImage src={viewer.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10">
                  {viewer.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            ))}
            {viewers.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                +{viewers.length - 5}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-32 mb-3" ref={scrollRef}>
          <div className="space-y-2 pr-4">
            <AnimatePresence mode="popLayout">
              {messages.filter(m => !m.is_reaction).map((msg) => (
                <LiveChatMessage 
                  key={msg.id} 
                  message={msg} 
                  isOwn={msg.user_id === user?.id}
                />
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="flex gap-2 relative">
          {/* Emoji picker */}
          <AnimatePresence>
            {showEmojis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-xl p-2 shadow-lg"
              >
                <div className="flex gap-1 flex-wrap max-w-[200px]">
                  {EMOJIS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEmojiClick(emoji)}
                      className="p-1.5 hover:bg-accent rounded transition-colors text-lg"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            size="icon"
            variant="ghost"
            className="rounded-xl flex-shrink-0"
            onClick={() => setShowEmojis(!showEmojis)}
          >
            <Smile className="w-4 h-4" />
          </Button>

          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Écrivez un message..."
            className="flex-1 rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
          />
          
          <Button
            size="icon"
            onClick={handleSendComment}
            disabled={!comment.trim()}
            className="rounded-xl gradient-primary flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>

          <LiveChatReactions 
            onSendReaction={handleSendReaction}
            incomingReaction={lastReaction}
          />
        </div>
      </div>
    </div>
  );
};

export default LiveStream;
