"use client";

import Link from "next/link";
import { useState } from "react";

import { emailRequestSchema } from "~/lib/validation/auth";
import { api } from "~/trpc/react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const requestReset = api.auth.requestPasswordReset.useMutation({
    onSuccess: (result) => setMessage(result.message),
    onError: (err) => setError(err.message),
  });

  if (message) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-ink font-medium">{message}</p>
        <p className="text-muted">
          If an email was sent, check your inbox and spam folder.
        </p>
        <Link href="/login" className="btn-primary w-full">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const parsed = emailRequestSchema.safeParse({ email });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Enter a valid email");
          return;
        }
        requestReset.mutate(parsed.data);
      }}
    >
      <div>
        <label htmlFor="forgot-email" className="label">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field"
        />
      </div>
      {error && (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={requestReset.isPending}
        className="btn-primary w-full"
      >
        {requestReset.isPending ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-muted text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
