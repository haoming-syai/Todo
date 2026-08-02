/**
 * ============================================================================
 * [CONTROLLER] — list router (A2 personal + shared)
 * ============================================================================
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  ensurePersonalList,
  requireListMember,
} from "~/server/lib/ensure-personal-list";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const listRouter = createTRPCRouter({
  /**
   * Lists I belong to (personal + shared).
   * Also ensures a personal "My Todos" list exists (covers Google sign-in).
   */
  getMine: protectedProcedure.query(async ({ ctx }) => {
    await ensurePersonalList(ctx.db, ctx.session.user.id);

    return ctx.db.todoList.findMany({
      where: {
        members: { some: { userId: ctx.session.user.id } },
      },
      orderBy: [{ isShared: "asc" }, { name: "asc" }],
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { todos: true } },
      },
    });
  }),

  /**
   * Create a list. isShared=true → collaborative; false → another personal list.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1),
        isShared: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.todoList.create({
        data: {
          name: input.name,
          isShared: input.isShared,
          ownerId: ctx.session.user.id,
          members: {
            create: { userId: ctx.session.user.id, role: "OWNER" },
          },
        },
      });
    }),

  /**
   * Invite by email (owner only). Forces isShared=true.
   */
  invite: protectedProcedure
    .input(
      z.object({
        listId: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.db.todoList.findFirst({
        where: { id: input.listId, ownerId: ctx.session.user.id },
      });
      if (!list) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the list owner can invite",
        });
      }

      const invitee = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (!invitee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No user with that email — they must register first",
        });
      }

      if (invitee.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already on this list",
        });
      }

      await ctx.db.todoList.update({
        where: { id: list.id },
        data: { isShared: true },
      });

      try {
        await ctx.db.todoListMember.create({
          data: {
            listId: list.id,
            userId: invitee.id,
            role: "MEMBER",
          },
        });
      } catch {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member",
        });
      }

      return { ok: true as const };
    }),

  getMembers: protectedProcedure
    .input(z.object({ listId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await requireListMember(ctx.db, input.listId, ctx.session.user.id);

      return ctx.db.todoListMember.findMany({
        where: { listId: input.listId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
      });
    }),
});
