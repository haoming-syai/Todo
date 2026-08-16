/**
 * ============================================================================
 * [CONTROLLER] — auth-related API (register)
 * ============================================================================
 */

import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  /**
   * S2 — Register with email + password
   * A2 — also creates personal "My Todos" list + OWNER membership
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();

      const existing = await ctx.db.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      // Transaction: User + personal list + membership together
      await ctx.db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: input.name,
            email,
            passwordHash,
          },
        });

        await tx.todoList.create({
          data: {
            name: "My Todos",
            isShared: false,
            ownerId: user.id,
            members: {
              create: { userId: user.id, role: "OWNER" },
            },
          },
        });
      });

      return { ok: true as const };
    }),
});
