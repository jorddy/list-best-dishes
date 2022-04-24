import { createRouter } from "server/context";
import { dishRouter } from "server/routers/dish-router";

export const appRouter = createRouter().merge("dish:", dishRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
