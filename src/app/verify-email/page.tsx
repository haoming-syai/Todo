import { redirect } from "next/navigation";

import { BrandLockup } from "~/app/_components/brand";
import { VerifyEmailForm } from "~/app/_components/verify-email-form";
import { auth } from "~/server/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) redirect("/");
  const { status } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <BrandLockup />
          <h1 className="text-ink text-2xl font-semibold tracking-tight">
            Verify your email
          </h1>
          <p className="text-muted text-sm">
            Email/password accounts must be verified before sign-in.
          </p>
        </div>
        <div className="panel p-6">
          <VerifyEmailForm status={status} />
        </div>
      </div>
    </main>
  );
}
