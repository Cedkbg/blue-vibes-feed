import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MoreVertical, Phone, Video, X, Reply, Mic, Paperclip, Image, FileText, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { EmojiPicker } from "@/components/EmojiPicker";
import { playMessageSentSound, playMessageReceivedSound } from "@/utils/sounds";
import { ContactSettingsSheet } from "@/components/ContactSettingsSheet";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  reply_to_id?: string | null;
  reply_to?: Message | null;
  media_url?: string | null;
  media_type?: string | null;
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showContactSettings, setShowContactSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch recipient profile
  useEffect(() => {
    const fetchRecipient = async () => {
      if (!recipientId) return;
      const { data } = await supabase
        .from("profiles_public")
        .select("id, display_name, username, avatar_url")
        .eq("id", recipientId)
        .single();
      if (data) setRecipient(data);
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
        const messagesData = data as any[];
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
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.receiver_id === user.id)
          ) {
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
                if (data) replyMessage = data;
              }
            }
            setMessages((prev) => [...prev, { ...newMsg, reply_to: replyMessage }]);
            if (newMsg.sender_id === recipientId) {
              playMessageReceivedSound();
              supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id);
            }
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, recipientId, messages]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleReply = (message: Message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => setReplyTo(null);

  // Upload file to storage
  const uploadFile = async (file: File, type: string): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(filePath, file);
    if (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
      return null;
    }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  // Send message (text or media)
  const sendMessage = async (mediaUrl?: string, mediaType?: string) => {
    if (!user || !recipientId) return;
    if (!newMessage.trim() && !mediaUrl) return;

    const messageData: any = {
      sender_id: user.id,
      receiver_id: recipientId,
      content: newMessage.trim() || (mediaType === "audio" ? "🎤 Message vocal" : mediaType === "image" ? "📷 Photo" : mediaType === "video" ? "🎬 Vidéo" : "📎 Fichier"),
    };

    if (mediaUrl) {
      messageData.media_url = mediaUrl;
      messageData.media_type = mediaType;
    }

    if (replyTo) {
      messageData.reply_to_id = replyTo.id;
    }

    const { error } = await supabase.from("messages").insert(messageData);

    if (!error) {
      playMessageSentSound();
      setNewMessage("");
      setReplyTo(null);
      const [user1, user2] = [user.id, recipientId].sort();
      await supabase
        .from("conversations")
        .upsert(
          { user1_id: user1, user2_id: user2, last_message_at: new Date().toISOString() },
          { onConflict: "user1_id,user2_id" }
        );
      await supabase.from("notifications").insert({
        user_id: recipientId,
        type: "message",
        content: "vous a envoyé un message",
        from_user_id: user.id,
      });
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 0) {
          setIsUploading(true);
          const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
          const url = await uploadFile(file, "audio");
          if (url) {
            await sendMessage(url, "audio");
          }
          setIsUploading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Impossible d'accéder au microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // File handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowAttachMenu(false);
    setIsUploading(true);
    const url = await uploadFile(file, type);
    if (url) {
      await sendMessage(url, type);
    }
    setIsUploading(false);
    e.target.value = "";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getMessageSenderName = (senderId: string) => {
    if (senderId === user?.id) return "Vous";
    return recipient?.display_name || recipient?.username || "Utilisateur";
  };

  const getMessagePreview = (msg: Message) => {
    if (msg.media_type === "audio") return "🎤 Message vocal";
    if (msg.media_type === "image") return "📷 Photo";
    if (msg.media_type === "video") return "🎬 Vidéo";
    if (msg.media_type === "file") return "📎 Fichier";
    return msg.content;
  };

  // Render media content
  const renderMedia = (message: Message, isMine: boolean) => {
    if (!message.media_url || !message.media_type) return null;

    switch (message.media_type) {
      case "audio":
        return (
          <div className="px-3 py-2">
            <audio controls className="w-full max-w-[250px] h-10" preload="metadata">
              <source src={message.media_url} type="audio/webm" />
            </audio>
          </div>
        );
      case "image":
        return (
          <div className="p-1">
            <img
              src={message.media_url}
              alt="Photo"
              className="rounded-xl max-w-[250px] max-h-[300px] object-cover cursor-pointer"
              onClick={() => window.open(message.media_url!, "_blank")}
            />
          </div>
        );
      case "video":
        return (
          <div className="p-1">
            <video
              controls
              className="rounded-xl max-w-[250px] max-h-[300px]"
              preload="metadata"
            >
              <source src={message.media_url} />
            </video>
          </div>
        );
      case "file":
        return (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 ${
              isMine ? "text-primary-foreground" : "text-foreground"
            }`}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm underline truncate">Fichier joint</span>
          </a>
        );
      default:
        return null;
    }
  };

  const handleBlockUser = async () => {
    if (!user || !recipientId) return;
    await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: recipientId,
    });
    toast.success("Utilisateur bloqué");
    navigate("/messages");
  };

  const handleDeleteConversation = async () => {
    if (!user || !recipientId) return;
    await supabase.from("messages").delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`);
    toast.success("Conversation supprimée");
    navigate("/messages");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "image")} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e, "video")} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileSelect(e, "file")} />

      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate("/messages")} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={recipient?.avatar_url || ""} />
          <AvatarFallback className="bg-primary-foreground/20">
            {recipient?.display_name?.[0] || recipient?.username?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">
            {recipient?.display_name || recipient?.username || "Utilisateur"}
          </h1>
          <p className="text-xs text-primary-foreground/70">En ligne</p>
        </div>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 flex-shrink-0" onClick={() => navigate(`/call/${recipientId}?type=audio`)}>
          <Phone className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 flex-shrink-0" onClick={() => navigate(`/call/${recipientId}?type=video`)}>
          <Video className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 flex-shrink-0" onClick={() => setShowContactSettings(true)}>
          <MoreVertical className="w-5 h-5" />
        </Button>
      </header>

      {/* Contact Settings Sheet */}
      <ContactSettingsSheet
        open={showContactSettings}
        onOpenChange={setShowContactSettings}
        contact={recipient}
        onBlockUser={handleBlockUser}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 flex flex-col-reverse" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="flex-1" />
        <div className="space-y-3">
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
              <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                    : "bg-muted text-foreground rounded-2xl rounded-bl-sm"
                }`}>
                  {/* Reply preview */}
                  {message.reply_to && (
                    <div className={`px-3 pt-2 pb-1 border-l-2 ${
                      isMine ? "border-primary-foreground/50 bg-primary-foreground/10" : "border-primary/50 bg-primary/10"
                    } rounded-t-2xl`}>
                      <p className={`text-xs font-medium ${isMine ? "text-primary-foreground/80" : "text-primary"}`}>
                        {getMessageSenderName(message.reply_to.sender_id)}
                      </p>
                      <p className={`text-xs truncate ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {getMessagePreview(message.reply_to)}
                      </p>
                    </div>
                  )}

                  {/* Media content */}
                  {renderMedia(message, isMine)}

                  {/* Text content */}
                  <div className="px-4 py-2">
                    {(!message.media_type || (message.content && !["🎤 Message vocal", "📷 Photo", "🎬 Vidéo", "📎 Fichier"].includes(message.content))) && (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <button
                        onClick={() => handleReply(message)}
                        className={`text-xs ${isMine ? "text-primary-foreground/50 hover:text-primary-foreground/80" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                      <p className={`text-xs ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center gap-3">
          <div className="flex-1 border-l-2 border-primary pl-3">
            <p className="text-xs font-medium text-primary">
              Réponse à {getMessageSenderName(replyTo.sender_id)}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {getMessagePreview(replyTo)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={cancelReply} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="px-4 py-2 border-t border-border">
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
        </div>
      )}

      {/* Attachment menu */}
      {showAttachMenu && (
        <div className="px-4 py-3 bg-muted/30 border-t border-border flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { imageInputRef.current?.click(); }}>
            <Image className="w-4 h-4" />
            Photo
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { videoInputRef.current?.click(); }}>
            <Video className="w-4 h-4" />
            Vidéo
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { fileInputRef.current?.click(); }}>
            <FileText className="w-4 h-4" />
            Fichier
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-border bg-background sticky bottom-0">
        {isRecording ? (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={cancelRecording} className="text-destructive">
              <X className="w-5 h-5" />
            </Button>
            <div className="flex-1 flex items-center gap-2">
              <span className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-mono text-destructive">{formatRecordingTime(recordingDuration)}</span>
              <span className="text-sm text-muted-foreground">Enregistrement...</span>
            </div>
            <Button size="icon" onClick={stopRecording} className="rounded-full bg-primary">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : isUploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">Envoi en cours...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false); }} className="flex-shrink-0">
              <Smile className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); }} className="flex-shrink-0">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={replyTo ? "Répondre..." : "Écrire un message..."}
              className="flex-1 rounded-full"
            />
            {newMessage.trim() ? (
              <Button size="icon" onClick={() => sendMessage()} className="rounded-full flex-shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="icon" onClick={startRecording} variant="ghost" className="rounded-full flex-shrink-0">
                <Mic className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
