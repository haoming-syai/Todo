/**
 * ============================================================================
 * [CONTROLLER] — tRPC todo router
 * ============================================================================
 * A2 change: access is by LIST MEMBERSHIP, not only createdById.
 * Any member of the list can get / create / update / delete / attach images.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  requireListMember,
  requireTodoViaMembership,
} from "~/server/lib/ensure-personal-list";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const todoRouter = createTRPCRouter({
  /** S1/A2 — todos for one list I belong to */
  getByList: protectedProcedure
    .input(z.object({ listId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await requireListMember(ctx.db, input.listId, ctx.session.user.id);

      return ctx.db.todo.findMany({
        where: { listId: input.listId },
        orderBy: { createdAt: "desc" },
      });
    }),

  /** S3 — insert into a list */
  create: protectedProcedure
    .input(
      z.object({
        listId: z.string().min(1),
        title: z.string().trim().min(1, "Title is required").max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireListMember(ctx.db, input.listId, ctx.session.user.id);

      return ctx.db.todo.create({
        data: {
          title: input.title,
          listId: input.listId,
          createdById: ctx.session.user.id,
        },
      });
    }),

  /** S4 — update (any list member) */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        title: z.string().trim().min(1).max(200).optional(),
        completed: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireTodoViaMembership(ctx.db, input.id, ctx.session.user.id);

      return ctx.db.todo.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.completed !== undefined
            ? { completed: input.completed }
            : {}),
        },
      });
    }),

  /** S5 — delete todo; its TodoImage cascades in Neon. */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const todo = await requireTodoViaMembership(
        ctx.db,
        input.id,
        ctx.session.user.id,
      );

      await ctx.db.todo.delete({ where: { id: todo.id } });
      return { ok: true as const };
    }),

  /**
   * S6+ — delete photo only (keep the todo)
   * Clears imageUrl and deletes the corresponding Neon TodoImage row.
   */
  removeImage: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const todo = await requireTodoViaMembership(
        ctx.db,
        input.id,
        ctx.session.user.id,
      );

      if (!todo.imageUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Todo has no image",
        });
      }

      const [, updated] = await ctx.db.$transaction([
        ctx.db.todoImage.deleteMany({ where: { todoId: todo.id } }),
        ctx.db.todo.update({
          where: { id: todo.id },
          data: { imageUrl: null },
        }),
      ]);
      return updated;
    }),
});
