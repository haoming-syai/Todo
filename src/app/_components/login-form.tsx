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
import { loginSchema } from "~/lib/validation/auth";

export function LoginForm({ notice }: { notice?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setPending(true);

    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
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
      {notice && (
        <p
          className="bg-panel text-ink rounded-md px-3 py-2 text-sm"
          role="status"
        >
          {notice}
        </p>
      )}
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
            minLength={8}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </div>
        {error && (
          <p className="text-danger text-sm" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Signing in…" : "Sign in with email"}
        </button>
        <div className="flex justify-between gap-3 text-xs">
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            Forgot password?
          </Link>
          <Link href="/verify-email" className="text-primary hover:underline">
            Resend verification
          </Link>
        </div>
      </form>

      <div className="text-faint flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        or
        <span className="bg-border h-px flex-1" />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="btn-secondary w-full"
      >
        <IconGoogle />
        Continue with Google
      </button>

      <p className="text-muted text-center text-sm">
        No account?{" "}
        <Link
          href="/register"
          className="text-primary font-medium hover:underline"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
