/**
 * ============================================================================
 * [ROUTE / VIEW] — `/`
 * ============================================================================
 */

import Link from "next/link";

import { BrandLockup } from "~/app/_components/brand";
import { TodoAppLoader } from "~/app/_components/todo-app-loader";
import { SignOutButton } from "~/app/_components/sign-out-button";
import { auth } from "~/server/auth";
import { api, caller, HydrateClient } from "~/trpc/server";

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() ?? email?.split("@")[0] ?? "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default async function Home() {
  const session = await auth();
  const user = session?.user?.id ? session.user : null;

  if (user) {
    // Await so HydrateClient has data. Client-component SSR cannot call
    // /api/trpc with cookies, so missing prefetches show up as UNAUTHORIZED.
    await api.list.getMine.prefetch();
    const lists = await caller.list.getMine();
    await Promise.all(
      lists.map((list) => api.todo.getByList.prefetch({ listId: list.id })),
    );
  }

  return (
    <HydrateClient>
      {user ? (
        <div className="flex min-h-dvh flex-col">
          <header className="border-border bg-bg sticky top-0 z-20 border-b">
            <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-5">
              <BrandLockup />
              <div className="flex items-center gap-2">
                <span
                  className="bg-panel text-ink hidden size-7 items-center justify-center rounded-full text-[11px] font-medium sm:inline-flex"
                  title={user.name ?? user.email ?? undefined}
                >
                  {initials(user.name, user.email)}
                </span>
                <SignOutButton />
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <TodoAppLoader />
          </div>
        </div>
      ) : (
        <main className="flex min-h-dvh flex-col items-center justify-center px-4">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-4 text-center">
              <BrandLockup />
              <h1 className="text-ink text-3xl font-semibold tracking-tight text-balance">
                What needs doing, together or alone.
              </h1>
              <p className="text-muted text-pretty">
                Keep a personal list, then invite people by email when a task
                belongs to more than one person.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/login" className="btn-primary">
                Sign in
              </Link>
              <Link href="/register" className="btn-secondary">
                Create account
              </Link>
            </div>
          </div>
        </main>
      )}
    </HydrateClient>
  );
}
