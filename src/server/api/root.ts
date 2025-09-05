import { ensembleRouter } from "@/server/api/routers/ensemble";
import { validationRouter } from "@/server/api/routers/validation";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  ensemble: ensembleRouter,
  validation: validationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.ensemble.query({ ... });
 *       ^? { consensusResponse: string, ... }
 */
export const createCaller = createCallerFactory(appRouter);