"use client";

/**
 * ============================================================================
 * [VIEW] — Register form
 * ============================================================================
 * Flow:
 *   1. api.auth.register (tRPC CONTROLLER) creates User + passwordHash
 *   2. signIn("credentials") logs them in immediately
 */

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { api } from "~/trpc/react";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const register = api.auth.register.useMutation({
    onSuccess: async () => {
      // Account exists — now create the Auth.js session
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Account created, but auto sign-in failed. Try logging in.");
        return;
      }
      window.location.href = "/";
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  return (
    <div className="w-full max-w-sm space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          register.mutate({ name, email, password });
        }}
        className="flex flex-col gap-3"
      >
        <input
          type="text"
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg bg-white/10 px-4 py-2 text-white placeholder:text-white/40"
        />
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
          placeholder="Password (min 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg bg-white/10 px-4 py-2 text-white placeholder:text-white/40"
        />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={register.isPending}
          className="rounded-full bg-emerald-600 px-6 py-2 font-semibold transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {register.isPending ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-white/60">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-400 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
