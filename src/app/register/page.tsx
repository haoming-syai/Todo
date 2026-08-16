/**
 * ============================================================================
 * [ROUTE / VIEW] — `/register`
 * ============================================================================
 */

import { redirect } from "next/navigation";

import { BrandLockup } from "~/app/_components/brand";
import { RegisterForm } from "~/app/_components/register-form";
import { auth } from "~/server/auth";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <BrandLockup />
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Create account
          </h1>
          <p className="text-sm text-muted">
            A personal list is ready the moment you join.
          </p>
        </div>
        <div className="panel p-6">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
