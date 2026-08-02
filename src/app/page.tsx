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
  // Empty id = stale JWT after DB reset (see auth jwt callback)
  const user = session?.user?.id ? session.user : null;

  if (user) {
    // Prefetch lists (ensures personal list exists via getMine)
    void api.list.getMine.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#1a2e1a] to-[#0f1410] px-4 py-12 text-white">
        <div className="container flex flex-col items-center gap-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            T3 <span className="text-emerald-400">Todo</span>
          </h1>
          <p className="max-w-lg text-center text-white/70">
            Learning complete path:{" "}
            <strong className="text-white">S1–S6 + A1–A2</strong> (CRUD, auth,
            images, realtime, personal + shared lists)
          </p>

          {user ? (
            <>
              <p className="text-lg">
                Logged in as {user.name ?? user.email}
              </p>
              <Suspense
                fallback={<p className="text-white/70">Loading app…</p>}
              >
                <TodoApp />
              </Suspense>
              <Link
                href="/api/auth/signout"
                className="rounded-full bg-white/10 px-8 py-2 font-semibold transition hover:bg-white/20"
              >
                Sign out
              </Link>
            </>
          ) : (
            <>
              <p className="text-white/70">
                Sign in with Google or email/password.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/login"
                  className="rounded-full bg-emerald-600 px-8 py-2 font-semibold transition hover:bg-emerald-500"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-white/10 px-8 py-2 font-semibold transition hover:bg-white/20"
                >
                  Register
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </HydrateClient>
  );
}
