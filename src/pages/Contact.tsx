import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MessageCircle, Camera, Phone, Video, Users, Radio, UserPlus, MoreVertical, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DesktopLayout } from "@/components/DesktopLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCallHistory, formatDuration, CallRecord } from "@/hooks/useCallHistory";
import { useContactGroups } from "@/hooks/useContactGroups";
import { CreateContactGroupModal } from "@/components/CreateContactGroupModal";
import { EditContactGroupModal } from "@/components/EditContactGroupModal";
import { StartLiveModal } from "@/components/StartLiveModal";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  PhoneMissed, ArrowUpRight, ArrowDownLeft, Clock
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const Contact = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("messages");

  // Touch swipe
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 60) {
      if (diff > 0) setActiveTab("calls");
      else setActiveTab("messages");
    }
  };

  // === Messages state ===
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // === Calls state ===
  const { callHistory, loading: callsLoading } = useCallHistory();
  const { groups, loading: groupsLoading, deleteGroup } = useContactGroups();
  const [callFilter, setCallFilter] = useState<"all" | "missed">("all");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [showStartLive, setShowStartLive] = useState(false);
  const [callSubTab, setCallSubTab] = useState("history");

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data: convData } = await supabase
      .from("conversations").select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });
    if (!convData) { setIsLoading(false); return; }
    const otherUserIds = convData.map((c) => c.user1_id === user.id ? c.user2_id : c.user1_id);
    const [profilesRes, messagesRes, unreadRes] = await Promise.all([
      supabase.from("profiles_public").select("id, display_name, username, avatar_url, is_online").in("id", otherUserIds),
      supabase.from("messages").select("sender_id, receiver_id, content, media_type, created_at").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(200),
      supabase.from("messages").select("sender_id", { count: "exact", head: false }).eq("receiver_id", user.id).eq("is_read", false),
    ]);
    const profilesMap = new Map<string, Profile>();
    profilesRes.data?.forEach((p) => profilesMap.set(p.id, p));
    const lastMsgMap = new Map<string, { content: string; media_type: string | null }>();
    messagesRes.data?.forEach((m) => {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!lastMsgMap.has(otherId)) lastMsgMap.set(otherId, { content: m.content, media_type: m.media_type });
    });
    const unreadMap = new Map<string, number>();
    unreadRes.data?.forEach((m: any) => { unreadMap.set(m.sender_id, (unreadMap.get(m.sender_id) || 0) + 1); });
    setConversations(convData.map((conv) => {
      const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
      const lastMsg = lastMsgMap.get(otherId);
      const preview = lastMsg?.media_type === "audio" ? "🎤 Message vocal" : lastMsg?.media_type === "image" ? "📷 Photo" : lastMsg?.media_type === "video" ? "🎬 Vidéo" : lastMsg?.media_type === "file" ? "📎 Fichier" : lastMsg?.content;
      return { ...conv, other_user: profilesMap.get(otherId), last_message: preview, unread_count: unreadMap.get(otherId) || 0 };
    }));
    setIsLoading(false);
  }, [user]);

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles_public").select("id, display_name, username, avatar_url, is_online").neq("id", user.id).limit(100);
    if (data) { setAllUsers(data); setContacts(data); }
  }, [user]);

  useEffect(() => { fetchConversations(); fetchUsers(); }, [fetchConversations, fetchUsers]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("contact-realtime")
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

  const startChat = (userId: string) => { setNewChatOpen(false); navigate(`/chat/${userId}`); };

  const filteredUsers = allUsers.filter((u) => (u.display_name || u.username || "").toLowerCase().includes(userSearch.toLowerCase()));
  const filteredConversations = conversations.filter((c) => (c.other_user?.display_name || c.other_user?.username || "").toLowerCase().includes(searchQuery.toLowerCase()));
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const filteredCalls = callFilter === "missed" ? callHistory.filter((call) => call.status === "missed") : callHistory;
  const filteredContacts = contacts.filter((c) => (c.display_name || c.username || "").toLowerCase().includes(contactSearch.toLowerCase()));

  const getCallIcon = (call: CallRecord) => {
    if (call.status === "missed") return <PhoneMissed className="w-4 h-4 text-destructive" />;
    if (call.caller_id === user?.id) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    return <ArrowDownLeft className="w-4 h-4 text-primary" />;
  };

  const getContactInfo = (call: CallRecord) => {
    const isOutgoing = call.caller_id === user?.id;
    const profile = isOutgoing ? call.callee_profile : call.caller_profile;
    return { id: isOutgoing ? call.callee_id : call.caller_id, name: profile?.display_name || profile?.username || "Utilisateur", avatar: profile?.avatar_url || null };
  };

  return (
    <DesktopLayout showRightSidebar={false} showTopBar={false}>
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">Contact</h1>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setShowStartLive(true)}>
              <Radio className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => activeTab === "messages" ? setNewChatOpen(true) : setShowContacts(true)}>
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
        {/* Main tabs in header */}
        <div className="flex">
          <button
            className={`flex-1 pb-2 text-sm font-semibold text-center border-b-2 transition-colors ${activeTab === "calls" ? "border-primary-foreground text-primary-foreground" : "border-transparent text-primary-foreground/60"}`}
            onClick={() => setActiveTab("calls")}
          >
            Appels
          </button>
          <button
            className={`flex-1 pb-2 text-sm font-semibold text-center border-b-2 transition-colors ${activeTab === "messages" ? "border-primary-foreground text-primary-foreground" : "border-transparent text-primary-foreground/60"}`}
            onClick={() => setActiveTab("messages")}
          >
            Messages {totalUnread > 0 && <span className="ml-1 bg-primary-foreground text-primary text-[10px] px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
          </button>
        </div>
      </div>

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="min-h-[60vh]">
        {/* === MESSAGES TAB === */}
        {activeTab === "messages" && (
          <>
            <div className="px-4 py-3 bg-card border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-muted/50 border-none rounded-full h-10" />
              </div>
            </div>
            {/* Online strip */}
            {allUsers.filter(u => u.is_online).length > 0 && (
              <div className="px-4 py-2 border-b border-border">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1">
                  {allUsers.filter(u => u.is_online).slice(0, 15).map((u) => (
                    <button key={u.id} onClick={() => startChat(u.id)} className="flex flex-col items-center gap-1 min-w-[56px]">
                      <div className="relative">
                        <Avatar className="w-12 h-12 ring-2 ring-green-500/40"><AvatarImage src={u.avatar_url || ""} /><AvatarFallback className="text-xs bg-primary/10 text-primary">{(u.display_name || u.username || "?")?.[0]}</AvatarFallback></Avatar>
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full" />
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate w-14 text-center">{(u.display_name || u.username || "User").split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Conversations */}
            <div className="pb-20">
              {isLoading ? (
                <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground px-4">
                  <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center"><MessageCircle className="w-10 h-10 opacity-30" /></div>
                  <p className="font-semibold text-lg text-foreground">Aucune discussion</p>
                  <p className="text-sm mt-1">Commencez à échanger avec vos contacts</p>
                  <Button onClick={() => setNewChatOpen(true)} className="mt-4 rounded-full gap-2"><Plus className="w-4 h-4" /> Nouvelle conversation</Button>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button key={conversation.id} onClick={() => navigate(`/chat/${conversation.other_user?.id}`)} className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 ${conversation.unread_count && conversation.unread_count > 0 ? "bg-primary/[0.03]" : ""}`}>
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-14 h-14"><AvatarImage src={conversation.other_user?.avatar_url || ""} /><AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-lg font-semibold">{(conversation.other_user?.display_name || conversation.other_user?.username || "?")?.[0]}</AvatarFallback></Avatar>
                      {conversation.other_user?.is_online && <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-[2.5px] border-background rounded-full" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold truncate">{conversation.other_user?.display_name || conversation.other_user?.username || "Utilisateur"}</h3>
                        <span className={`text-xs flex-shrink-0 ml-2 ${conversation.unread_count && conversation.unread_count > 0 ? "text-primary font-bold" : "text-muted-foreground"}`}>{formatTime(conversation.last_message_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate pr-2 ${conversation.unread_count && conversation.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>{conversation.last_message || "Aucun message"}</p>
                        {conversation.unread_count && conversation.unread_count > 0 && (
                          <span className="min-w-[22px] h-[22px] bg-primary rounded-full flex items-center justify-center flex-shrink-0 px-1"><span className="text-[11px] text-primary-foreground font-bold">{conversation.unread_count > 99 ? "99+" : conversation.unread_count}</span></span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <Button size="icon" className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg z-50 gradient-primary" onClick={() => setNewChatOpen(true)}><MessageCircle className="w-6 h-6" /></Button>
          </>
        )}

        {/* === CALLS TAB === */}
        {activeTab === "calls" && (
          <>
            <Tabs value={callSubTab} onValueChange={setCallSubTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-background">
                <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Récents</TabsTrigger>
                <TabsTrigger value="groups" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Groupes</TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-0">
                <div className="flex gap-2 px-4 py-3">
                  <Button size="sm" variant={callFilter === "all" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setCallFilter("all")}>Tous</Button>
                  <Button size="sm" variant={callFilter === "missed" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setCallFilter("missed")}>Manqués</Button>
                </div>
                <div className="divide-y divide-border pb-20">
                  {callsLoading ? (
                    [1, 2, 3].map((i) => <div key={i} className="flex items-center gap-3 px-6 py-3"><Skeleton className="w-12 h-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div>)
                  ) : filteredCalls.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground"><Phone className="w-12 h-12 mx-auto mb-4 opacity-30" /><p className="font-medium">{callFilter === "missed" ? "Aucun appel manqué" : "Aucun appel récent"}</p></div>
                  ) : (
                    filteredCalls.map((call) => {
                      const contact = getContactInfo(call);
                      const isOutgoing = call.caller_id === user?.id;
                      return (
                        <button key={call.id} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-muted/50 transition-colors text-left" onClick={() => navigate(`/call/${contact.id}?type=${call.call_type}`)}>
                          <Avatar className="w-12 h-12"><AvatarImage src={contact.avatar || ""} /><AvatarFallback className="bg-primary/10 text-primary">{contact.name[0]?.toUpperCase()}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium truncate ${call.status === "missed" ? "text-destructive" : ""}`}>{contact.name}</h3>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              {getCallIcon(call)}<span>{isOutgoing ? "Sortant" : "Entrant"}</span><span>·</span><span>{format(new Date(call.started_at), "dd MMM, HH:mm", { locale: fr })}</span>
                              {call.duration_seconds > 0 && <><span>·</span><span>{formatDuration(call.duration_seconds)}</span></>}
                            </div>
                          </div>
                          {call.call_type === "video" ? <Video className="w-5 h-5 text-primary flex-shrink-0" /> : <Phone className="w-5 h-5 text-primary flex-shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="groups" className="mt-0">
                <div className="px-4 py-3"><Button onClick={() => setShowCreateGroup(true)} className="w-full rounded-xl gap-2" variant="outline"><Plus className="w-4 h-4" /> Créer un groupe d'appel</Button></div>
                <div className="divide-y divide-border pb-20">
                  {groupsLoading ? (
                    [1, 2].map((i) => <div key={i} className="flex items-center gap-3 px-6 py-3"><Skeleton className="w-12 h-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div>)
                  ) : groups.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-4 opacity-30" /><p className="font-medium">Aucun groupe</p></div>
                  ) : (
                    groups.map((group: any) => (
                      <div key={group.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div>
                        <div className="flex-1 min-w-0"><h3 className="font-medium truncate">{group.name}</h3><p className="text-sm text-muted-foreground">{group.members_count || 0} membre{(group.members_count || 0) > 1 ? "s" : ""}</p></div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/group-call/${group.id}?type=audio`)} className="h-9 w-9"><Phone className="w-4 h-4 text-primary" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/group-call/${group.id}?type=video`)} className="h-9 w-9"><Video className="w-4 h-4 text-primary" /></Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-9 w-9"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingGroup({ id: group.id, name: group.name })}><Pencil className="w-4 h-4 mr-2" /> Modifier</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteGroup(group.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <Button size="icon" className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg z-50" onClick={() => setShowContacts(true)}><Phone className="w-6 h-6" /></Button>
          </>
        )}
      </div>

      {/* Sheets & Modals */}
      <Sheet open={newChatOpen} onOpenChange={setNewChatOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
          <SheetHeader><SheetTitle>Nouvelle conversation</SheetTitle></SheetHeader>
          <div className="mt-4">
            <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Rechercher un contact..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-10 rounded-full bg-muted/50 border-none" /></div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {filteredUsers.map((profile) => (
                <button key={profile.id} onClick={() => startChat(profile.id)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="relative"><Avatar className="w-12 h-12"><AvatarImage src={profile.avatar_url || ""} /><AvatarFallback className="bg-primary/10 text-primary">{(profile.display_name || profile.username || "?")?.[0]}</AvatarFallback></Avatar>{profile.is_online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />}</div>
                  <div className="text-left"><h3 className="font-medium">{profile.display_name || profile.username || "Utilisateur"}</h3>{profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}</div>
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showContacts} onOpenChange={setShowContacts}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader><SheetTitle>Sélectionner un contact</SheetTitle></SheetHeader>
          <div className="mt-4">
            <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Rechercher un contact..." value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} className="pl-10" /></div>
            <div className="space-y-1 max-h-[65vh] overflow-y-auto">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="relative"><Avatar className="w-12 h-12"><AvatarImage src={contact.avatar_url || ""} /><AvatarFallback className="bg-primary/10 text-primary">{(contact.display_name || contact.username || "?")?.[0]}</AvatarFallback></Avatar>{contact.is_online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />}</div>
                  <div className="flex-1 min-w-0"><h3 className="font-medium truncate">{contact.display_name || contact.username || "Utilisateur"}</h3>{contact.username && <p className="text-xs text-muted-foreground">@{contact.username}</p>}</div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => { setShowContacts(false); navigate(`/call/${contact.id}?type=audio`); }}><Phone className="w-4 h-4 text-primary" /></Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => { setShowContacts(false); navigate(`/call/${contact.id}?type=video`); }}><Video className="w-4 h-4 text-primary" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CreateContactGroupModal open={showCreateGroup} onOpenChange={setShowCreateGroup} />
      {editingGroup && <EditContactGroupModal open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)} groupId={editingGroup.id} groupName={editingGroup.name} onGroupUpdated={() => setEditingGroup(null)} />}
      <StartLiveModal open={showStartLive} onOpenChange={setShowStartLive} onStreamStarted={(id) => navigate(`/live/${id}`)} />
    </DesktopLayout>
  );
};

export default Contact;
