import { type NextRequest, NextResponse } from "next/server";

import { handlers } from "~/server/auth";
import { normalizedEmailSchema } from "~/lib/validation/auth";
import { getClientIp } from "~/server/security/request";
import { checkRateLimit } from "~/server/security/rate-limit";

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname.endsWith("/callback/credentials")) {
    const form = await request.clone().formData();
    const parsedEmail = normalizedEmailSchema.safeParse(form.get("email"));
    const ip = getClientIp(request.headers);

    const checks = [
      checkRateLimit({
        route: "auth.login.ip",
        identity: ip,
        limit: 10,
        windowMs: 60_000,
      }),
    ];

    if (parsedEmail.success) {
      checks.push(
        checkRateLimit({
          route: "auth.login.email",
          identity: parsedEmail.data,
          limit: 5,
          windowMs: 15 * 60_000,
        }),
      );
    }

    const results = await Promise.all(checks);
    const blocked = results.find((result) => !result.allowed);
    if (blocked) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(blocked.retryAfter) },
        },
      );
    }
  }

  return handlers.POST(request);
}
