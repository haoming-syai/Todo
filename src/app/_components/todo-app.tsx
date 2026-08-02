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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <aside className="w-full shrink-0 space-y-6 lg:w-56">
        <nav aria-label="Personal lists" className="space-y-2">
          <p className="px-2.5 text-xs font-medium text-faint">Personal</p>
          <ul className="space-y-0.5">
            {personal.map((list) => (
              <li key={list.id}>
                <button
                  type="button"
                  onClick={() => setActiveListId(list.id)}
                  className={
                    activeListId === list.id ? "nav-item-active" : "nav-item"
                  }
                >
                  <span className="truncate">{list.name}</span>
                  <span className="text-xs text-faint tabular-nums">
                    {list._count.todos}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Shared lists" className="space-y-2">
          <p className="px-2.5 text-xs font-medium text-faint">Shared</p>
          <ul className="space-y-0.5">
            {shared.length === 0 && (
              <li className="px-2.5 py-2 text-xs text-faint">
                Invite someone to collaborate.
              </li>
            )}
            {shared.map((list) => (
              <li key={list.id}>
                <button
                  type="button"
                  onClick={() => setActiveListId(list.id)}
                  className={
                    activeListId === list.id ? "nav-item-active" : "nav-item"
                  }
                >
                  <span className="truncate">{list.name}</span>
                  <span className="text-xs text-faint tabular-nums">
                    {list._count.todos}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <form
            className="space-y-2 pt-1"
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
              className="field"
              aria-label="New shared list name"
            />
            <button
              type="submit"
              disabled={createList.isPending || !newListName.trim()}
              className="btn-secondary w-full"
            >
              Create shared list
            </button>
          </form>
          {createList.error && (
            <p className="text-xs text-danger" role="alert">
              {createList.error.message}
            </p>
          )}
        </nav>
      </aside>

      <section className="min-w-0 flex-1 space-y-4">
        {active ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-ink">
                {active.name}
              </h1>
              <span
                className={active.isShared ? "chip-shared" : "chip-personal"}
              >
                {active.isShared ? "Shared" : "Personal"}
              </span>
            </div>

            <InviteForm
              listId={active.id}
              members={active.members}
              inviteEmail={inviteEmail}
              setInviteEmail={setInviteEmail}
              invite={invite}
              error={invite.error?.message}
            />

            <TodoPanel listId={active.id} />
          </>
        ) : (
          <div className="panel p-8 text-sm text-muted">
            Select a list to get started.
          </div>
        )}
      </section>
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
    <div className="panel space-y-3 p-4">
      <p className="text-sm text-muted">
        <span className="font-medium text-ink">Members · </span>
        {members.map((m) => m.user.name ?? m.user.email ?? "user").join(", ")}
      </p>
      <form
        className="flex flex-col gap-2 sm:flex-row"
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
          className="field flex-1"
          aria-label="Invite email"
        />
        <button
          type="submit"
          disabled={invite.isPending || !inviteEmail.trim()}
          className="btn-secondary shrink-0"
        >
          Invite
        </button>
      </form>
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-faint">
        They need an account in this app first.
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-faint">
          Sync{" "}
          <span
            className={
              realtimeStatus === "live"
                ? "font-medium text-success"
                : realtimeStatus === "error"
                  ? "font-medium text-danger"
                  : "text-muted"
            }
          >
            {realtimeStatus === "live"
              ? "live"
              : realtimeStatus === "subscribing"
                ? "connecting…"
                : realtimeStatus === "error"
                  ? "offline"
                  : "idle"}
          </span>
        </p>
      </div>

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
          placeholder="Add a todo…"
          className="field flex-1"
          aria-label="New todo title"
        />
        <button
          type="submit"
          disabled={createTodo.isPending || !title.trim()}
          className="btn-primary shrink-0"
        >
          {createTodo.isPending ? "Adding…" : "Add"}
        </button>
      </form>

      {(createTodo.error ??
        updateTodo.error ??
        deleteTodo.error ??
        removeImage.error ??
        uploadError) && (
        <p className="text-sm text-danger" role="alert">
          {createTodo.error?.message ??
            updateTodo.error?.message ??
            deleteTodo.error?.message ??
            removeImage.error?.message ??
            uploadError}
        </p>
      )}

      {!todos.length ? (
        <div className="panel px-5 py-10 text-center">
          <p className="font-medium text-ink">No todos yet</p>
          <p className="mt-1 text-sm text-muted">
            Type above and press Add — this list updates live for members.
          </p>
        </div>
      ) : (
        <ul className="panel divide-y divide-border overflow-hidden">
          {todos.map((todo) => (
            <li key={todo.id} className="space-y-3 px-4 py-3 transition-colors duration-150 hover:bg-surface">
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
                  className="size-4 rounded border-border text-primary accent-primary"
                  aria-label={`Mark "${todo.title}" complete`}
                />

                {editingId === todo.id ? (
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => {
                      const trimmed = editingTitle.trim();
                      if (trimmed)
                        updateTodo.mutate({ id: todo.id, title: trimmed });
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
                    className="field flex-1 py-1.5"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(todo.id);
                      setEditingTitle(todo.title);
                    }}
                    className={`min-w-0 flex-1 text-left text-sm ${
                      todo.completed
                        ? "text-faint line-through"
                        : "text-ink"
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
                  className="btn-danger shrink-0 px-2 py-1 text-xs"
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
                    className="h-12 w-12 rounded-md border border-border object-cover"
                  />
                ) : null}

                <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
                  {uploadingId === todo.id
                    ? "Uploading…"
                    : todo.imageUrl
                      ? "Replace image"
                      : "Add image"}
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
                    className="btn-danger px-0 py-0 text-xs"
                  >
                    Remove
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
