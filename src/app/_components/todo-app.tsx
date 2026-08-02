"use client";

/**
 * ============================================================================
 * [VIEW] — A2 app shell: personal + shared lists + todos + images
 * ============================================================================
 */

import { useEffect, useState } from "react";

import { useTodoRealtime } from "~/hooks/use-todo-realtime";
import { api } from "~/trpc/react";

export function TodoApp() {
  const utils = api.useUtils();
  const [lists] = api.list.getMine.useSuspenseQuery();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  // Pick first list once loaded
  useEffect(() => {
    if (!activeListId && lists[0]) {
      setActiveListId(lists[0].id);
    }
  }, [lists, activeListId]);

  const createList = api.list.create.useMutation({
    onSuccess: async (list) => {
      await utils.list.getMine.invalidate();
      setActiveListId(list.id);
      setNewListName("");
    },
  });

  const invite = api.list.invite.useMutation({
    onSuccess: async () => {
      await utils.list.getMine.invalidate();
      setInviteEmail("");
    },
  });

  const personal = lists.filter((l) => !l.isShared);
  const shared = lists.filter((l) => l.isShared);
  const active = lists.find((l) => l.id === activeListId) ?? null;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 md:flex-row md:items-start">
      {/* ----- Sidebar: lists ----- */}
      <aside className="w-full shrink-0 space-y-4 md:w-56">
        <section>
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-white/50 uppercase">
            Personal
          </h2>
          <ul className="space-y-1">
            {personal.map((list) => (
              <li key={list.id}>
                <button
                  type="button"
                  onClick={() => setActiveListId(list.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    activeListId === list.id
                      ? "bg-emerald-600/40 text-white"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {list.name}
                  <span className="ml-1 text-white/40">
                    ({list._count.todos})
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-white/50 uppercase">
            Shared
          </h2>
          <ul className="space-y-1">
            {shared.length === 0 && (
              <li className="px-3 text-xs text-white/40">No shared lists yet</li>
            )}
            {shared.map((list) => (
              <li key={list.id}>
                <button
                  type="button"
                  onClick={() => setActiveListId(list.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    activeListId === list.id
                      ? "bg-emerald-600/40 text-white"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {list.name}
                  <span className="ml-1 text-white/40">
                    ({list._count.todos})
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = newListName.trim();
              if (!name) return;
              createList.mutate({ name, isShared: true });
            }}
          >
            <input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New shared list"
              className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
            />
            <button
              type="submit"
              disabled={createList.isPending || !newListName.trim()}
              className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/20 disabled:opacity-50"
            >
              Create shared list
            </button>
          </form>
          {createList.error && (
            <p className="mt-1 text-xs text-red-300">
              {createList.error.message}
            </p>
          )}
        </section>
      </aside>

      {/* ----- Main: todos for active list ----- */}
      <div className="min-w-0 flex-1 space-y-4">
        {active ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold text-white">
                {active.name}{" "}
                <span className="text-sm font-normal text-white/50">
                  {active.isShared ? "shared" : "personal"}
                </span>
              </h2>
            </div>

            {/* Invite (owner of shared / any list you own) */}
            {active.ownerId && (
              <InviteForm
                listId={active.id}
                members={active.members}
                inviteEmail={inviteEmail}
                setInviteEmail={setInviteEmail}
                invite={invite}
                error={invite.error?.message}
              />
            )}

            <TodoPanel listId={active.id} />
          </>
        ) : (
          <p className="text-white/70">Loading lists…</p>
        )}
      </div>
    </div>
  );
}

function InviteForm({
  listId,
  members,
  inviteEmail,
  setInviteEmail,
  invite,
  error,
}: {
  listId: string;
  members: {
    user: { id: string; name: string | null; email: string | null };
  }[];
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  invite: {
    mutate: (input: { listId: string; email: string }) => void;
    isPending: boolean;
  };
  error?: string;
}) {
  return (
    <div className="rounded-lg bg-white/5 p-3 text-sm">
      <p className="mb-2 text-white/60">
        Members:{" "}
        {members
          .map((m) => m.user.name ?? m.user.email ?? "user")
          .join(", ")}
      </p>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const email = inviteEmail.trim();
          if (!email) return;
          invite.mutate({ listId, email });
        }}
      >
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Invite by email"
          className="min-w-[12rem] flex-1 rounded-lg bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={invite.isPending || !inviteEmail.trim()}
          className="rounded-full bg-emerald-600/80 px-4 py-2 font-semibold transition hover:bg-emerald-500 disabled:opacity-50"
        >
          Invite
        </button>
      </form>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
      <p className="mt-1 text-xs text-white/40">
        Invitee must already have an account (same app).
      </p>
    </div>
  );
}

function TodoPanel({ listId }: { listId: string }) {
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const realtimeStatus = useTodoRealtime(listId);
  const [todos] = api.todo.getByList.useSuspenseQuery({ listId });
  const utils = api.useUtils();

  const invalidateList = async () => {
    await utils.todo.getByList.invalidate({ listId });
    await utils.list.getMine.invalidate();
  };

  const createTodo = api.todo.create.useMutation({
    onSuccess: async () => {
      await invalidateList();
      setTitle("");
    },
  });

  const updateTodo = api.todo.update.useMutation({
    onSuccess: async () => {
      await invalidateList();
      setEditingId(null);
    },
  });

  const deleteTodo = api.todo.delete.useMutation({
    onSuccess: async () => {
      await invalidateList();
    },
  });

  const attachImage = api.todo.attachImage.useMutation({
    onSuccess: async () => {
      await invalidateList();
      setUploadingId(null);
    },
    onError: (err) => {
      setUploadError(err.message);
      setUploadingId(null);
    },
  });

  const removeImage = api.todo.removeImage.useMutation({
    onSuccess: async () => {
      await invalidateList();
    },
  });

  async function onPickImage(todoId: string, file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploadingId(todoId);

    try {
      const body = new FormData();
      body.set("todoId", todoId);
      body.set("file", file);

      const res = await fetch("/api/todo/upload", { method: "POST", body });
      const json = (await res.json()) as { imageUrl?: string; error?: string };

      if (!res.ok || !json.imageUrl) {
        throw new Error(json.error ?? "Upload failed");
      }

      attachImage.mutate({ id: todoId, imageUrl: json.imageUrl });
    } catch (err) {
      setUploadingId(null);
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-white/50">
        Realtime:{" "}
        <span
          className={
            realtimeStatus === "live"
              ? "text-emerald-400"
              : realtimeStatus === "error"
                ? "text-red-300"
                : "text-white/50"
          }
        >
          {realtimeStatus === "live"
            ? "live"
            : realtimeStatus === "subscribing"
              ? "connecting…"
              : realtimeStatus === "error"
                ? "error"
                : "off"}
        </span>
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = title.trim();
          if (!trimmed) return;
          createTodo.mutate({ listId, title: trimmed });
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className="min-w-0 flex-1 rounded-lg bg-white/10 px-4 py-2 text-white placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={createTodo.isPending || !title.trim()}
          className="rounded-full bg-emerald-600 px-5 py-2 font-semibold transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {createTodo.isPending ? "Adding…" : "Add"}
        </button>
      </form>

      {(createTodo.error ??
        updateTodo.error ??
        deleteTodo.error ??
        removeImage.error ??
        uploadError) && (
        <p className="text-sm text-red-300">
          {createTodo.error?.message ??
            updateTodo.error?.message ??
            deleteTodo.error?.message ??
            removeImage.error?.message ??
            uploadError}
        </p>
      )}

      {!todos.length ? (
        <p className="text-white/70">No todos yet — add one above.</p>
      ) : (
        <ul className="space-y-3 text-left">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex flex-col gap-2 rounded-lg bg-white/10 px-4 py-3 text-white"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  disabled={updateTodo.isPending}
                  onChange={() =>
                    updateTodo.mutate({
                      id: todo.id,
                      completed: !todo.completed,
                    })
                  }
                  className="size-4 accent-emerald-500"
                />

                {editingId === todo.id ? (
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => {
                      const trimmed = editingTitle.trim();
                      if (trimmed) updateTodo.mutate({ id: todo.id, title: trimmed });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = editingTitle.trim();
                        if (trimmed)
                          updateTodo.mutate({ id: todo.id, title: trimmed });
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="min-w-0 flex-1 rounded bg-black/30 px-2 py-1 text-white"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(todo.id);
                      setEditingTitle(todo.title);
                    }}
                    className={`min-w-0 flex-1 text-left ${
                      todo.completed ? "line-through opacity-60" : ""
                    }`}
                  >
                    {todo.title}
                  </button>
                )}

                <button
                  type="button"
                  disabled={deleteTodo.isPending}
                  onClick={() => {
                    if (confirm(`Delete "${todo.title}"?`)) {
                      deleteTodo.mutate({ id: todo.id });
                    }
                  }}
                  className="shrink-0 text-sm text-red-300/80 hover:text-red-200 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>

              <div className="flex items-center gap-3 pl-7">
                {todo.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={todo.imageUrl}
                    alt=""
                    className="h-14 w-14 rounded object-cover"
                  />
                ) : (
                  <span className="text-xs text-white/40">No image</span>
                )}

                <label className="cursor-pointer text-sm text-emerald-300/90 hover:text-emerald-200">
                  {uploadingId === todo.id ? "Uploading…" : "Add image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={uploadingId === todo.id}
                    onChange={(e) => {
                      void onPickImage(todo.id, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>

                {todo.imageUrl && (
                  <button
                    type="button"
                    disabled={removeImage.isPending}
                    onClick={() => {
                      if (confirm("Remove this image?")) {
                        removeImage.mutate({ id: todo.id });
                      }
                    }}
                    className="text-sm text-red-300/80 hover:text-red-200 disabled:opacity-50"
                  >
                    Remove image
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
