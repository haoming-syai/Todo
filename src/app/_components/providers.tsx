"use client";

/**
 * [VIEW helpers] — client providers that wrap the whole app
 * SessionProvider lets client components call next-auth/react helpers
 * like signIn() / signOut() / useSession().
 */

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
