/**
 * ============================================================================
 * [ROUTE / VIEW] — `/login`
 * ============================================================================
 */

import Link from "next/link";

import { LoginForm } from "~/app/_components/login-form";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  // Already logged in? Skip the form.
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a2e1a] to-[#0f1410] px-4 text-white">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Link href="/" className="text-3xl font-extrabold tracking-tight">
          T3 <span className="text-emerald-400">Todo</span>
        </Link>
        <p className="text-center text-white/70">
          Learning step <strong className="text-white">S2</strong>: Login
          (Google + email/password)
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
