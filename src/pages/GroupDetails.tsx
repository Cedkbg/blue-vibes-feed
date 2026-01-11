import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useGroupChat, GroupMessage } from "@/hooks/useGroupChat";
import { useGroupMembership } from "@/hooks/useGroupMembership";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, MessageCircle, Send, ArrowLeft, Crown, 
  Settings, LogOut, UserPlus, BadgeCheck, Paperclip, Image as ImageIcon, X, FileText
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  members_count: number;
  creator_id: string;
}

interface MemberInfo {
  id: string;
  user_id: string;
  role: string | null;
  joined_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

const GroupDetails = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMemberOfGroup, joinGroup, leaveGroup } = useGroupMembership();
  const { messages, loading: messagesLoading, sendMessage } = useGroupChat({ groupId });
  
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isMember = groupId ? isMemberOfGroup(groupId) : false;
  const isCreator = user?.id === group?.creator_id;

  const fetchGroupData = async () => {
    if (!groupId) return;

    setLoading(true);

    // Fetch group info
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupError || !groupData) {
      toast.error("Groupe non trouvé");
      navigate("/friends");
      return;
    }

    setGroup(groupData);

    // Fetch members
    const { data: membersData } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });

    if (membersData && membersData.length > 0) {
      const userIds = membersData.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, is_verified")
        .in("id", userIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.id, p]) || []
      );

      setMembers(
        membersData.map((m) => ({
          ...m,
          profile: profileMap.get(m.user_id),
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Le fichier est trop volumineux (max 10MB)");
        return;
      }
      setSelectedFile(file);
      
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; type: string } | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${groupId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Erreur lors de l'upload du fichier");
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      const mediaType = file.type.startsWith("image/") ? "image" : "file";
      return { url: publicUrl, type: mediaType };
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !selectedFile) || sending) return;

    setSending(true);
    setUploading(selectedFile !== null);

    let mediaUrl: string | undefined;
    let mediaType: string | undefined;

    if (selectedFile) {
      const uploadResult = await uploadFile(selectedFile);
      if (uploadResult) {
        mediaUrl = uploadResult.url;
        mediaType = uploadResult.type;
      }
    }

    await sendMessage(messageText, mediaUrl, mediaType);
    setMessageText("");
    clearSelectedFile();
    setSending(false);
    setUploading(false);
  };

  const handleJoinLeave = async () => {
    if (!groupId) return;

    if (isMember) {
      await leaveGroup(groupId);
    } else {
      await joinGroup(groupId);
    }
    fetchGroupData();
  };

  const MessageItem = ({ message }: { message: GroupMessage }) => {
    const isOwn = message.user_id === user?.id;

    return (
      <div className={`flex gap-2 mb-3 ${isOwn ? "flex-row-reverse" : ""}`}>
        {!isOwn && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.profile?.avatar_url || ""} />
            <AvatarFallback>
              {message.profile?.display_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
          {!isOwn && (
            <p className="text-xs text-muted-foreground mb-1">
              {message.profile?.display_name || message.profile?.username}
            </p>
          )}
          <div
            className={`rounded-2xl px-4 py-2 ${
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {message.media_url && message.media_type === "image" && (
              <img 
                src={message.media_url} 
                alt="Image partagée" 
                className="rounded-lg max-w-full mb-2 cursor-pointer"
                onClick={() => window.open(message.media_url!, "_blank")}
              />
            )}
            {message.media_url && message.media_type === "file" && (
              <a 
                href={message.media_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-background/20 rounded-lg mb-2 hover:bg-background/30 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm underline">Télécharger le fichier</span>
              </a>
            )}
            {message.content && <p className="text-sm">{message.content}</p>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(message.created_at), "HH:mm")}
          </p>
        </div>
      </div>
    );
  };

  const MemberItem = ({ member }: { member: MemberInfo }) => (
    <div 
      className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-xl cursor-pointer transition-colors"
      onClick={() => navigate(`/profile/${member.user_id}`)}
    >
      <Avatar className="w-10 h-10">
        <AvatarImage src={member.profile?.avatar_url || ""} />
        <AvatarFallback>
          {member.profile?.display_name?.[0] || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium truncate">
            {member.profile?.display_name || member.profile?.username || "Utilisateur"}
          </span>
          {member.profile?.is_verified && (
            <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
          )}
          {member.role === "admin" && (
            <Badge variant="secondary" className="ml-1 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Membre depuis {format(new Date(member.joined_at), "MMM yyyy", { locale: fr })}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="pt-16 px-4 max-w-2xl mx-auto">
          <Skeleton className="h-40 w-full rounded-xl mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <div className="pt-16 max-w-2xl mx-auto">
        {/* Header */}
        <div className="relative">
          <div 
            className="h-32 bg-gradient-to-br from-primary/30 to-accent/30"
            style={group.cover_url ? { 
              backgroundImage: `url(${group.cover_url})`, 
              backgroundSize: "cover",
              backgroundPosition: "center" 
            } : {}}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-4 -mt-10 mb-4">
          <div className="flex items-end gap-4">
            <Avatar className="w-20 h-20 border-4 border-background">
              <AvatarImage src={group.avatar_url || ""} />
              <AvatarFallback>
                <Users className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <h1 className="text-xl font-bold">{group.name}</h1>
              <p className="text-sm text-muted-foreground">
                {group.members_count || members.length} membres
              </p>
            </div>
            {!isCreator && (
              <Button
                variant={isMember ? "outline" : "default"}
                onClick={handleJoinLeave}
              >
                {isMember ? (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Quitter
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Rejoindre
                  </>
                )}
              </Button>
            )}
          </div>
          {group.description && (
            <p className="text-muted-foreground mt-3">{group.description}</p>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chat" className="px-4">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="chat" className="flex-1 gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="members" className="flex-1 gap-2">
              <Users className="w-4 h-4" />
              Membres ({members.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0">
            {isMember ? (
              <div className="flex flex-col h-[50vh]">
                <ScrollArea className="flex-1 pr-4">
                  {messagesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-2">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div>
                            <Skeleton className="h-3 w-20 mb-1" />
                            <Skeleton className="h-10 w-48 rounded-xl" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun message encore</p>
                      <p className="text-sm">Soyez le premier à écrire !</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <MessageItem key={msg.id} message={msg} />
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </ScrollArea>

                {/* File preview */}
                {selectedFile && (
                  <div className="mb-2 p-2 bg-muted rounded-lg flex items-center gap-2">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-background rounded flex items-center justify-center">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={clearSelectedFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Écrire un message..."
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    disabled={sending}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={(!messageText.trim() && !selectedFile) || sending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Rejoignez le groupe</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Devenez membre pour participer au chat
                </p>
                <Button onClick={handleJoinLeave}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Rejoindre
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-0">
            <div className="space-y-1">
              {members.map((member) => (
                <MemberItem key={member.id} member={member} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default GroupDetails;
