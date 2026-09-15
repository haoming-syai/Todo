"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="btn-ghost h-8 px-2.5"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Sign out
    </button>
  );
}
