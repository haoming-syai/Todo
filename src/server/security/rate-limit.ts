import { createHmac } from "node:crypto";

import { TRPCError } from "@trpc/server";

import { env } from "~/env";
import { db } from "~/server/db";

type RateLimitInput = {
  route: string;
  identity: string;
  limit: number;
  windowMs: number;
};

type RateLimitRow = {
  count: number;
  resetAt: Date;
};

function keyHash(route: string, identity: string) {
  const secret = env.AUTH_SECRET ?? "development-rate-limit-key";
  return createHmac("sha256", secret)
    .update(`${route}:${identity}`)
    .digest("hex");
}

export async function checkRateLimit(input: RateLimitInput) {
  const key = keyHash(input.route, input.identity);
  const resetAt = new Date(Date.now() + input.windowMs);

  const rows = await db.$queryRaw<RateLimitRow[]>`
    INSERT INTO "RateLimitBucket" ("keyHash", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${resetAt}, NOW())
    ON CONFLICT ("keyHash") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN ${resetAt}
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = NOW()
    RETURNING "count", "resetAt"
  `;

  const row = rows[0];
  if (!row) throw new Error("Rate limiter did not return a result");

  const retryAfter = Math.max(
    1,
    Math.ceil((new Date(row.resetAt).getTime() - Date.now()) / 1000),
  );

  return {
    allowed: row.count <= input.limit,
    remaining: Math.max(0, input.limit - row.count),
    retryAfter,
  };
}

export async function enforceRateLimit(input: RateLimitInput) {
  const result = await checkRateLimit(input);
  if (!result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many requests. Try again in ${result.retryAfter} seconds.`,
    });
  }
  return result;
}
