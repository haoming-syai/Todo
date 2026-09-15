import { redirect } from "next/navigation";

import { BrandLockup } from "~/app/_components/brand";
import { ResetPasswordForm } from "~/app/_components/reset-password-form";
import { auth } from "~/server/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) redirect("/");
  const { token = "" } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <BrandLockup />
          <h1 className="text-ink text-2xl font-semibold tracking-tight">
            Choose a new password
          </h1>
        </div>
        <div className="panel p-6">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </main>
  );
}
