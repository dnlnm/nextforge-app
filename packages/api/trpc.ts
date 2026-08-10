import "server-only";

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

export interface ApiContext {
  headers: Headers;
}

const t = initTRPC.context<ApiContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

export { TRPCError } from "@trpc/server";
