import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallHistory, formatDuration, CallRecord } from "@/hooks/useCallHistory";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, 
  Clock, ArrowUpRight, ArrowDownLeft 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Calls = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { callHistory, loading } = useCallHistory();
  const [filter, setFilter] = useState<"all" | "missed">("all");

  const filteredCalls = filter === "missed"
    ? callHistory.filter((call) => call.status === "missed")
    : callHistory;

  const getCallIcon = (call: CallRecord) => {
    const isOutgoing = call.caller_id === user?.id;
    
    if (call.status === "missed") {
      return <PhoneMissed className="w-4 h-4 text-destructive" />;
    }
    if (isOutgoing) {
      return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    }
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

  const handleCall = (contactId: string, type: "video" | "audio") => {
    navigate(`/call/${contactId}?type=${type}`);
  };

  const CallItem = ({ call }: { call: CallRecord }) => {
    const contact = getContactInfo(call);
    const isOutgoing = call.caller_id === user?.id;

    return (
      <div className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors rounded-xl">
        <Avatar className="w-12 h-12">
          <AvatarImage src={contact.avatar || ""} />
          <AvatarFallback>{contact.name[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{contact.name}</span>
            {getCallIcon(call)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {call.call_type === "video" ? (
              <Video className="w-3 h-3" />
            ) : (
              <Phone className="w-3 h-3" />
            )}
            <span>
              {isOutgoing ? "Sortant" : "Entrant"} • {format(new Date(call.started_at), "dd MMM, HH:mm", { locale: fr })}
            </span>
          </div>
          {call.duration_seconds > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3" />
              {formatDuration(call.duration_seconds)}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleCall(contact.id, "audio")}
            className="rounded-full"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleCall(contact.id, "video")}
            className="rounded-full"
          >
            <Video className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const SkeletonItem = () => (
    <div className="flex items-center gap-3 p-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <div className="pt-16 px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-6 mb-6 shadow-glow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-primary-foreground/20 rounded-xl backdrop-blur-sm">
              <Phone className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">
                Appels
              </h1>
              <p className="text-primary-foreground/80 text-sm">
                Historique de vos appels
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "missed")} className="mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              Tous
            </TabsTrigger>
            <TabsTrigger value="missed" className="flex-1">
              Manqués
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Call List */}
        <div className="space-y-2">
          {loading ? (
            <>
              <SkeletonItem />
              <SkeletonItem />
              <SkeletonItem />
            </>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Phone className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">
                {filter === "missed" ? "Aucun appel manqué" : "Aucun appel"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Votre historique d'appels apparaîtra ici
              </p>
            </div>
          ) : (
            filteredCalls.map((call) => (
              <CallItem key={call.id} call={call} />
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Calls;
