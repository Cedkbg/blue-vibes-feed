import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MoreVertical, Phone, Video, X, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  reply_to_id?: string | null;
  reply_to?: Message | null;
}

interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

const Chat = () => {
  const { recipientId } = useParams<{ recipientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch recipient profile
  useEffect(() => {
    const fetchRecipient = async () => {
      if (!recipientId) return;

      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .eq("id", recipientId)
        .single();

      if (data) {
        setRecipient(data);
      }
    };

    fetchRecipient();
  }, [recipientId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !recipientId) return;

      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (data) {
        // Cast to include reply_to_id which may not be in types yet
        const messagesData = data as any[];
        
        // Fetch reply messages
        const replyIds = messagesData.filter(m => m.reply_to_id).map(m => m.reply_to_id);
        let replyMap = new Map<string, Message>();

        if (replyIds.length > 0) {
          const { data: replies } = await supabase
            .from("messages")
            .select("*")
            .in("id", replyIds);

          if (replies) {
            for (const reply of replies) {
              replyMap.set(reply.id, reply as Message);
            }
          }
        }

        setMessages(
          messagesData.map((m) => ({
            ...m,
            reply_to: m.reply_to_id ? replyMap.get(m.reply_to_id) : null,
          }))
        );
      }
      setIsLoading(false);
    };

    fetchMessages();

    // Mark messages as read
    const markAsRead = async () => {
      if (!user || !recipientId) return;

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", recipientId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);
    };

    markAsRead();
  }, [user, recipientId]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !recipientId) return;

    const channel = supabase
      .channel(`chat-${user.id}-${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Only add if it's part of this conversation
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.receiver_id === user.id)
          ) {
            // Fetch reply if exists
            let replyMessage: Message | null = null;
            if (newMsg.reply_to_id) {
              const existing = messages.find(m => m.id === newMsg.reply_to_id);
              if (existing) {
                replyMessage = existing;
              } else {
                const { data } = await supabase
                  .from("messages")
                  .select("*")
                  .eq("id", newMsg.reply_to_id)
                  .single();
                if (data) {
                  replyMessage = data;
                }
              }
            }

            setMessages((prev) => [...prev, { ...newMsg, reply_to: replyMessage }]);
            
            // Mark as read if received
            if (newMsg.sender_id === recipientId) {
              supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", newMsg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleReply = (message: Message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const sendMessage = async () => {
    if (!user || !recipientId || !newMessage.trim()) return;

    const messageData: any = {
      sender_id: user.id,
      receiver_id: recipientId,
      content: newMessage.trim(),
    };

    if (replyTo) {
      messageData.reply_to_id = replyTo.id;
    }

    const { error } = await supabase.from("messages").insert(messageData);

    if (!error) {
      setNewMessage("");
      setReplyTo(null);
      
      // Update or create conversation
      const [user1, user2] = [user.id, recipientId].sort();
      
      await supabase
        .from("conversations")
        .upsert(
          {
            user1_id: user1,
            user2_id: user2,
            last_message_at: new Date().toISOString(),
          },
          { onConflict: "user1_id,user2_id" }
        );
      
      // Send notification to recipient
      await supabase.from("notifications").insert({
        user_id: recipientId,
        type: "message",
        content: "vous a envoyé un message",
        from_user_id: user.id,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessageSenderName = (senderId: string) => {
    if (senderId === user?.id) {
      return "Vous";
    }
    return recipient?.display_name || recipient?.username || "Utilisateur";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/messages")}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={recipient?.avatar_url || ""} />
          <AvatarFallback className="bg-primary-foreground/20">
            {recipient?.display_name?.[0] || recipient?.username?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-semibold">
            {recipient?.display_name || recipient?.username || "Utilisateur"}
          </h1>
          <p className="text-xs text-primary-foreground/70">En ligne</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => navigate(`/call/${recipientId}?type=audio`)}
        >
          <Phone className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => navigate(`/call/${recipientId}?type=video`)}
        >
          <Video className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Aucun message</p>
            <p className="text-sm">Commencez la conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                      : "bg-muted text-foreground rounded-2xl rounded-bl-sm"
                  }`}
                >
                  {/* Reply preview */}
                  {message.reply_to && (
                    <div
                      className={`px-3 pt-2 pb-1 border-l-2 ${
                        isMine
                          ? "border-primary-foreground/50 bg-primary-foreground/10"
                          : "border-primary/50 bg-primary/10"
                      } rounded-t-2xl`}
                    >
                      <p
                        className={`text-xs font-medium ${
                          isMine ? "text-primary-foreground/80" : "text-primary"
                        }`}
                      >
                        {getMessageSenderName(message.reply_to.sender_id)}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}
                      >
                        {message.reply_to.content}
                      </p>
                    </div>
                  )}
                  
                  <div className="px-4 py-2">
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <button
                        onClick={() => handleReply(message)}
                        className={`text-xs ${
                          isMine ? "text-primary-foreground/50 hover:text-primary-foreground/80" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                      <p
                        className={`text-xs ${
                          isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center gap-3">
          <div className="flex-1 border-l-2 border-primary pl-3">
            <p className="text-xs font-medium text-primary">
              Réponse à {getMessageSenderName(replyTo.sender_id)}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {replyTo.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelReply}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border bg-background sticky bottom-0">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={replyTo ? "Répondre..." : "Écrire un message..."}
            className="flex-1 rounded-full"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;