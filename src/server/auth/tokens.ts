import { createHash, randomBytes } from "node:crypto";

import { type AuthTokenType } from "../../../generated/prisma";

import { db } from "~/server/db";

export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function hashAuthToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueAuthToken(
  userId: string,
  type: AuthTokenType,
  ttlMs: number,
) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashAuthToken(token);
  const now = new Date();

  await db.$transaction([
    db.authToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: now },
    }),
    db.authToken.create({
      data: {
        userId,
        type,
        tokenHash,
        expiresAt: new Date(now.getTime() + ttlMs),
      },
    }),
  ]);

  return token;
}
