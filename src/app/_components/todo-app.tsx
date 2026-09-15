"use client";

/**
 * ============================================================================
 * [VIEW] — signed-in shell: rail of lists + the open list
 * ============================================================================
 */

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import {
  IconClose,
  IconImage,
  IconPeople,
  IconPlus,
  IconTrash,
} from "~/app/_components/icons";
import { useTodoPolling } from "~/hooks/use-todo-polling";
import { api } from "~/trpc/react";

type ListItem = {
  id: string;
  name: string;
  isShared: boolean;
  ownerId: string;
  members: {
    user: { id: string; name: string | null; email: string | null };
  }[];
  _count: { todos: number };
};

export function TodoApp() {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const [lists] = api.list.getMine.useSuspenseQuery();
  const [activeListId, setActiveListId] = useState<string | null>(
    () => lists[0]?.id ?? null,
  );
  const [newListName, setNewListName] = useState("");
  const [newPersonalName, setNewPersonalName] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingList, setEditingList] = useState(false);
  const [listNameDraft, setListNameDraft] = useState("");

  useEffect(() => {
    if (activeListId && lists.some((list) => list.id === activeListId)) return;
    setActiveListId(lists[0]?.id ?? null);
    setInviteOpen(false);
    setEditingList(false);
  }, [lists, activeListId]);

  const createList = api.list.create.useMutation({
    onSuccess: async (list) => {
      await utils.list.getMine.invalidate();
      setActiveListId(list.id);
      setNewListName("");
      setNewPersonalName("");
      setEditingList(false);
    },
  });

  const invite = api.list.invite.useMutation({
    onSuccess: async () => {
      await utils.list.getMine.invalidate();
      setInviteEmail("");
    },
  });

  const updateList = api.list.update.useMutation({
    onSuccess: async () => {
      await utils.list.getMine.invalidate();
      setEditingList(false);
    },
  });

  const deleteList = api.list.delete.useMutation({
    onSuccess: async () => {
      await utils.list.getMine.invalidate();
      await utils.todo.getByList.invalidate();
      setInviteOpen(false);
      setEditingList(false);
    },
  });

  const personal = lists.filter((l) => !l.isShared);
  const shared = lists.filter((l) => l.isShared);
  const active = lists.find((l) => l.id === activeListId) ?? null;
  const isOwner = Boolean(active && session?.user?.id === active.ownerId);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">
      <aside className="border-border bg-rail border-b px-3 py-4 lg:w-60 lg:border-r lg:border-b-0 lg:py-5">
        <div className="space-y-5">
          <nav aria-label="Personal lists" className="space-y-1.5">
            <p className="text-faint px-2.5 text-xs font-medium">Personal</p>
            <ul className="flex gap-1 overflow-x-auto pb-0.5 lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0">
              {personal.length === 0 && (
                <li className="text-faint hidden px-2.5 py-1 text-xs lg:block">
                  None yet — create one below.
                </li>
              )}
              {personal.map((list) => (
                <li key={list.id} className="min-w-max lg:min-w-0">
                  <ListButton
                    list={list}
                    active={activeListId === list.id}
                    onSelect={() => {
                      setActiveListId(list.id);
                      setInviteOpen(false);
                      setEditingList(false);
                    }}
                  />
                </li>
              ))}
            </ul>

            <form
              className="flex gap-1.5 pt-1"
              onSubmit={(e) => {
                e.preventDefault();
                const name = newPersonalName.trim();
                if (!name) return;
                createList.mutate({ name, isShared: false });
              }}
            >
              <input
                value={newPersonalName}
                onChange={(e) => setNewPersonalName(e.target.value)}
                placeholder="New personal list"
                className="field min-w-0 flex-1"
                aria-label="New personal list name"
              />
              <button
                type="submit"
                disabled={createList.isPending || !newPersonalName.trim()}
                className="btn-secondary h-9 w-9 shrink-0 px-0"
                aria-label="Create personal list"
              >
                <IconPlus />
              </button>
            </form>
          </nav>

          <nav aria-label="Shared lists" className="space-y-1.5">
            <p className="text-faint px-2.5 text-xs font-medium">Shared</p>
            <ul className="flex gap-1 overflow-x-auto pb-0.5 lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0">
              {shared.length === 0 && (
                <li className="text-faint hidden px-2.5 py-1 text-xs lg:block">
                  None yet — create one below.
                </li>
              )}
              {shared.map((list) => (
                <li key={list.id} className="min-w-max lg:min-w-0">
                  <ListButton
                    list={list}
                    active={activeListId === list.id}
                    onSelect={() => {
                      setActiveListId(list.id);
                      setInviteOpen(false);
                      setEditingList(false);
                    }}
                  />
                </li>
              ))}
            </ul>

            <form
              className="flex gap-1.5 pt-1"
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
                className="field min-w-0 flex-1"
                aria-label="New shared list name"
              />
              <button
                type="submit"
                disabled={createList.isPending || !newListName.trim()}
                className="btn-secondary h-9 w-9 shrink-0 px-0"
                aria-label="Create shared list"
              >
                <IconPlus />
              </button>
            </form>
          </nav>
          {createList.error && (
            <p className="text-danger px-2.5 text-xs" role="alert">
              {createList.error.message}
            </p>
          )}
        </div>
      </aside>

      <section className="min-w-0 flex-1 px-4 py-6 sm:px-8">
        {active ? (
          <div className="mx-auto max-w-2xl space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {editingList && isOwner ? (
                    <input
                      autoFocus
                      value={listNameDraft}
                      onChange={(e) => setListNameDraft(e.target.value)}
                      onBlur={() => {
                        const name = listNameDraft.trim();
                        if (!name || name === active.name) {
                          setEditingList(false);
                          return;
                        }
                        updateList.mutate({ id: active.id, name });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                        if (e.key === "Escape") setEditingList(false);
                      }}
                      className="field h-9 max-w-xs font-semibold"
                      aria-label="List name"
                    />
                  ) : isOwner ? (
                    <h1 className="min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setListNameDraft(active.name);
                          setEditingList(true);
                        }}
                        className="text-ink max-w-full truncate text-left text-xl font-semibold tracking-tight"
                        title="Rename list"
                      >
                        {active.name}
                      </button>
                    </h1>
                  ) : (
                    <h1 className="text-ink text-xl font-semibold tracking-tight">
                      {active.name}
                    </h1>
                  )}
                  <span
                    className={
                      active.isShared ? "chip-shared" : "chip-personal"
                    }
                  >
                    {active.isShared ? "Shared" : "Personal"}
                  </span>
                </div>
                {active.isShared && (
                  <p className="text-muted text-sm">
                    {active.members
                      .map((m) => m.user.name ?? m.user.email ?? "member")
                      .join(" · ")}
                  </p>
                )}
              </div>
              {isOwner && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setInviteOpen((open) => !open)}
                    aria-expanded={inviteOpen}
                    className="btn-ghost h-8 px-2.5 text-xs"
                  >
                    <IconPeople />
                    {active.isShared ? "Invite" : "Share"}
                  </button>
                  <button
                    type="button"
                    className="btn-danger h-8 px-2.5 text-xs"
                    disabled={deleteList.isPending}
                    aria-label={`Delete list "${active.name}"`}
                    onClick={() => {
                      const count = active._count.todos;
                      const extra =
                        count > 0
                          ? ` This removes ${count} item${count === 1 ? "" : "s"} too.`
                          : "";
                      if (confirm(`Delete "${active.name}"?${extra}`)) {
                        deleteList.mutate({ id: active.id });
                      }
                    }}
                  >
                    <IconTrash />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {(updateList.error ?? deleteList.error) && (
              <p className="text-danger text-sm" role="alert">
                {updateList.error?.message ?? deleteList.error?.message}
              </p>
            )}

            {inviteOpen && (
              <InviteForm
                listId={active.id}
                turnsShared={!active.isShared}
                inviteEmail={inviteEmail}
                setInviteEmail={setInviteEmail}
                invite={invite}
                error={invite.error?.message}
              />
            )}

            <TodoPanel listId={active.id} />
          </div>
        ) : (
          <p className="text-muted text-sm">Select a list to get started.</p>
        )}
      </section>
    </div>
  );
}

function ListButton({
  list,
  active,
  onSelect,
}: {
  list: ListItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={active ? "nav-item-active" : "nav-item"}
    >
      <span className="flex min-w-0 items-center gap-2">
        {list.isShared && (
          <span
            className="bg-accent size-1.5 shrink-0 rounded-full"
            aria-hidden
          />
        )}
        <span className="truncate">{list.name}</span>
      </span>
      <span className="text-faint text-xs tabular-nums">
        {list._count.todos}
      </span>
    </button>
  );
}

function InviteForm({
  listId,
  turnsShared,
  inviteEmail,
  setInviteEmail,
  invite,
  error,
}: {
  listId: string;
  turnsShared?: boolean;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  invite: {
    mutate: (input: { listId: string; email: string }) => void;
    isPending: boolean;
  };
  error?: string;
}) {
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
      onSubmit={(e) => {
        e.preventDefault();
        const email = inviteEmail.trim();
        if (!email) return;
        invite.mutate({ listId, email });
      }}
    >
      <div className="min-w-0 flex-1">
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="name@email.com"
          className="field"
          aria-label="Invite email"
        />
        <p className="text-faint mt-1 text-xs">
          They must already have an account
          {turnsShared ? " — this list then becomes shared." : "."}
        </p>
        {error && (
          <p className="text-danger mt-1 text-xs" role="alert">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={invite.isPending || !inviteEmail.trim()}
        className="btn-secondary shrink-0"
      >
        {invite.isPending ? "Inviting…" : "Send invite"}
      </button>
    </form>
  );
}

function TodoPanel({ listId }: { listId: string }) {
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pollingStatus = useTodoPolling(listId);
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

      await invalidateList();
      setUploadingId(null);
    } catch (err) {
      setUploadingId(null);
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div className="space-y-4">
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
          placeholder="Add something…"
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

      <div
        className="text-faint flex items-center gap-1.5 text-xs"
        aria-live="polite"
      >
        <span
          className={`size-1.5 rounded-full ${
            pollingStatus === "polling" ? "bg-success" : "bg-faint"
          }`}
          aria-hidden
        />
        {pollingStatus === "polling" ? "Checking for updates" : "Idle"}
      </div>

      {(createTodo.error ??
        updateTodo.error ??
        deleteTodo.error ??
        removeImage.error ??
        uploadError) && (
        <p className="text-danger text-sm" role="alert">
          {createTodo.error?.message ??
            updateTodo.error?.message ??
            deleteTodo.error?.message ??
            removeImage.error?.message ??
            uploadError}
        </p>
      )}

      {!todos.length ? (
        <div className="border-border rounded-lg border border-dashed px-5 py-12 text-center">
          <p className="text-ink font-medium">This list is empty</p>
          <p className="text-muted mx-auto mt-1 max-w-[28ch] text-sm">
            Type above and add. Shared members see new items as they land.
          </p>
        </div>
      ) : (
        <ul className="divide-border border-border bg-bg divide-y overflow-hidden rounded-lg border">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="group hover:bg-surface px-4 py-3 transition-colors duration-150 ease-out"
            >
              <div className="flex items-start gap-3">
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
                  className="check mt-0.5"
                  aria-label={`Mark "${todo.title}" complete`}
                />

                <div className="min-w-0 flex-1 space-y-2">
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
                      className="field h-8"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(todo.id);
                        setEditingTitle(todo.title);
                      }}
                      className={`w-full text-left text-sm transition-opacity duration-150 ease-out ${
                        todo.completed ? "text-faint line-through" : "text-ink"
                      }`}
                    >
                      {todo.title}
                    </button>
                  )}

                  {(todo.imageUrl ? true : uploadingId === todo.id) && (
                    <div className="flex items-center gap-2">
                      {todo.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={todo.imageUrl}
                          alt=""
                          className="border-border h-14 w-14 rounded-md border object-cover"
                        />
                      ) : null}
                      {uploadingId === todo.id && (
                        <p className="text-faint text-xs">Uploading…</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                  <label className="btn-ghost h-10 w-10 cursor-pointer px-0 sm:h-8 sm:w-8">
                    <span className="sr-only">
                      {uploadingId === todo.id
                        ? "Uploading image"
                        : todo.imageUrl
                          ? "Replace image"
                          : "Add image"}
                    </span>
                    <IconImage />
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
                      className="btn-ghost h-10 w-10 px-0 sm:h-8 sm:w-8"
                      disabled={removeImage.isPending}
                      aria-label="Remove image"
                      onClick={() => {
                        if (confirm("Remove this image?")) {
                          removeImage.mutate({ id: todo.id });
                        }
                      }}
                    >
                      <IconClose />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-danger h-10 w-10 px-0 sm:h-8 sm:w-8"
                    disabled={deleteTodo.isPending}
                    aria-label={`Delete "${todo.title}"`}
                    onClick={() => {
                      if (confirm(`Delete "${todo.title}"?`)) {
                        deleteTodo.mutate({ id: todo.id });
                      }
                    }}
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
