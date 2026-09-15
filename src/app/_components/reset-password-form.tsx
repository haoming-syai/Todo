"use client";

import Link from "next/link";
import { useState } from "react";

import { resetPasswordSchema } from "~/lib/validation/auth";
import { api } from "~/trpc/react";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const resetPassword = api.auth.resetPassword.useMutation({
    onSuccess: () => setComplete(true),
    onError: (err) => setError(err.message),
  });

  if (complete) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-ink font-medium">Password updated</p>
        <p className="text-muted">Existing sessions have been signed out.</p>
        <Link href="/login?reset=1" className="btn-primary w-full">
          Sign in
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-danger">This password reset link is invalid.</p>
        <Link href="/forgot-password" className="btn-primary w-full">
          Request another link
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
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        const parsed = resetPasswordSchema.safeParse({ token, password });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Check your password");
          return;
        }
        resetPassword.mutate(parsed.data);
      }}
    >
      <div>
        <label htmlFor="new-password" className="label">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="label">
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
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
        disabled={resetPassword.isPending}
        className="btn-primary w-full"
      >
        {resetPassword.isPending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
