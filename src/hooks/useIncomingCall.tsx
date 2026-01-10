import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface IncomingCall {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string | null;
  callType: "video" | "audio";
  offer: RTCSessionDescriptionInit;
}

// Sound URLs (using Web Audio API for notification sounds)
const createRingtone = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  let oscillator: OscillatorNode | null = null;
  let gainNode: GainNode | null = null;
  let isPlaying = false;
  let intervalId: NodeJS.Timeout | null = null;

  const playTone = () => {
    if (!audioContext || audioContext.state === "closed") return;
    
    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440;
    oscillator.type = "sine";
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    
    // Stop after 500ms
    setTimeout(() => {
      if (oscillator) {
        oscillator.stop();
        oscillator = null;
      }
    }, 500);
  };

  return {
    start: () => {
      if (isPlaying) return;
      isPlaying = true;
      
      // Resume audio context if suspended
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      
      playTone();
      intervalId = setInterval(playTone, 1500);
    },
    stop: () => {
      isPlaying = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (oscillator) {
        oscillator.stop();
        oscillator = null;
      }
    },
  };
};

export const useIncomingCall = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const ringtoneRef = useRef<ReturnType<typeof createRingtone> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;
    
    stopRingtone();
    
    // Navigate to call page with caller as contact
    navigate(`/call/${incomingCall.callerId}?type=${incomingCall.callType}&incoming=true`);
    setIncomingCall(null);
  }, [incomingCall, navigate, stopRingtone]);

  const declineCall = useCallback(async () => {
    if (!incomingCall || !user) return;
    
    stopRingtone();
    
    // Send decline signal
    await supabase.from("call_signals").insert({
      caller_id: user.id,
      callee_id: incomingCall.callerId,
      call_type: incomingCall.callType,
      signal_type: "decline",
      signal_data: {},
    });
    
    setIncomingCall(null);
  }, [incomingCall, user, stopRingtone]);

  // Listen for incoming calls
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`incoming-calls-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_signals",
          filter: `callee_id=eq.${user.id}`,
        },
        async (payload) => {
          const signal = payload.new as any;
          
          // Only handle offer signals (incoming calls)
          if (signal.signal_type !== "offer") return;
          
          // Fetch caller profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, username, avatar_url")
            .eq("id", signal.caller_id)
            .single();

          setIncomingCall({
            id: signal.id,
            callerId: signal.caller_id,
            callerName: profile?.display_name || profile?.username || "Utilisateur",
            callerAvatar: profile?.avatar_url || null,
            callType: signal.call_type as "video" | "audio",
            offer: signal.signal_data,
          });

          // Start ringtone
          if (!ringtoneRef.current) {
            ringtoneRef.current = createRingtone();
          }
          ringtoneRef.current.start();

          // Auto-decline after 30 seconds
          timeoutRef.current = setTimeout(() => {
            stopRingtone();
            setIncomingCall(null);
          }, 30000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopRingtone();
    };
  }, [user, stopRingtone]);

  return {
    incomingCall,
    acceptCall,
    declineCall,
  };
};
