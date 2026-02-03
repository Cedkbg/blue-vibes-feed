import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useContactGroups } from "@/hooks/useContactGroups";
import { useGroupWebRTC, formatCallDuration } from "@/hooks/useGroupWebRTC";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Users, ArrowLeft, RotateCcw
} from "lucide-react";
import { toast } from "sonner";

const GroupCall = () => {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { groups } = useContactGroups();
  const callType = (searchParams.get("type") || "video") as "video" | "audio";
  const hasJoinedRef = useRef(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const group = groups.find(g => g.id === groupId);

  const {
    callStatus,
    isMuted,
    isVideoOff,
    localStream,
    participants,
    callDuration,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  } = useGroupWebRTC({
    groupId: groupId || "",
    callType,
    onCallEnded: () => navigate("/calls"),
  });

  // Auto-join call on mount
  useEffect(() => {
    if (groupId && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      joinCall();
    }
  }, [groupId, joinCall]);

  // Attach local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleEndCall = () => {
    leaveCall();
    toast.success("Appel de groupe terminé");
  };

  if (callStatus === "idle" || callStatus === "joining") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
        <p className="text-white">Connexion à l'appel...</p>
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
        onClick={handleEndCall}
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      {/* Group info & duration */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white font-medium">{group?.name || "Groupe"}</span>
          </div>
          <span className="text-white/80 text-sm font-mono">
            {formatCallDuration(callDuration)}
          </span>
        </div>
      </div>

      {/* Video grid */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-20 pb-32">
        <div className={`grid gap-2 w-full h-full max-w-4xl ${
          participants.length === 0 ? "grid-cols-1" :
          participants.length <= 1 ? "grid-cols-2" :
          participants.length <= 3 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"
        }`}>
          {/* Local video */}
          <div className="relative bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl overflow-hidden flex items-center justify-center">
            {callType === "video" && !isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center">
                <Avatar className="w-20 h-20 border-4 border-primary mb-2">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    Moi
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-lg">
              <span className="text-white text-sm font-medium">Vous</span>
            </div>
            {isMuted && (
              <div className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Remote participants */}
          {participants.map((participant) => (
            <div 
              key={participant.id}
              className="relative bg-gradient-to-br from-muted/20 to-muted/10 rounded-2xl overflow-hidden flex items-center justify-center"
            >
              {participant.stream && callType === "video" ? (
                <video
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el && participant.stream) {
                      el.srcObject = participant.stream;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <Avatar className="w-20 h-20 border-4 border-white/20 mb-2">
                    <AvatarImage src={participant.profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                      {(participant.profile?.display_name || participant.profile?.username || "?")?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-lg">
                <span className="text-white text-sm font-medium">
                  {participant.profile?.display_name || participant.profile?.username || "Participant"}
                </span>
              </div>
              {!participant.stream && (
                <div className="absolute top-2 right-2 bg-yellow-500/80 px-2 py-1 rounded-full">
                  <span className="text-white text-xs">Connexion...</span>
                </div>
              )}
            </div>
          ))}

          {/* Empty slots placeholder */}
          {participants.length === 0 && (
            <div className="bg-muted/10 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 text-white/30 mx-auto mb-2" />
                <p className="text-white/50 text-sm">
                  En attente des autres participants...
                </p>
              </div>
            </div>
          )}
        </div>
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
            onClick={toggleMute}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </Button>

          {callType === "video" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={`h-14 w-14 rounded-full ${
                  isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
                }`}
                onClick={toggleVideo}
              >
                {isVideoOff ? (
                  <VideoOff className="w-6 h-6 text-white" />
                ) : (
                  <Video className="w-6 h-6 text-white" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30"
                onClick={switchCamera}
              >
                <RotateCcw className="w-6 h-6 text-white" />
              </Button>
            </>
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
