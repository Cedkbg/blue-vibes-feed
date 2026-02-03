import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Participant {
  id: string;
  user_id: string;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface GroupCallSignal {
  id: string;
  call_id: string;
  from_user_id: string;
  to_user_id: string;
  signal_type: string;
  signal_data: any;
  created_at: string;
}

interface UseGroupWebRTCOptions {
  groupId: string;
  callType: "video" | "audio";
  onCallEnded?: () => void;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export const useGroupWebRTC = ({ groupId, callType, onCallEnded }: UseGroupWebRTCOptions) => {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<"idle" | "joining" | "connected" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [callId, setCallId] = useState<string | null>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const signalChannelRef = useRef<any>(null);
  const hasJoinedRef = useRef(false);

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

  // Create peer connection for a participant
  const createPeerConnection = useCallback((participantId: string, participantUserId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log("Remote track received from:", participantUserId);
      setParticipants((prev) => 
        prev.map((p) => 
          p.user_id === participantUserId 
            ? { ...p, stream: event.streams[0] } 
            : p
        )
      );
    };

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && user && callId) {
        console.log("Sending ICE candidate to:", participantUserId);
        await supabase.from("call_signals").insert({
          caller_id: user.id,
          callee_id: participantUserId,
          call_type: callType,
          signal_type: "group-ice-candidate",
          signal_data: {
            candidate: event.candidate.toJSON(),
            call_id: callId,
          } as any,
        } as any);
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${participantUserId}:`, pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
      }
    };

    peerConnectionsRef.current.set(participantUserId, pc);
    return pc;
  }, [user, callType, callId]);

  // Join or create group call
  const joinCall = useCallback(async () => {
    if (!user || !groupId || hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    try {
      setCallStatus("joining");

      // Initialize local stream
      await initLocalStream();

      // Check if there's an active call for this group
      const { data: existingCalls } = await supabase
        .from("group_calls")
        .select("*")
        .eq("contact_group_id", groupId)
        .eq("status", "active")
        .limit(1);

      let activeCallId: string;

      if (existingCalls && existingCalls.length > 0) {
        // Join existing call
        activeCallId = existingCalls[0].id;
        console.log("Joining existing call:", activeCallId);
      } else {
        // Create new call
        const { data: newCall, error: callError } = await supabase
          .from("group_calls")
          .insert({
            contact_group_id: groupId,
            initiator_id: user.id,
            call_type: callType,
            status: "active",
          })
          .select()
          .single();

        if (callError) throw callError;
        activeCallId = newCall.id;
        console.log("Created new call:", activeCallId);
      }

      setCallId(activeCallId);

      // Add self as participant
      await supabase
        .from("group_call_participants")
        .insert({
          call_id: activeCallId,
          user_id: user.id,
        });

      // Get current participants
      const { data: currentParticipants } = await supabase
        .from("group_call_participants")
        .select("*")
        .eq("call_id", activeCallId)
        .is("left_at", null)
        .neq("user_id", user.id);

      // Fetch profiles for participants
      if (currentParticipants && currentParticipants.length > 0) {
        const userIds = currentParticipants.map((p) => p.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .in("id", userIds);

        const profilesMap = new Map(profiles?.map((p) => [p.id, p]));

        const participantsWithProfiles = currentParticipants.map((p) => ({
          id: p.id,
          user_id: p.user_id,
          profile: profilesMap.get(p.user_id),
        }));

        setParticipants(participantsWithProfiles);

        // Create peer connections and send offers to existing participants
        for (const participant of participantsWithProfiles) {
          const pc = createPeerConnection(participant.id, participant.user_id);
          
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callType === "video",
          });
          await pc.setLocalDescription(offer);

          // Send offer
          await supabase.from("call_signals").insert({
            caller_id: user.id,
            callee_id: participant.user_id,
            call_type: callType,
            signal_type: "group-offer",
            signal_data: {
              offer,
              call_id: activeCallId,
            } as any,
          } as any);
        }
      }

      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      setCallStatus("connected");

    } catch (error) {
      console.error("Error joining call:", error);
      toast.error("Erreur lors de la connexion à l'appel");
      hasJoinedRef.current = false;
      setCallStatus("ended");
    }
  }, [user, groupId, callType, initLocalStream, createPeerConnection]);

  // Handle incoming signals
  const handleSignal = useCallback(async (signal: any) => {
    if (!user || !callId) return;
    
    const signalData = signal.signal_data;
    console.log("Handling signal:", signal.signal_type, "from:", signal.caller_id);

    if (signal.signal_type === "group-offer" && signalData.call_id === callId) {
      // Someone is offering to connect
      const pc = peerConnectionsRef.current.get(signal.caller_id) || 
                 createPeerConnection(signal.id, signal.caller_id);

      await pc.setRemoteDescription(new RTCSessionDescription(signalData.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer
      await supabase.from("call_signals").insert({
        caller_id: user.id,
        callee_id: signal.caller_id,
        call_type: callType,
        signal_type: "group-answer",
        signal_data: {
          answer,
          call_id: callId,
        } as any,
      } as any);

      // Add to participants if not already there
      setParticipants((prev) => {
        if (prev.find((p) => p.user_id === signal.caller_id)) return prev;
        return [...prev, { id: signal.id, user_id: signal.caller_id }];
      });

    } else if (signal.signal_type === "group-answer" && signalData.call_id === callId) {
      // Received answer to our offer
      const pc = peerConnectionsRef.current.get(signal.caller_id);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.answer));
      }

    } else if (signal.signal_type === "group-ice-candidate" && signalData.call_id === callId) {
      // ICE candidate from another participant
      const pc = peerConnectionsRef.current.get(signal.caller_id);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }

    } else if (signal.signal_type === "group-leave" && signalData.call_id === callId) {
      // Someone left the call
      const pc = peerConnectionsRef.current.get(signal.caller_id);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(signal.caller_id);
      }
      setParticipants((prev) => prev.filter((p) => p.user_id !== signal.caller_id));
    }
  }, [user, callId, callType, createPeerConnection]);

  // Subscribe to signals
  useEffect(() => {
    if (!user || !callId) return;

    const channel = supabase
      .channel(`group-call-signals-${callId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_signals",
          filter: `callee_id=eq.${user.id}`,
        },
        (payload) => {
          handleSignal(payload.new);
        }
      )
      .subscribe();

    signalChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, callId, handleSignal]);

  // Subscribe to participant changes
  useEffect(() => {
    if (!callId) return;

    const channel = supabase
      .channel(`group-call-participants-${callId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_call_participants",
          filter: `call_id=eq.${callId}`,
        },
        async (payload) => {
          const newParticipant = payload.new as any;
          if (newParticipant.user_id === user?.id) return;

          // Fetch profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, display_name, username, avatar_url")
            .eq("id", newParticipant.user_id)
            .single();

          setParticipants((prev) => {
            if (prev.find((p) => p.user_id === newParticipant.user_id)) return prev;
            return [...prev, {
              id: newParticipant.id,
              user_id: newParticipant.user_id,
              profile,
            }];
          });

          toast.info(`${profile?.display_name || "Quelqu'un"} a rejoint l'appel`);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "group_call_participants",
          filter: `call_id=eq.${callId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.left_at) {
            // Participant left
            const pc = peerConnectionsRef.current.get(updated.user_id);
            if (pc) {
              pc.close();
              peerConnectionsRef.current.delete(updated.user_id);
            }
            setParticipants((prev) => prev.filter((p) => p.user_id !== updated.user_id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId, user?.id]);

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

      // Replace track in all peer connections
      peerConnectionsRef.current.forEach(async (pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(newTrack);
        }
      });

      // Update local stream
      localStreamRef.current.removeTrack(currentTrack);
      localStreamRef.current.addTrack(newTrack);
      setLocalStream(new MediaStream([...localStreamRef.current.getTracks()]));
    } catch (error) {
      console.error("Error switching camera:", error);
    }
  }, []);

  // Leave call
  const leaveCall = useCallback(async () => {
    // Notify others that we're leaving
    if (user && callId) {
      // Update participant record
      await supabase
        .from("group_call_participants")
        .update({ left_at: new Date().toISOString() })
        .eq("call_id", callId)
        .eq("user_id", user.id);

      // Send leave signal to all participants
      for (const [userId] of peerConnectionsRef.current) {
        await supabase.from("call_signals").insert({
          caller_id: user.id,
          callee_id: userId,
          call_type: callType,
          signal_type: "group-leave",
          signal_data: { call_id: callId } as any,
        } as any);
      }

      // Check if we're the last one
      const { count } = await supabase
        .from("group_call_participants")
        .select("*", { count: "exact", head: true })
        .eq("call_id", callId)
        .is("left_at", null);

      if (count === 0) {
        // End the call
        await supabase
          .from("group_calls")
          .update({ status: "ended", ended_at: new Date().toISOString() })
          .eq("id", callId);
      }
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    setCallStatus("ended");
    setParticipants([]);
    hasJoinedRef.current = false;
    onCallEnded?.();
  }, [user, callId, callType, onCallEnded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
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
    participants,
    callDuration,
    joinCall,
    leaveCall,
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
