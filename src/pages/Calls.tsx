import { useState } from "react";
import { DesktopLayout } from "@/components/DesktopLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallHistory, formatDuration, CallRecord } from "@/hooks/useCallHistory";
import { useContactGroups } from "@/hooks/useContactGroups";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CreateContactGroupModal } from "@/components/CreateContactGroupModal";
import { EditContactGroupModal } from "@/components/EditContactGroupModal";
import { StartLiveModal } from "@/components/StartLiveModal";
import { 
  Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, 
  Clock, ArrowUpRight, ArrowDownLeft, Plus, Users, MoreVertical, Trash2, Pencil,
  Search, Radio, UserPlus
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface ContactProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_online?: boolean;
}

const Calls = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { callHistory, loading } = useCallHistory();
  const { groups, loading: groupsLoading, deleteGroup } = useContactGroups();
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState<ContactProfile[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [showStartLive, setShowStartLive] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles_public")
        .select("id, display_name, username, avatar_url, is_online")
        .neq("id", user.id)
        .limit(100);
      if (data) setContacts(data);
    };
    fetchContacts();
  }, [user]);

  const filteredCalls = filter === "missed"
    ? callHistory.filter((call) => call.status === "missed")
    : callHistory;

  const filteredContacts = contacts.filter((c) => {
    const name = c.display_name || c.username || "";
    return name.toLowerCase().includes(contactSearch.toLowerCase());
  });

  const getCallIcon = (call: CallRecord) => {
    const isOutgoing = call.caller_id === user?.id;
    if (call.status === "missed") return <PhoneMissed className="w-4 h-4 text-destructive" />;
    if (isOutgoing) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    return <ArrowDownLeft className="w-4 h-4 text-primary" />;
  };

  const getContactInfo = (call: CallRecord) => {
    const isOutgoing = call.caller_id === user?.id;
    const profile = isOutgoing ? call.callee_profile : call.caller_profile;
    return {
      id: isOutgoing ? call.callee_id : call.caller_id,
      name: profile?.display_name || profile?.username || "Utilisateur",
      avatar: profile?.avatar_url || null,
    };
  };

  return (
    <DesktopLayout showRightSidebar={false} showTopBar={false}>
      {/* WhatsApp-style header */}
      <header className="bg-primary text-primary-foreground px-6 py-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Appels</h1>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setShowStartLive(true)}
            >
              <Radio className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setShowContacts(true)}
            >
              <UserPlus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-background">
          <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Récents
          </TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Groupes
          </TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history" className="mt-0">
          {/* Sub-filter */}
          <div className="flex gap-2 px-4 py-3">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              className="rounded-full text-xs h-8"
              onClick={() => setFilter("all")}
            >
              Tous
            </Button>
            <Button
              size="sm"
              variant={filter === "missed" ? "default" : "outline"}
              className="rounded-full text-xs h-8"
              onClick={() => setFilter("missed")}
            >
              Manqués
            </Button>
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </>
            ) : filteredCalls.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Phone className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">{filter === "missed" ? "Aucun appel manqué" : "Aucun appel récent"}</p>
                <p className="text-sm mt-1">Appuyez sur le bouton ci-dessus pour appeler</p>
              </div>
            ) : (
              filteredCalls.map((call) => {
                const contact = getContactInfo(call);
                const isOutgoing = call.caller_id === user?.id;
                return (
                  <button
                    key={call.id}
                    className="w-full flex items-center gap-4 px-6 py-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => navigate(`/call/${contact.id}?type=${call.call_type}`)}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={contact.avatar || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">{contact.name[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${call.status === "missed" ? "text-destructive" : ""}`}>
                        {contact.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {getCallIcon(call)}
                        <span>{isOutgoing ? "Sortant" : "Entrant"}</span>
                        <span>·</span>
                        <span>{format(new Date(call.started_at), "dd MMM, HH:mm", { locale: fr })}</span>
                        {call.duration_seconds > 0 && (
                          <>
                            <span>·</span>
                            <span>{formatDuration(call.duration_seconds)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {call.call_type === "video" ? (
                      <Video className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="mt-0">
          <div className="px-4 py-3">
            <Button
              onClick={() => setShowCreateGroup(true)}
              className="w-full rounded-xl gap-2"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              Créer un groupe d'appel
            </Button>
          </div>

          <div className="divide-y divide-border">
            {groupsLoading ? (
              <>
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </>
            ) : groups.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Aucun groupe</p>
                <p className="text-sm mt-1">Créez un groupe pour des appels de groupe</p>
              </div>
            ) : (
              groups.map((group: any) => (
                <div key={group.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.members_count || 0} membre{(group.members_count || 0) > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => navigate(`/group-call/${group.id}?type=audio`)} className="h-9 w-9">
                      <Phone className="w-4 h-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => navigate(`/group-call/${group.id}?type=video`)} className="h-9 w-9">
                      <Video className="w-4 h-4 text-primary" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-9 w-9">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingGroup({ id: group.id, name: group.name })}>
                          <Pencil className="w-4 h-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteGroup(group.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* FAB for new call */}
      <Button
        size="icon"
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg z-50"
        onClick={() => setShowContacts(true)}
      >
        <Phone className="w-6 h-6" />
      </Button>

      {/* Contact picker sheet */}
      <Sheet open={showContacts} onOpenChange={setShowContacts}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Sélectionner un contact</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un contact..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-1 max-h-[65vh] overflow-y-auto">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={contact.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(contact.display_name || contact.username || "?")?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {contact.is_online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{contact.display_name || contact.username || "Utilisateur"}</h3>
                    {contact.username && <p className="text-xs text-muted-foreground">@{contact.username}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={() => { setShowContacts(false); navigate(`/call/${contact.id}?type=audio`); }}
                    >
                      <Phone className="w-4 h-4 text-primary" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={() => { setShowContacts(false); navigate(`/call/${contact.id}?type=video`); }}
                    >
                      <Video className="w-4 h-4 text-primary" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CreateContactGroupModal open={showCreateGroup} onOpenChange={setShowCreateGroup} />
      {editingGroup && (
        <EditContactGroupModal
          open={!!editingGroup}
          onOpenChange={(open) => !open && setEditingGroup(null)}
          groupId={editingGroup.id}
          groupName={editingGroup.name}
          onGroupUpdated={() => setEditingGroup(null)}
        />
      )}
      <StartLiveModal
        open={showStartLive}
        onOpenChange={setShowStartLive}
        onStreamStarted={(id) => navigate(`/live/${id}`)}
      />
    </DesktopLayout>
  );
};

export default Calls;
