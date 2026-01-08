import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Camera, RotateCcw, Volume2, VolumeX, Maximize2,
  ArrowLeft
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
  const { user } = useAuth();
  const callType = searchParams.get("type") || "video";
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [callStatus, setCallStatus] = useState<"connecting" | "ringing" | "connected" | "ended">("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Initialize media stream
  useEffect(() => {
    const initMediaStream = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: true,
          video: callType === "video" ? { facingMode: "user" } : false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        
        if (localVideoRef.current && callType === "video") {
          localVideoRef.current.srcObject = stream;
        }
        
        // Simulate call connection after 2 seconds
        setCallStatus("ringing");
        setTimeout(() => {
          setCallStatus("connected");
          // Start call timer
          callTimerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
          }, 1000);
        }, 2000);
        
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast.error("Impossible d'accéder à la caméra ou au microphone");
      }
    };

    initMediaStream();

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callType]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOff(!isSpeakerOff);
    // In a real implementation, this would control audio output
  };

  const switchCamera = async () => {
    if (localStreamRef.current) {
      const currentTrack = localStreamRef.current.getVideoTracks()[0];
      const currentSettings = currentTrack.getSettings();
      const newFacingMode = currentSettings.facingMode === "user" ? "environment" : "user";
      
      currentTrack.stop();
      
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacingMode }
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }
        
        // Replace video track
        localStreamRef.current.removeTrack(currentTrack);
        localStreamRef.current.addTrack(newStream.getVideoTracks()[0]);
      } catch (error) {
        console.error("Error switching camera:", error);
      }
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    setCallStatus("ended");
    
    toast.success("Appel terminé");
    setTimeout(() => navigate(-1), 500);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      {/* Remote video (or contact avatar for audio calls) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {callType === "video" && callStatus === "connected" ? (
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
              {callStatus === "ringing" && (
                <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">
                {contact?.display_name || contact?.username || "Utilisateur"}
              </h2>
              <p className="text-white/70 mt-2">
                {callStatus === "connecting" && "Connexion..."}
                {callStatus === "ringing" && "Appel en cours..."}
                {callStatus === "connected" && formatDuration(callDuration)}
                {callStatus === "ended" && "Appel terminé"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Local video preview (for video calls) */}
      {callType === "video" && !isVideoOff && (
        <div className={`absolute ${isFullscreen ? "inset-0" : "top-20 right-4 w-32 h-44"} rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 transition-all`}>
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
            {formatDuration(callDuration)}
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
            className={`h-14 w-14 rounded-full ${isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"}`}
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
              className={`h-14 w-14 rounded-full ${isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"}`}
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
            onClick={endCall}
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
            className={`h-14 w-14 rounded-full ${isSpeakerOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"}`}
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
