import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useContactGroups } from "@/hooks/useContactGroups";
import { useAuth } from "@/hooks/useAuth";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Users, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

interface GroupMember {
  id: string;
  user_id: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    phone_number: string | null;
  };
}

const GroupCall = () => {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, getGroupMembers } = useContactGroups();
  const callType = (searchParams.get("type") || "video") as "video" | "audio";
  
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");

  const group = groups.find(g => g.id === groupId);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!groupId) return;
      const membersData = await getGroupMembers(groupId);
      setMembers(membersData);
      setLoading(false);
    };

    fetchMembers();
  }, [groupId, getGroupMembers]);

  const handleEndCall = () => {
    toast.success("Appel de groupe terminé");
    navigate("/calls");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-20 text-white hover:bg-white/20"
        onClick={() => {
          handleEndCall();
        }}
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      {/* Group info */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center">
        <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
          <Users className="w-4 h-4 text-white" />
          <span className="text-white font-medium">{group?.name || "Groupe"}</span>
        </div>
      </div>

      {/* Participants grid */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
          {/* Current user */}
          <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex flex-col items-center justify-center">
            <Avatar className="w-20 h-20 border-4 border-primary mb-2">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                Moi
              </AvatarFallback>
            </Avatar>
            <span className="text-white font-medium">Vous</span>
            {isMuted && (
              <div className="mt-2 bg-red-500/80 p-1.5 rounded-full">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Other participants */}
          {members.slice(0, 3).map((member) => (
            <div 
              key={member.id}
              className="aspect-square bg-gradient-to-br from-muted/20 to-muted/10 rounded-2xl flex flex-col items-center justify-center"
            >
              <Avatar className="w-20 h-20 border-4 border-white/20 mb-2">
                <AvatarImage src={member.profile?.avatar_url || ""} />
                <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                  {(member.profile?.display_name || member.profile?.username || "?")?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-white/80 font-medium text-sm">
                {member.profile?.display_name || member.profile?.username || "Utilisateur"}
              </span>
              <span className="text-white/50 text-xs mt-1">
                En attente...
              </span>
            </div>
          ))}

          {members.length > 3 && (
            <div className="aspect-square bg-muted/10 rounded-2xl flex items-center justify-center">
              <span className="text-white/60 text-lg">
                +{members.length - 3} autres
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Note about feature */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-yellow-500/20 border border-yellow-500/50 px-4 py-2 rounded-xl">
        <p className="text-yellow-300 text-sm text-center">
          Les appels de groupe sont en cours de développement
        </p>
      </div>

      {/* Control buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className={`h-14 w-14 rounded-full ${
              isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
            }`}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </Button>

          {callType === "video" && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-14 w-14 rounded-full ${
                isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
              }`}
              onClick={() => setIsVideoOff(!isVideoOff)}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6 text-white" />
              ) : (
                <Video className="w-6 h-6 text-white" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
            onClick={handleEndCall}
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupCall;
