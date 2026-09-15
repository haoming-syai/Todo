"use client";

/**
 * ============================================================================
 * [VIEW] — Register form
 * ============================================================================
 */

import Link from "next/link";
import { useState } from "react";

import { registerSchema } from "~/lib/validation/auth";
import { api } from "~/trpc/react";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const register = api.auth.register.useMutation({
    onSuccess: () => {
      setComplete(true);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  if (complete) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-ink font-medium">Check your email</p>
        <p className="text-muted">
          If the address can be registered, we sent a verification link. Verify
          it before signing in.
        </p>
        <Link href="/login" className="btn-primary w-full">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const parsed = registerSchema.safeParse({ name, email, password });
          if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Check your details");
            return;
          }
          register.mutate(parsed.data);
        }}
        className="space-y-3"
      >
        <div>
          <label htmlFor="reg-name" className="label">
            Name
          </label>
          <input
            id="reg-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="label">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="label">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            placeholder="At least 8 characters"
          />
        </div>
        {error && (
          <p className="text-danger text-sm" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={register.isPending}
          className="btn-primary w-full"
        >
          {register.isPending ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="text-muted text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
