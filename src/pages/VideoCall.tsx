import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useWebRTC, formatCallDuration } from "@/hooks/useWebRTC";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  RotateCcw, Volume2, VolumeX, Maximize2,
  ArrowLeft, Phone
} from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  phone_number: string | null;
}

const VideoCall = () => {
  const { contactId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const callType = (searchParams.get("type") || "video") as "video" | "audio";
  const isIncoming = searchParams.get("incoming") === "true";
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const {
    callStatus,
    isMuted,
    isVideoOff,
    localStream,
    remoteStream,
    callDuration,
    startCall,
    answerIncoming,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  } = useWebRTC({
    contactId: contactId || "",
    callType,
    isIncoming,
    onCallEnded: () => {
      toast.success("Appel terminé");
      setTimeout(() => navigate(-1), 500);
    },
    onCallConnected: () => {
      toast.success("Appel connecté");
    },
  });

  useEffect(() => {
    const fetchContact = async () => {
      if (!contactId) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, phone_number")
        .eq("id", contactId)
        .single();
      
      if (data) {
        setContact(data);
      }
      setLoading(false);
    };

    fetchContact();
  }, [contactId]);

  // Start or answer call when component mounts - only trigger once
  const hasStartedRef = useRef(false);
  
  useEffect(() => {
    if (!loading && contact && callStatus === "idle" && !hasStartedRef.current) {
      hasStartedRef.current = true;
      if (isIncoming) {
        answerIncoming();
      } else {
        startCall();
      }
    }
  }, [loading, contact, callStatus, isIncoming]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video and audio elements
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(e => console.error("Audio play error:", e));
      }
    }
  }, [remoteStream]);

  const toggleSpeaker = () => {
    setIsSpeakerOff(!isSpeakerOff);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerOff;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isSpeakerOff;
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleEndCall = () => {
    endCall();
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
      {/* Hidden audio element for remote audio playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-20 text-white hover:bg-white/20"
        onClick={() => {
          endCall();
          navigate(-1);
        }}
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      {/* Remote video (or contact avatar for audio calls / not connected) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {callType === "video" && callStatus === "connected" && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white/20">
                <AvatarImage src={contact?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {contact?.display_name?.[0] || contact?.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              {(callStatus === "calling" || callStatus === "ringing") && (
                <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">
                {contact?.display_name || contact?.username || "Utilisateur"}
              </h2>
              <p className="text-white/70 mt-2">
                {callStatus === "idle" && "Initialisation..."}
                {callStatus === "calling" && "Connexion..."}
                {callStatus === "ringing" && "Appel en cours..."}
                {callStatus === "connected" && formatCallDuration(callDuration)}
                {callStatus === "ended" && "Appel terminé"}
              </p>
              {contact?.phone_number && (
                <p className="text-white/50 text-sm mt-1">{contact.phone_number}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Local video preview (for video calls) */}
      {callType === "video" && !isVideoOff && localStream && (
        <div 
          className={`absolute ${
            isFullscreen ? "inset-0" : "top-20 right-4 w-32 h-44"
          } rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 transition-all`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          {!isFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70"
              onClick={toggleFullscreen}
            >
              <Maximize2 className="w-3 h-3 text-white" />
            </Button>
          )}
        </div>
      )}

      {/* Call status badge */}
      {callStatus === "connected" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/50">
          <span className="text-green-400 text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {formatCallDuration(callDuration)}
          </span>
        </div>
      )}

      {/* Calling indicator */}
      {(callStatus === "calling" || callStatus === "ringing") && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary/20 rounded-full border border-primary/50">
          <span className="text-primary text-sm font-medium flex items-center gap-2">
            <Phone className="w-4 h-4 animate-bounce" />
            {callStatus === "calling" ? "Connexion..." : "Appel en cours..."}
          </span>
        </div>
      )}

      {/* Control buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
          {/* Mute button */}
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

          {/* Video toggle (only for video calls) */}
          {callType === "video" && (
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
          )}

          {/* End call button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
            onClick={handleEndCall}
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </Button>

          {/* Switch camera (only for video calls) */}
          {callType === "video" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30"
              onClick={switchCamera}
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </Button>
          )}

          {/* Speaker toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-14 w-14 rounded-full ${
              isSpeakerOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
            }`}
            onClick={toggleSpeaker}
          >
            {isSpeakerOff ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </Button>
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default VideoCall;
