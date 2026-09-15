"use client";

import { useEffect, useState } from "react";

import { api } from "~/trpc/react";

const POLL_INTERVAL_MS = 10_000;

export function useTodoPolling(listId: string | null) {
  const utils = api.useUtils();
  const [status, setStatus] = useState<"idle" | "polling">("idle");

  useEffect(() => {
    if (!listId) {
      setStatus("idle");
      return;
    }

    setStatus("polling");

    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void utils.todo.getByList.invalidate({ listId });
    };

    const interval = window.setInterval(refresh, POLL_INTERVAL_MS);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [listId, utils]);

  return status;
}
