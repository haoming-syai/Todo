import { AuthTokenType } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

import {
  emailRequestSchema,
  registerSchema,
  resetPasswordSchema,
} from "~/lib/validation/auth";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "~/server/auth/email";
import {
  hashAuthToken,
  issueAuthToken,
  PASSWORD_RESET_TOKEN_TTL_MS,
  VERIFICATION_TOKEN_TTL_MS,
} from "~/server/auth/tokens";
import { getClientIp } from "~/server/security/request";
import { enforceRateLimit } from "~/server/security/rate-limit";

const GENERIC_ACCOUNT_MESSAGE =
  "If the account can use this action, an email has been sent.";

async function rateLimitEmailAction(
  headers: Headers,
  route: string,
  email: string,
  options: {
    ipLimit?: number;
    emailLimit?: number;
    windowMs?: number;
  } = {},
) {
  const ip = getClientIp(headers);
  const {
    ipLimit = 5,
    emailLimit = 3,
    windowMs = 60 * 60_000,
  } = options;
  await Promise.all([
    enforceRateLimit({
      route: `${route}.ip`,
      identity: ip,
      limit: ipLimit,
      windowMs,
    }),
    enforceRateLimit({
      route: `${route}.email`,
      identity: email,
      limit: emailLimit,
      windowMs,
    }),
  ]);
}

function reportEmailFailure(error: unknown) {
  console.error(
    "Authentication email delivery failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
}

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit({
        route: "auth.register.ip",
        identity: getClientIp(ctx.headers),
        limit: 5,
        windowMs: 60 * 60_000,
      });

      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });

      if (existing) {
        return { ok: true as const, message: GENERIC_ACCOUNT_MESSAGE };
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const user = await ctx.db.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash,
          },
        });

        await tx.todoList.create({
          data: {
            name: "My Todos",
            isShared: false,
            ownerId: created.id,
            members: {
              create: { userId: created.id, role: "OWNER" },
            },
          },
        });

        return created;
      });

      const token = await issueAuthToken(
        user.id,
        AuthTokenType.EMAIL_VERIFICATION,
        VERIFICATION_TOKEN_TTL_MS,
      );
      await sendVerificationEmail(input.email, token).catch(reportEmailFailure);

      return { ok: true as const, message: GENERIC_ACCOUNT_MESSAGE };
    }),

  requestPasswordReset: publicProcedure
    .input(emailRequestSchema)
    .mutation(async ({ ctx, input }) => {
      await rateLimitEmailAction(
        ctx.headers,
        // v2 starts a fresh bucket after replacing the original one-hour
        // development limit with a shorter test-friendly window.
        "auth.password-reset.request.v2",
        input.email,
        { ipLimit: 10, emailLimit: 10, windowMs: 5 * 60_000 },
      );

      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true, email: true },
      });

      if (user?.email) {
        const token = await issueAuthToken(
          user.id,
          AuthTokenType.PASSWORD_RESET,
          PASSWORD_RESET_TOKEN_TTL_MS,
        );
        await sendPasswordResetEmail(user.email, token).catch(
          reportEmailFailure,
        );
        return { ok: true as const, message: GENERIC_ACCOUNT_MESSAGE };
      }

      return { ok: true as const, message: GENERIC_ACCOUNT_MESSAGE };
    }),

  resendVerification: publicProcedure
    .input(emailRequestSchema)
    .mutation(async ({ ctx, input }) => {
      await rateLimitEmailAction(
        ctx.headers,
        "auth.verification.resend",
        input.email,
      );

      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true, email: true, emailVerified: true },
      });

      if (user?.email && !user.emailVerified) {
        const token = await issueAuthToken(
          user.id,
          AuthTokenType.EMAIL_VERIFICATION,
          VERIFICATION_TOKEN_TTL_MS,
        );
        await sendVerificationEmail(user.email, token).catch(
          reportEmailFailure,
        );
        return { ok: true as const, message: GENERIC_ACCOUNT_MESSAGE };
      }

      if (user?.emailVerified) {
        return {
          ok: true as const,
          status: "alreadyVerified" as const,
          message: "This email is already verified. You can sign in.",
        };
      }

      return { ok: true as const, message: GENERIC_ACCOUNT_MESSAGE };
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit({
        route: "auth.password-reset.complete.ip",
        identity: getClientIp(ctx.headers),
        limit: 10,
        windowMs: 60 * 60_000,
      });

      const tokenHash = hashAuthToken(input.token);
      const passwordHash = await bcrypt.hash(input.password, 12);
      const now = new Date();

      await ctx.db.$transaction(async (tx) => {
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
          token?.type !== AuthTokenType.PASSWORD_RESET ||
          token.usedAt ||
          token.expiresAt <= now
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This password reset link is invalid or expired.",
          });
        }

        const consumed = await tx.authToken.updateMany({
          where: { id: token.id, usedAt: null, expiresAt: { gt: now } },
          data: { usedAt: now },
        });
        if (consumed.count !== 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This password reset link is invalid or expired.",
          });
        }

        await tx.user.update({
          where: { id: token.userId },
          data: {
            passwordHash,
            // A valid reset token was delivered to this address, so consuming
            // it also proves ownership for accounts that were not yet verified.
            emailVerified: now,
            failedLoginAttempts: 0,
            lockedUntil: null,
            sessionVersion: { increment: 1 },
          },
        });
        await tx.session.deleteMany({ where: { userId: token.userId } });
      });

      return { ok: true as const };
    }),
});
