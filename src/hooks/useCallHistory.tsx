import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CallRecord {
  id: string;
  caller_id: string;
  callee_id: string;
  call_type: "video" | "audio";
  status: "missed" | "answered" | "declined" | "outgoing";
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  created_at: string;
  caller_profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  callee_profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export const useCallHistory = () => {
  const { user } = useAuth();
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCallHistory = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("call_history")
      .select("*")
      .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
      .order("started_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching call history:", error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      // Fetch profiles for all unique user IDs
      const userIds = new Set<string>();
      data.forEach((call) => {
        userIds.add(call.caller_id);
        userIds.add(call.callee_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", Array.from(userIds));

      const profileMap = new Map(
        profiles?.map((p) => [p.id, p]) || []
      );

      const enrichedHistory = data.map((call) => ({
        ...call,
        call_type: call.call_type as "video" | "audio",
        status: call.status as "missed" | "answered" | "declined" | "outgoing",
        caller_profile: profileMap.get(call.caller_id),
        callee_profile: profileMap.get(call.callee_id),
      }));

      setCallHistory(enrichedHistory);
    }

    setLoading(false);
  }, [user]);

  const addCallRecord = useCallback(
    async (
      calleeId: string,
      callType: "video" | "audio",
      status: "missed" | "answered" | "declined" | "outgoing"
    ) => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("call_history")
        .insert({
          caller_id: user.id,
          callee_id: calleeId,
          call_type: callType,
          status: status,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding call record:", error);
        return null;
      }

      return data;
    },
    [user]
  );

  const updateCallRecord = useCallback(
    async (
      callId: string,
      updates: {
        status?: "missed" | "answered" | "declined" | "outgoing";
        ended_at?: string;
        duration_seconds?: number;
      }
    ) => {
      const { error } = await supabase
        .from("call_history")
        .update(updates)
        .eq("id", callId);

      if (error) {
        console.error("Error updating call record:", error);
      }
    },
    []
  );

  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);

  return {
    callHistory,
    loading,
    fetchCallHistory,
    addCallRecord,
    updateCallRecord,
  };
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) {
    return `${mins}min ${secs}s`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}min`;
};
