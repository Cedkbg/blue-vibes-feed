import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

let currentCallRecordId: string | null = null;

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
  isIncoming?: boolean;
  onCallEnded?: () => void;
  onCallConnected?: () => void;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

export const useWebRTC = ({ contactId, callType, isIncoming, onCallEnded, onCallConnected }: UseWebRTCOptions) => {
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
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isNegotiatingRef = useRef(false);

  // Initialize local media stream
  const initLocalStream = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
        video: callType === "video" ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      console.log("Local stream initialized, tracks:", stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast.error("Impossible d'accéder à la caméra ou au microphone");
      throw error;
    }
  }, [callType]);

  // Create peer connection
  const createPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection({ 
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
    });

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => {
      console.log("Adding track to peer connection:", track.kind, track.enabled);
      pc.addTrack(track, stream);
    });

    // Create a remote stream to collect remote tracks
    const remoteMediaStream = new MediaStream();
    remoteStreamRef.current = remoteMediaStream;

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log("Remote track received:", event.track.kind, "streams:", event.streams.length);
      event.streams[0].getTracks().forEach((track) => {
        console.log("Adding remote track:", track.kind, track.enabled, track.readyState);
        remoteMediaStream.addTrack(track);
      });
      setRemoteStream(new MediaStream(remoteMediaStream.getTracks()));
    };

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && user) {
        console.log("Sending ICE candidate:", event.candidate.candidate.substring(0, 50));
        await supabase.from("call_signals").insert({
          caller_id: user.id,
          callee_id: contactId,
          call_type: callType,
          signal_type: "ice-candidate",
          signal_data: event.candidate.toJSON() as any,
        } as any);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    // Connection state changes
    pc.onconnectionstatechange = async () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
        onCallConnected?.();
        
        if (currentCallRecordId) {
          await supabase
            .from("call_history")
            .update({ status: "connected" })
            .eq("id", currentCallRecordId);
        }
        
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        console.log("Connection lost, ending call");
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [user, contactId, callType, onCallConnected]);

  // Add pending ICE candidates
  const addPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    while (pendingCandidatesRef.current.length > 0) {
      const candidate = pendingCandidatesRef.current.shift()!;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Added pending ICE candidate");
      } catch (error) {
        console.error("Error adding pending ICE candidate:", error);
      }
    }
  }, []);

  // Start a call (as caller)
  const startCall = useCallback(async () => {
    if (!user || callStatus !== "idle") return;

    try {
      setCallStatus("calling");
      isNegotiatingRef.current = true;
      
      const { data: callRecord } = await supabase
        .from("call_history")
        .insert({
          caller_id: user.id,
          callee_id: contactId,
          call_type: callType,
          status: "calling",
        })
        .select()
        .single();
      
      if (callRecord) currentCallRecordId = callRecord.id;
      
      const stream = await initLocalStream();
      if (!stream) throw new Error("Failed to get media stream");
      
      const pc = createPeerConnection(stream);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });
      await pc.setLocalDescription(offer);

      await supabase.from("call_signals").insert({
        caller_id: user.id,
        callee_id: contactId,
        call_type: callType,
        signal_type: "offer",
        signal_data: { type: offer.type, sdp: offer.sdp } as any,
      } as any);

      setCallStatus("ringing");
      isNegotiatingRef.current = false;
      console.log("Call offer sent");
    } catch (error) {
      console.error("Error starting call:", error);
      isNegotiatingRef.current = false;
      setCallStatus("ended");
      toast.error("Erreur lors de l'appel");
    }
  }, [user, contactId, callType, callStatus, initLocalStream, createPeerConnection]);

  // Answer incoming call
  const answerIncoming = useCallback(async () => {
    if (!user || !contactId) return;

    try {
      setCallStatus("ringing");
      isNegotiatingRef.current = true;
      
      const { data: signals, error } = await supabase
        .from("call_signals")
        .select("*")
        .eq("caller_id", contactId)
        .eq("callee_id", user.id)
        .eq("signal_type", "offer")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !signals || signals.length === 0) {
        console.error("No offer found for incoming call");
        toast.error("Appel non trouvé");
        setCallStatus("ended");
        isNegotiatingRef.current = false;
        return;
      }

      const offerData = signals[0].signal_data as any;
      const offer = new RTCSessionDescription({ type: offerData.type, sdp: offerData.sdp });
      
      const stream = await initLocalStream();
      if (!stream) throw new Error("Failed to get media stream");
      
      const pc = createPeerConnection(stream);

      await pc.setRemoteDescription(offer);
      
      // Add any pending ICE candidates
      await addPendingCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await supabase.from("call_signals").insert({
        caller_id: user.id,
        callee_id: contactId,
        call_type: callType,
        signal_type: "answer",
        signal_data: { type: answer.type, sdp: answer.sdp } as any,
      } as any);

      isNegotiatingRef.current = false;
      console.log("Call answer sent for incoming call");
      
      // Fetch any ICE candidates that arrived while we were setting up
      const { data: iceCandidates } = await supabase
        .from("call_signals")
        .select("*")
        .eq("caller_id", contactId)
        .eq("callee_id", user.id)
        .eq("signal_type", "ice-candidate")
        .order("created_at", { ascending: true });
      
      if (iceCandidates) {
        for (const ic of iceCandidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(ic.signal_data as unknown as RTCIceCandidateInit));
            console.log("Added retroactive ICE candidate");
          } catch (e) {
            console.error("Error adding retroactive ICE candidate:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error answering incoming call:", error);
      isNegotiatingRef.current = false;
      setCallStatus("ended");
      toast.error("Erreur lors de la réponse à l'appel");
    }
  }, [user, contactId, callType, initLocalStream, createPeerConnection, addPendingCandidates]);

  // Handle incoming signals
  const handleSignal = useCallback(async (signal: CallSignal) => {
    const pc = peerConnectionRef.current;
    
    console.log("Handling signal:", signal.signal_type, "from:", signal.caller_id === user?.id ? "self" : "remote");

    // Ignore our own signals
    if (signal.caller_id === user?.id) return;

    if (signal.signal_type === "answer" && pc) {
      try {
        const answerData = signal.signal_data as any;
        await pc.setRemoteDescription(new RTCSessionDescription({ type: answerData.type, sdp: answerData.sdp }));
        console.log("Remote description set from answer");
        
        // Add any pending ICE candidates
        await addPendingCandidates(pc);
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    } else if (signal.signal_type === "ice-candidate") {
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.signal_data));
          console.log("Added ICE candidate");
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      } else {
        // Queue the candidate for later
        console.log("Queuing ICE candidate (no remote description yet)");
        pendingCandidatesRef.current.push(signal.signal_data);
      }
    } else if (signal.signal_type === "end-call") {
      endCall();
    }
  }, [user, addPendingCandidates]);

  // Subscribe to signals
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`call-signals-${user.id}-${contactId}`)
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
  }, [user, contactId, handleSignal]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
        console.log("Audio track enabled:", track.enabled);
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
      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(newTrack);
      }
      localStreamRef.current.removeTrack(currentTrack);
      localStreamRef.current.addTrack(newTrack);
      setLocalStream(new MediaStream([...localStreamRef.current.getTracks()]));
    } catch (error) {
      console.error("Error switching camera:", error);
    }
  }, []);

  // End call
  const endCall = useCallback(async () => {
    if (currentCallRecordId) {
      await supabase
        .from("call_history")
        .update({
          status: callDuration > 0 ? "completed" : "missed",
          ended_at: new Date().toISOString(),
          duration_seconds: callDuration,
        })
        .eq("id", currentCallRecordId);
      currentCallRecordId = null;
    }
    
    if (user && contactId) {
      await supabase.from("call_signals").insert({
        caller_id: user.id,
        callee_id: contactId,
        call_type: callType,
        signal_type: "end-call",
        signal_data: {} as any,
      } as any);
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    pendingCandidatesRef.current = [];
    setCallStatus("ended");
    setRemoteStream(null);
    onCallEnded?.();
  }, [user, contactId, callType, callDuration, onCallEnded]);

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
    answerIncoming,
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