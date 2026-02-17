import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Plus, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { DesktopLayout } from "@/components/DesktopLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
  phone_number?: string | null;
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
  const [contactSearch, setContactSearch] = useState("");

  const fetchConversations = async () => {
    if (!user) return;

    const { data: convData } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!convData) {
      setIsLoading(false);
      return;
    }

    const otherUserIds = convData.map((c) =>
      c.user1_id === user.id ? c.user2_id : c.user1_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, is_online")
      .in("id", otherUserIds);

    const profilesMap = new Map<string, Profile>();
    profiles?.forEach((p) => profilesMap.set(p.id, p));

    const conversationsWithDetails = await Promise.all(
      convData.map(async (conv) => {
        const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, media_type")
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`
          )
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("sender_id", otherId)
          .eq("receiver_id", user.id)
          .eq("is_read", false);

        return {
          ...conv,
          other_user: profilesMap.get(otherId),
          last_message: lastMsg?.media_type === "audio" ? "🎤 Message vocal" : lastMsg?.media_type === "image" ? "📷 Photo" : lastMsg?.media_type === "video" ? "🎬 Vidéo" : lastMsg?.media_type === "file" ? "📎 Fichier" : lastMsg?.content,
          unread_count: count || 0,
        };
      })
    );

    setConversations(conversationsWithDetails);
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, is_online, phone_number")
      .neq("id", user.id)
      .limit(100);

    if (data) {
      setAllUsers(data);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-list-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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

  const filteredContacts = allUsers.filter((u) => {
    const name = u.display_name || u.username || "";
    return name.toLowerCase().includes(contactSearch.toLowerCase());
  });

  return (
    <DesktopLayout showRightSidebar={false} showTopBar={false}>
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <Sheet open={newChatOpen} onOpenChange={setNewChatOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Nouvelle conversation</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="mb-4"
                />
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {filteredUsers.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => startChat(profile.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={profile.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(profile.display_name || profile.username || "?")?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {profile.is_online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <span className="font-medium">
                        {profile.display_name || profile.username || "Utilisateur"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="discussions" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-background">
          <TabsTrigger 
            value="discussions" 
            className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <MessageCircle className="w-4 h-4" />
            Discussions
          </TabsTrigger>
          <TabsTrigger 
            value="contacts"
            className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <Users className="w-4 h-4" />
            Contacts
          </TabsTrigger>
        </TabsList>

        {/* Discussions Tab */}
        <TabsContent value="discussions" className="mt-0">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher une discussion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune discussion</p>
                <Button
                  variant="link"
                  onClick={() => setNewChatOpen(true)}
                  className="mt-2"
                >
                  Commencer une nouvelle conversation
                </Button>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => navigate(`/chat/${conversation.other_user?.id}`)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-14 h-14 bg-primary/10">
                      <AvatarImage src={conversation.other_user?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {(conversation.other_user?.display_name ||
                          conversation.other_user?.username ||
                          "?")?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.other_user?.is_online && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                    )}
                    {conversation.unread_count && conversation.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs text-primary-foreground font-bold">
                          {conversation.unread_count}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">
                        {conversation.other_user?.display_name ||
                          conversation.other_user?.username ||
                          "Utilisateur"}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>
                    <p
                      className={`text-sm truncate ${
                        conversation.unread_count && conversation.unread_count > 0
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {conversation.last_message || "Aucun message"}
                    </p>
                  </div>

                  <Button size="icon" variant="ghost">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </button>
              ))
            )}
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="mt-0">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un contact..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun contact trouvé</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => startChat(contact.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12 bg-primary/10">
                      <AvatarImage src={contact.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {(contact.display_name || contact.username || "?")?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {contact.is_online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">
                      {contact.display_name || contact.username || "Utilisateur"}
                    </h3>
                    {contact.phone_number && (
                      <p className="text-sm text-muted-foreground">{contact.phone_number}</p>
                    )}
                  </div>

                  <MessageCircle className="w-5 h-5 text-primary" />
                </button>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

    </DesktopLayout>
  );
};

export default Messages;