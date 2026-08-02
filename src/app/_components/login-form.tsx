"use client";

/**
 * ============================================================================
 * [VIEW] — Login form (email/password + Google)
 * ============================================================================
 * Important: login is NOT a tRPC mutation.
 * We call Auth.js: signIn("credentials" | "google").
 * That hits /api/auth/[...nextauth] (the Auth.js ROUTE).
 */

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    // provider id "credentials" matches Credentials({…}) in auth config
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, // stay here so we can show errors
    });

    setPending(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    // Full navigation so Server Components re-read the new session cookie
    window.location.href = "/";
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <form onSubmit={onEmailLogin} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg bg-white/10 px-4 py-2 text-white placeholder:text-white/40"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg bg-white/10 px-4 py-2 text-white placeholder:text-white/40"
        />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-emerald-600 px-6 py-2 font-semibold transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in with email"}
        </button>
      </form>

      <div className="relative text-center text-sm text-white/40">
        <span className="bg-[#0f1410] px-2">or</span>
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="w-full rounded-full bg-white/10 px-6 py-2 font-semibold transition hover:bg-white/20"
      >
        Continue with Google
      </button>

      <p className="text-center text-sm text-white/60">
        No account?{" "}
        <Link href="/register" className="text-emerald-400 underline">
          Register
        </Link>
      </p>
    </div>
  );
}
