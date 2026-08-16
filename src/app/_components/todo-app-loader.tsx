"use client";

import dynamic from "next/dynamic";

function TodoAppFallback() {
  return (
    <div className="flex flex-1 gap-0" aria-busy="true">
      <div className="hidden w-60 animate-pulse bg-rail lg:block" />
      <div className="flex-1 space-y-3 p-6">
        <div className="h-7 w-40 rounded-md bg-panel" />
        <div className="h-48 rounded-lg bg-panel" />
      </div>
    </div>
  );
}

/** Client-only: server render of tRPC queries has no session cookie. */
export const TodoAppLoader = dynamic(
  () =>
    import("~/app/_components/todo-app").then((mod) => ({
      default: mod.TodoApp,
    })),
  { ssr: false, loading: TodoAppFallback },
);
