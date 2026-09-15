"use client";

import Link from "next/link";
import { useState } from "react";

import { emailRequestSchema } from "~/lib/validation/auth";
import { api } from "~/trpc/react";

export function VerifyEmailForm({ status }: { status?: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resend = api.auth.resendVerification.useMutation({
    onSuccess: (result) => setMessage(result.message),
    onError: (err) => setError(err.message),
  });

  return (
    <div className="space-y-5">
      {status === "invalid" && (
        <p className="text-danger text-sm" role="alert">
          That verification link is invalid, expired, or already used.
        </p>
      )}
      {message ? (
        <p className="text-muted text-sm" role="status">
          {message}
        </p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            const parsed = emailRequestSchema.safeParse({ email });
            if (!parsed.success) {
              setError(
                parsed.error.issues[0]?.message ?? "Enter a valid email",
              );
              return;
            }
            resend.mutate(parsed.data);
          }}
        >
          <div>
            <label htmlFor="verify-email" className="label">
              Email
            </label>
            <input
              id="verify-email"
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
            disabled={resend.isPending}
            className="btn-primary w-full"
          >
            {resend.isPending ? "Sending…" : "Resend verification"}
          </button>
        </form>
      )}
      <p className="text-muted text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
