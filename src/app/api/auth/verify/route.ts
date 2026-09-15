import { AuthTokenType } from "../../../../../generated/prisma";
import { type NextRequest, NextResponse } from "next/server";

import { db } from "~/server/db";
import { hashAuthToken } from "~/server/auth/tokens";
import { getClientIp } from "~/server/security/request";
import { checkRateLimit } from "~/server/security/rate-limit";

function verificationRedirect(request: NextRequest, status: string) {
  const url = new URL("/verify-email", request.url);
  url.searchParams.set("status", status);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const limited = await checkRateLimit({
    route: "auth.verification.complete.ip",
    identity: getClientIp(request.headers),
    limit: 20,
    windowMs: 60 * 60_000,
  });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const rawToken = request.nextUrl.searchParams.get("token");
  if (!rawToken || rawToken.length > 256) {
    return verificationRedirect(request, "invalid");
  }

  const now = new Date();
  const tokenHash = hashAuthToken(rawToken);

  try {
    await db.$transaction(async (tx) => {
      const token = await tx.authToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          type: true,
          expiresAt: true,
          usedAt: true,
        },
      });

      if (
        token?.type !== AuthTokenType.EMAIL_VERIFICATION ||
        token.usedAt ||
        token.expiresAt <= now
      ) {
        throw new Error("INVALID_TOKEN");
      }

      const consumed = await tx.authToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) throw new Error("INVALID_TOKEN");

      await tx.user.update({
        where: { id: token.userId },
        data: { emailVerified: now },
      });
    });
  } catch {
    return verificationRedirect(request, "invalid");
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("verified", "1");
  return NextResponse.redirect(url);
}
