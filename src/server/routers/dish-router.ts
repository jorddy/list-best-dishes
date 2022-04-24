import { TRPCError } from "@trpc/server";
import { createRouter } from "server/context";
import { prisma } from "utils/prisma";
import { z } from "zod";

export const dishRouter = createRouter()
  .query("list", {
    input: z.object({
      cursor: z.string().min(1).nullish(),
      limit: z.number().nullish()
    }),
    async resolve({ input, ctx }) {
      const limit = input.limit ?? 3;
      const { cursor } = input;

      const dishes = await prisma.dish.findMany({
        where: { userId: ctx.session?.user.id },
        orderBy: {
          id: "desc"
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined
      });

      let nextCursor: typeof cursor | null = null;
      if (dishes.length > limit) {
        const nextItem = dishes.pop();
        nextCursor = nextItem!.id;
      }

      return { dishes, nextCursor };
    }
  })
  .mutation("create", {
    input: z.object({
      title: z.string().min(2)
    }),
    async resolve({ input, ctx }) {
      if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });

      return await prisma.dish.create({
        data: { title: input.title, userId: ctx.session.user.id }
      });
    }
  })
  .mutation("remove", {
    input: z.object({
      id: z.string()
    }),
    async resolve({ input, ctx }) {
      if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });

      return await prisma.dish.delete({
        where: { id: input.id }
      });
    }
  });
