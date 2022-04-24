import * as trpc from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getSession } from "next-auth/react";

// The app's context - is generated for each incoming request
export const createContext = async ({ req }: CreateNextContextOptions) => {
  const session = await getSession({ req });
  return { session };
};

type Context = trpc.inferAsyncReturnType<typeof createContext>;

// Helper function to create a router with your app's context
export function createRouter() {
  return trpc.router<Context>();
}
