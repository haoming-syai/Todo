/**
 * ============================================================================
 * [ROUTE / VIEW] — `/login`
 * ============================================================================
 */

import { redirect } from "next/navigation";

import { BrandLockup } from "~/app/_components/brand";
import { LoginForm } from "~/app/_components/login-form";
import { auth } from "~/server/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <BrandLockup />
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Sign in
          </h1>
          <p className="text-sm text-muted">
            Use email or Google to open your lists.
          </p>
        </div>
        <div className="panel p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
