import { redirect } from "next/navigation";

import { BrandLockup } from "~/app/_components/brand";
import { ForgotPasswordForm } from "~/app/_components/forgot-password-form";
import { auth } from "~/server/auth";

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <BrandLockup />
          <h1 className="text-ink text-2xl font-semibold tracking-tight">
            Reset password
          </h1>
          <p className="text-muted text-sm">
            We will email a one-time link if the account supports passwords.
          </p>
        </div>
        <div className="panel p-6">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
