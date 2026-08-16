"use client";

/**
 * ============================================================================
 * [VIEW] — Login form (email/password + Google)
 * ============================================================================
 */

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { IconGoogle } from "~/app/_components/icons";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    window.location.href = "/";
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onEmailLogin} className="space-y-3">
        <div>
          <label htmlFor="login-email" className="label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="label">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </div>
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Signing in…" : "Sign in with email"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="btn-secondary w-full"
      >
        <IconGoogle />
        Continue with Google
      </button>

      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
