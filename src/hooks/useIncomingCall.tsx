import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { startRingtone, stopRingtone as stopRingtoneSound } from "@/utils/sounds";
import { showBrowserNotification } from "@/utils/browserNotifications";

interface IncomingCall {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string | null;
  callType: "video" | "audio";
  offer: RTCSessionDescriptionInit;
}

export const useIncomingCall = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRingtoneAndTimer = useCallback(() => {
    stopRingtoneSound();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;
    stopRingtoneAndTimer();
    navigate(`/call/${incomingCall.callerId}?type=${incomingCall.callType}&incoming=true`);
    setIncomingCall(null);
  }, [incomingCall, navigate, stopRingtoneAndTimer]);

  const declineCall = useCallback(async () => {
    if (!incomingCall || !user) return;
    stopRingtoneAndTimer();
    await supabase.from("call_signals").insert({
      caller_id: user.id,
      callee_id: incomingCall.callerId,
      call_type: incomingCall.callType,
      signal_type: "decline",
      signal_data: {},
    });
    setIncomingCall(null);
  }, [incomingCall, user, stopRingtoneAndTimer]);

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
          if (signal.signal_type !== "offer") return;

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

          startRingtone();

          // Browser notification for incoming call
          const callerDisplayName = profile?.display_name || profile?.username || "Quelqu'un";
          showBrowserNotification(
            signal.call_type === "video" ? "📹 Appel vidéo entrant" : "📞 Appel audio entrant",
            {
              body: `${callerDisplayName} vous appelle...`,
              icon: profile?.avatar_url || "/pwa-192x192.png",
              tag: "incoming-call",
              requireInteraction: true,
              onClick: () => window.focus(),
            }
          );
          timeoutRef.current = setTimeout(() => {
            stopRingtoneAndTimer();
            setIncomingCall(null);
          }, 30000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopRingtoneAndTimer();
    };
  }, [user, stopRingtoneAndTimer]);

  return {
    incomingCall,
    acceptCall,
    declineCall,
  };
};
