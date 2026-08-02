/**
 * ============================================================================
 * [ROUTE / VIEW] — App Router page for `/`
 * ============================================================================
 */

import Link from "next/link";
import { Suspense } from "react";

import { TodoApp } from "~/app/_components/todo-app";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();
  const user = session?.user?.id ? session.user : null;

  if (user) {
    void api.list.getMine.prefetch();
  }

  return (
    <HydrateClient>
      {user ? (
        <div className="flex min-h-dvh flex-col">
          <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur-sm">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
              <Link href="/" className="text-sm font-semibold tracking-tight text-ink">
                T3 Todo
              </Link>
              <div className="flex items-center gap-3">
                <span className="hidden max-w-[14rem] truncate text-sm text-muted sm:inline">
                  {user.name ?? user.email}
                </span>
                <Link href="/api/auth/signout" className="btn-ghost">
                  Sign out
                </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
            <Suspense
              fallback={
                <div className="space-y-3" aria-busy="true">
                  <div className="h-8 w-40 animate-pulse rounded-md bg-panel" />
                  <div className="h-48 animate-pulse rounded-lg bg-panel" />
                </div>
              }
            >
              <TodoApp />
            </Suspense>
          </main>
        </div>
      ) : (
        <main className="flex min-h-dvh flex-col items-center justify-center px-4">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="space-y-3">
              <p className="text-sm font-medium text-primary">T3 Todo</p>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Lists that stay out of the way
              </h1>
              <p className="text-pretty text-muted">
                Personal and shared todos with Google or email sign-in. Built to
                learn the T3 stack by reading the code.
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
