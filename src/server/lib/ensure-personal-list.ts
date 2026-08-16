/**
 * ============================================================================
 * [HELPER] — list membership helpers used by CONTROLLERS
 * ============================================================================
 * Use generated `PrismaClient` so `db.todoList` is typed after
 * `npx prisma generate` (stale client = "Property 'todoList' does not exist").
 */

import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "../../../generated/prisma";
import {
  createSupabaseBrowserClient,
  TODO_IMAGES_BUCKET,
} from "~/lib/supabase/client";

type Db = PrismaClient;

/**
 * First-run only: if the user belongs to no lists yet, create "My Todos".
 * Does not recreate a personal list after the owner deletes it.
 */
export async function ensurePersonalList(db: Db, userId: string) {
  // After `db push --force-reset`, an old JWT can still hold a deleted user id.
  // Creating a list for a missing user → TodoList_ownerId_fkey violation.
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Your session is stale (DB was reset). Sign out and sign in again.",
    });
  }

  const membership = await db.todoListMember.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (membership) return null;

  return db.todoList.create({
    data: {
      name: "My Todos",
      isShared: false,
      ownerId: userId,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
  });
}

/** Throw unless the caller owns the list. */
export async function requireListOwner(db: Db, listId: string, userId: string) {
  const list = await db.todoList.findFirst({
    where: { id: listId, ownerId: userId },
  });
  if (!list) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the list owner can do that",
    });
  }
  return list;
}

/** Throw if the user is not a member of the list. */
export async function requireListMember(db: Db, listId: string, userId: string) {
  const member = await db.todoListMember.findUnique({
    where: { listId_userId: { listId, userId } },
  });

  if (!member) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this list",
    });
  }

  return member;
}

/**
 * Access a todo if the caller is a member of its list.
 * (A2: any list member can edit/delete — not only the creator.)
 */
export async function requireTodoViaMembership(
  db: Db,
  todoId: string,
  userId: string,
) {
  const todo = await db.todo.findFirst({
    where: {
      id: todoId,
      list: { members: { some: { userId } } },
    },
  });

  if (!todo) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Todo not found" });
  }

  return todo;
}

/** Extract Storage object path from a public URL. Rejects traversal. */
export function storagePathFromPublicUrl(imageUrl: string, bucket: string) {
  const marker = `/object/public/${bucket}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;

  let path: string;
  try {
    const raw = imageUrl.slice(idx + marker.length).split("?")[0] ?? "";
    path = decodeURIComponent(raw);
  } catch {
    return null;
  }

  if (
    !path ||
    path.includes("..") ||
    path.includes("\\") ||
    path.startsWith("/")
  ) {
    return null;
  }

  return path;
}

/** Uploads live at `{userId}/{todoId}/{file}` — reject anything else. */
export function isImageUrlForTodo(
  imageUrl: string,
  bucket: string,
  todoId: string,
) {
  const path = storagePathFromPublicUrl(imageUrl, bucket);
  if (!path) return false;
  const parts = path.split("/");
  return parts.length === 3 && parts[1] === todoId && Boolean(parts[0] && parts[2]);
}

export async function removeStorageObject(imageUrl: string) {
  const path = storagePathFromPublicUrl(imageUrl, TODO_IMAGES_BUCKET);
  if (!path) return;
  const supabase = createSupabaseBrowserClient();
  await supabase.storage.from(TODO_IMAGES_BUCKET).remove([path]);
}
