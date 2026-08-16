/**
 * ============================================================================
 * [CONTROLLER] — list router (A2 personal + shared)
 * ============================================================================
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  ensurePersonalList,
  removeStorageObject,
  requireListMember,
  requireListOwner,
} from "~/server/lib/ensure-personal-list";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const listRouter = createTRPCRouter({
  /**
   * Lists I belong to (personal + shared).
   * First-run: creates a personal "My Todos" list if the user has none at all.
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
        name: z.string().trim().min(1).max(80),
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
   * Rename a list (owner only).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1).max(80),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireListOwner(ctx.db, input.id, ctx.session.user.id);
      return ctx.db.todoList.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  /**
   * Delete a list and its todos (owner only).
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await requireListOwner(ctx.db, input.id, ctx.session.user.id);

      const images = await ctx.db.todo.findMany({
        where: { listId: input.id, NOT: { imageUrl: null } },
        select: { imageUrl: true },
      });
      await Promise.all(
        images.map((todo) =>
          todo.imageUrl ? removeStorageObject(todo.imageUrl) : Promise.resolve(),
        ),
      );

      await ctx.db.todoList.delete({ where: { id: input.id } });
      return { ok: true as const };
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
      await requireListOwner(ctx.db, input.listId, ctx.session.user.id);

      const invitee = await ctx.db.user.findFirst({
        where: { email: { equals: input.email, mode: "insensitive" } },
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

      try {
        await ctx.db.$transaction([
          ctx.db.todoList.update({
            where: { id: input.listId },
            data: { isShared: true },
          }),
          ctx.db.todoListMember.create({
            data: {
              listId: input.listId,
              userId: invitee.id,
              role: "MEMBER",
            },
          }),
        ]);
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
