"use client";

/**
 * ============================================================================
 * [A1/A2 REALTIME] — sync the active list across tabs / members
 * ============================================================================
 * Setup:
 *   alter publication supabase_realtime add table "Todo";
 */

import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "~/lib/supabase/client";
import { api } from "~/trpc/react";

type RealtimePayload = {
  new?: { listId?: string };
  old?: { listId?: string };
};

export function useTodoRealtime(listId: string | null) {
  const utils = api.useUtils();
  const [status, setStatus] = useState<
    "idle" | "subscribing" | "live" | "error"
  >("idle");

  useEffect(() => {
    if (!listId) {
      setStatus("idle");
      return;
    }

    setStatus("subscribing");
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`todos-list-${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Todo",
        },
        (payload) => {
          const row = payload.new as RealtimePayload["new"];
          const old = payload.old as RealtimePayload["old"];
          const eventListId = row?.listId ?? old?.listId;

          // Only refresh if the change is on the list we're viewing
          if (eventListId && eventListId !== listId) return;

          void utils.todo.getByList.invalidate({ listId });
          void utils.todo.getByList.refetch({ listId });
        },
      )
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === "SUBSCRIBED") setStatus("live");
        if (subscribeStatus === "CHANNEL_ERROR") setStatus("error");
        if (subscribeStatus === "TIMED_OUT") setStatus("error");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [listId, utils]);

  return status;
}
