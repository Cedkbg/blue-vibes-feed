import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CallSignal {
  id: string;
  caller_id: string;
  callee_id: string;
  call_type: string;
  signal_type: string;
  signal_data: any;
  created_at: string;
}

interface UseWebRTCOptions {
  contactId: string;
  callType: "video" | "audio";
  onCallEnded?: () => void;
  onCallConnected?: () => void;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export const useWebRTC = ({ contactId, callType, onCallEnded, onCallConnected }: UseWebRTCOptions) => {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "ringing" | "connected" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const signalChannelRef = useRef<any>(null);

  // Initialize local media stream
  const initLocalStream = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === "video" ? { facingMode: "user" } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast.error("Impossible d'accéder à la caméra ou au microphone");
      throw error;
    }
  }, [callType]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log("Remote track received:", event.streams[0]);
      remoteStreamRef.current = event.streams[0];
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && user) {
        console.log("Sending ICE candidate");
        await supabase.from("call_signals").insert({
          caller_id: user.id,
          callee_id: contactId,
          call_type: callType,
          signal_type: "ice-candidate",
          signal_data: event.candidate.toJSON() as any,
        } as any);
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
        onCallConnected?.();
        // Start call timer
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [user, contactId, callType, onCallConnected]);

  // Start a call (as caller)
  const startCall = useCallback(async () => {
    if (!user) return;

    try {
      setCallStatus("calling");
      
      // Initialize local stream
      await initLocalStream();
      
      // Create peer connection
      const pc = createPeerConnection();

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer signal
      await supabase.from("call_signals").insert({
        caller_id: user.id,
        callee_id: contactId,
        call_type: callType,
        signal_type: "offer",
        signal_data: offer as any,
      } as any);

      setCallStatus("ringing");
      console.log("Call offer sent");
    } catch (error) {
      console.error("Error starting call:", error);
      setCallStatus("ended");
      toast.error("Erreur lors de l'appel");
    }
  }, [user, contactId, callType, initLocalStream, createPeerConnection]);

  // Answer a call (as callee)
  const answerCall = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!user) return;

    try {
      setCallStatus("ringing");
      
      // Initialize local stream
      await initLocalStream();
      
      // Create peer connection
      const pc = createPeerConnection();

      // Set remote description (the offer)
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer signal
      await supabase.from("call_signals").insert({
        caller_id: user.id,
        callee_id: contactId,
        call_type: callType,
        signal_type: "answer",
        signal_data: answer as any,
      } as any);

      console.log("Call answer sent");
    } catch (error) {
      console.error("Error answering call:", error);
      setCallStatus("ended");
      toast.error("Erreur lors de la réponse à l'appel");
    }
  }, [user, contactId, callType, initLocalStream, createPeerConnection]);

  // Handle incoming signals
  const handleSignal = useCallback(async (signal: CallSignal) => {
    const pc = peerConnectionRef.current;
    
    console.log("Handling signal:", signal.signal_type);

    if (signal.signal_type === "offer" && signal.caller_id !== user?.id) {
      // Incoming call - show notification and wait for user to answer
      toast.info("Appel entrant...", { duration: 10000 });
      // Auto-answer for demo (in production, show UI to accept/decline)
      await answerCall(signal.signal_data);
    } else if (signal.signal_type === "answer" && pc) {
      // Call answered
      await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
    } else if (signal.signal_type === "ice-candidate" && pc && signal.caller_id !== user?.id) {
      // ICE candidate from remote peer
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.signal_data));
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    } else if (signal.signal_type === "end-call") {
      endCall();
    }
  }, [user, answerCall]);

  // Subscribe to signals
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`call-signals-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_signals",
          filter: `callee_id=eq.${user.id}`,
        },
        (payload) => {
          const signal = payload.new as CallSignal;
          handleSignal(signal);
        }
      )
      .subscribe();

    signalChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, handleSignal]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff((prev) => !prev);
    }
  }, []);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current) return;

    const currentTrack = localStreamRef.current.getVideoTracks()[0];
    if (!currentTrack) return;

    const currentSettings = currentTrack.getSettings();
    const newFacingMode = currentSettings.facingMode === "user" ? "environment" : "user";

    currentTrack.stop();

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
      });

      const newTrack = newStream.getVideoTracks()[0];
      
      // Replace track in peer connection
      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find(
          (s) => s.track?.kind === "video"
        );
        if (sender) {
          await sender.replaceTrack(newTrack);
        }
      }

      // Update local stream
      localStreamRef.current.removeTrack(currentTrack);
      localStreamRef.current.addTrack(newTrack);
      setLocalStream(new MediaStream([...localStreamRef.current.getTracks()]));
    } catch (error) {
      console.error("Error switching camera:", error);
    }
  }, []);

  // End call
  const endCall = useCallback(async () => {
    // Send end signal
    if (user && contactId) {
      await supabase.from("call_signals").insert({
        caller_id: user.id,
        callee_id: contactId,
        call_type: callType,
        signal_type: "end-call",
        signal_data: {} as any,
      } as any);
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    setCallStatus("ended");
    setRemoteStream(null);
    onCallEnded?.();
  }, [user, contactId, callType, onCallEnded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      if (signalChannelRef.current) {
        supabase.removeChannel(signalChannelRef.current);
      }
    };
  }, []);

  return {
    callStatus,
    isMuted,
    isVideoOff,
    localStream,
    remoteStream,
    callDuration,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  };
};

export const formatCallDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};
