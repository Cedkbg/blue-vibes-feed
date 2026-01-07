import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Phone, Video, PhoneCall, Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  is_online: boolean;
}

interface CallHistory {
  id: string;
  contact: Contact;
  type: "audio" | "video";
  direction: "incoming" | "outgoing" | "missed";
  timestamp: Date;
  duration?: number;
}

const Discover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);

  const fetchContacts = async () => {
    if (!user) return;
    setLoading(true);

    // Get users that the current user follows
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (follows && follows.length > 0) {
      const followingIds = follows.map(f => f.following_id);
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, phone_number, is_online")
        .in("id", followingIds);

      if (profiles) {
        setContacts(profiles);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();

    // Real-time presence updates
    const channel = supabase
      .channel("contacts-presence")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchContacts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAudioCall = (contact: Contact) => {
    if (!contact.phone_number) {
      toast({
        title: "Numéro non disponible",
        description: "Ce contact n'a pas de numéro de téléphone enregistré.",
        variant: "destructive",
      });
      return;
    }
    
    // Use tel: protocol for audio calls
    window.location.href = `tel:${contact.phone_number}`;
    
    toast({
      title: "Appel en cours...",
      description: `Appel audio vers ${contact.display_name || contact.username}`,
    });
  };

  const handleVideoCall = (contact: Contact) => {
    if (!contact.phone_number) {
      toast({
        title: "Numéro non disponible",
        description: "Ce contact n'a pas de numéro de téléphone enregistré.",
        variant: "destructive",
      });
      return;
    }
    
    // For video calls, we'll navigate to a video call page
    navigate(`/call/${contact.id}?type=video`);
    
    toast({
      title: "Appel vidéo en cours...",
      description: `Appel vidéo vers ${contact.display_name || contact.username}`,
    });
  };

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    return (
      contact.display_name?.toLowerCase().includes(query) ||
      contact.username?.toLowerCase().includes(query) ||
      contact.phone_number?.includes(query)
    );
  });

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-accent/50 transition-colors">
      <div className="relative" onClick={() => navigate(`/profile/${contact.id}`)}>
        <Avatar className="w-12 h-12 cursor-pointer">
          <AvatarImage src={contact.avatar_url || ""} />
          <AvatarFallback>{contact.display_name?.[0] || contact.username?.[0] || "U"}</AvatarFallback>
        </Avatar>
        {contact.is_online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {contact.display_name || contact.username || "Utilisateur"}
        </p>
        {contact.phone_number && (
          <p className="text-sm text-muted-foreground truncate">{contact.phone_number}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
          onClick={() => handleAudioCall(contact)}
        >
          <Phone className="w-5 h-5 text-primary" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
          onClick={() => handleVideoCall(contact)}
        >
          <Video className="w-5 h-5 text-primary" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <TopBar />

      <main className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-6">
          <PhoneCall className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Appels</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts">
            <ScrollArea className="h-[calc(100vh-280px)]">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <PhoneCall className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">
                      {searchQuery ? "Aucun contact trouvé" : "Aucun contact"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Suivez des utilisateurs pour les ajouter à vos contacts
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history">
            <ScrollArea className="h-[calc(100vh-280px)]">
              {callHistory.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Aucun appel récent</p>
                    <p className="text-sm text-muted-foreground">
                      Vos appels récents apparaîtront ici
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {callHistory.map((call) => (
                    <div key={call.id} className="flex items-center gap-3 p-3 rounded-xl bg-card">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={call.contact.avatar_url || ""} />
                        <AvatarFallback>{call.contact.display_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{call.contact.display_name || call.contact.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {call.type === "video" ? "Appel vidéo" : "Appel audio"} • 
                          {call.direction === "incoming" ? " Entrant" : call.direction === "outgoing" ? " Sortant" : " Manqué"}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => 
                        call.type === "video" ? handleVideoCall(call.contact) : handleAudioCall(call.contact)
                      }>
                        {call.type === "video" ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Discover;