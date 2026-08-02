/**
 * ============================================================================
 * [CONTROLLER registry]
 * ============================================================================
 */

import { authRouter } from "~/server/api/routers/auth";
import { listRouter } from "~/server/api/routers/list";
import { todoRouter } from "~/server/api/routers/todo";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  list: listRouter,
  todo: todoRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
