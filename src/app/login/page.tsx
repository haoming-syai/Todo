/**
 * ============================================================================
 * [ROUTE / VIEW] — `/login`
 * ============================================================================
 */

import { redirect } from "next/navigation";

import { BrandLockup } from "~/app/_components/brand";
import { LoginForm } from "~/app/_components/login-form";
import { auth } from "~/server/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; reset?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) redirect("/");
  const params = await searchParams;
  const notice =
    params.verified === "1"
      ? "Email verified. You can sign in now."
      : params.reset === "1"
        ? "Password updated. Sign in with your new password."
        : undefined;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <BrandLockup />
          <h1 className="text-ink text-2xl font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="text-muted text-sm">
            Use email or Google to open your lists.
          </p>
        </div>
        <div className="panel p-6">
          <LoginForm notice={notice} />
        </div>
      </div>
    </main>
  );
}
