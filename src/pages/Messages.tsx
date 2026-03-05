import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MessageCircle, Camera, Archive, Pin, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { DesktopLayout } from "@/components/DesktopLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  other_user?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_online?: boolean;
  };
  last_message?: string;
  unread_count?: number;
}

interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_online?: boolean;
}

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data: convData } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!convData) { setIsLoading(false); return; }

    const otherUserIds = convData.map((c) => c.user1_id === user.id ? c.user2_id : c.user1_id);
    
    const [profilesRes, messagesRes, unreadRes] = await Promise.all([
      supabase.from("profiles_public")
        .select("id, display_name, username, avatar_url, is_online")
        .in("id", otherUserIds),
      supabase.from("messages")
        .select("sender_id, receiver_id, content, media_type, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("messages")
        .select("sender_id", { count: "exact", head: false })
        .eq("receiver_id", user.id)
        .eq("is_read", false),
    ]);

    const profilesMap = new Map<string, Profile>();
    profilesRes.data?.forEach((p) => profilesMap.set(p.id, p));

    const lastMsgMap = new Map<string, { content: string; media_type: string | null }>();
    messagesRes.data?.forEach((m) => {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!lastMsgMap.has(otherId)) {
        lastMsgMap.set(otherId, { content: m.content, media_type: m.media_type });
      }
    });

    const unreadMap = new Map<string, number>();
    unreadRes.data?.forEach((m: any) => {
      unreadMap.set(m.sender_id, (unreadMap.get(m.sender_id) || 0) + 1);
    });

    const conversationsWithDetails = convData.map((conv) => {
      const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
      const lastMsg = lastMsgMap.get(otherId);
      const preview = lastMsg?.media_type === "audio" ? "🎤 Message vocal" 
        : lastMsg?.media_type === "image" ? "📷 Photo" 
        : lastMsg?.media_type === "video" ? "🎬 Vidéo" 
        : lastMsg?.media_type === "file" ? "📎 Fichier" 
        : lastMsg?.content;

      return {
        ...conv,
        other_user: profilesMap.get(otherId),
        last_message: preview,
        unread_count: unreadMap.get(otherId) || 0,
      };
    });

    setConversations(conversationsWithDetails);
    setIsLoading(false);
  }, [user]);

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles_public")
      .select("id, display_name, username, avatar_url, is_online")
      .neq("id", user.id)
      .limit(100);
    if (data) setAllUsers(data);
  }, [user]);

  useEffect(() => { fetchConversations(); fetchUsers(); }, [fetchConversations, fetchUsers]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-list-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchConversations(), 1500);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchConversations(), 1500);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  const startChat = (userId: string) => {
    setNewChatOpen(false);
    navigate(`/chat/${userId}`);
  };

  const filteredUsers = allUsers.filter((u) => {
    const name = u.display_name || u.username || "";
    return name.toLowerCase().includes(userSearch.toLowerCase());
  });

  const filteredConversations = conversations.filter((c) => {
    const name = c.other_user?.display_name || c.other_user?.username || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <DesktopLayout showRightSidebar={false} showTopBar={false}>
      {/* Modern Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Messages</h1>
              {totalUnread > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalUnread} message{totalUnread > 1 ? 's' : ''} non lu{totalUnread > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground" onClick={() => navigate("/create-post")}>
                <Camera className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground" onClick={() => setNewChatOpen(true)}>
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher une conversation..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-10 bg-muted/50 border-none rounded-full h-10 focus-visible:ring-primary/30" 
            />
          </div>
        </div>

        {/* Online users strip */}
        {allUsers.filter(u => u.is_online).length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1">
              {allUsers.filter(u => u.is_online).slice(0, 15).map((u) => (
                <button 
                  key={u.id} 
                  onClick={() => startChat(u.id)}
                  className="flex flex-col items-center gap-1 min-w-[56px]"
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12 ring-2 ring-green-500/40">
                      <AvatarImage src={u.avatar_url || ""} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {(u.display_name || u.username || "?")?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full" />
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate w-14 text-center">
                    {(u.display_name || u.username || "User").split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conversations list */}
      <div className="pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground px-4">
            <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <MessageCircle className="w-10 h-10 opacity-30" />
            </div>
            <p className="font-semibold text-lg text-foreground">Aucune discussion</p>
            <p className="text-sm mt-1">Commencez à échanger avec vos contacts</p>
            <Button onClick={() => setNewChatOpen(true)} className="mt-4 rounded-full gap-2">
              <Plus className="w-4 h-4" /> Nouvelle conversation
            </Button>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button 
              key={conversation.id} 
              onClick={() => navigate(`/chat/${conversation.other_user?.id}`)} 
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 ${
                conversation.unread_count && conversation.unread_count > 0 ? "bg-primary/[0.03]" : ""
              }`}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={conversation.other_user?.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-lg font-semibold">
                    {(conversation.other_user?.display_name || conversation.other_user?.username || "?")?.[0]}
                  </AvatarFallback>
                </Avatar>
                {conversation.other_user?.is_online && (
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-[2.5px] border-background rounded-full" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className={`font-semibold truncate ${conversation.unread_count && conversation.unread_count > 0 ? "text-foreground" : "text-foreground"}`}>
                    {conversation.other_user?.display_name || conversation.other_user?.username || "Utilisateur"}
                  </h3>
                  <span className={`text-xs flex-shrink-0 ml-2 ${conversation.unread_count && conversation.unread_count > 0 ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {formatTime(conversation.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate pr-2 ${conversation.unread_count && conversation.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {conversation.last_message || "Aucun message"}
                  </p>
                  {conversation.unread_count && conversation.unread_count > 0 && (
                    <span className="min-w-[22px] h-[22px] bg-primary rounded-full flex items-center justify-center flex-shrink-0 px-1">
                      <span className="text-[11px] text-primary-foreground font-bold">
                        {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* FAB */}
      <Button 
        size="icon" 
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg z-50 gradient-primary" 
        onClick={() => setNewChatOpen(true)}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* New chat sheet */}
      <Sheet open={newChatOpen} onOpenChange={setNewChatOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Nouvelle conversation</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher un contact..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-10 rounded-full bg-muted/50 border-none" />
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {filteredUsers.map((profile) => (
                <button key={profile.id} onClick={() => startChat(profile.id)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">{(profile.display_name || profile.username || "?")?.[0]}</AvatarFallback>
                    </Avatar>
                    {profile.is_online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">{profile.display_name || profile.username || "Utilisateur"}</h3>
                    {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DesktopLayout>
  );
};

export default Messages;
