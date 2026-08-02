/**
 * ============================================================================
 * [ROUTE / VIEW] — `/register`
 * ============================================================================
 */

import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "~/app/_components/register-form";
import { auth } from "~/server/auth";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a2e1a] to-[#0f1410] px-4 text-white">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Link href="/" className="text-3xl font-extrabold tracking-tight">
          T3 <span className="text-emerald-400">Todo</span>
        </Link>
        <p className="text-center text-white/70">
          Create an account with email + password
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}
