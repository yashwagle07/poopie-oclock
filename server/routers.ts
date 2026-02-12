import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // Sounds Management
  // ============================================================================
  sounds: router({
    list: publicProcedure.query(async () => {
      return db.getActiveSounds();
    }),

    listAll: protectedProcedure.query(async () => {
      return db.getAllSounds();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSoundById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          url: z.string().url(),
          title: z.string().min(1).max(255),
          description: z.string().optional(),
          type: z.enum(["normal", "punishment"]).default("normal"),
          rarity: z.enum(["common", "rare", "legendary"]).default("common"),
          active: z.boolean().default(true),
          order: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createSound(input);
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          url: z.string().url().optional(),
          title: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          type: z.enum(["normal", "punishment"]).optional(),
          rarity: z.enum(["common", "rare", "legendary"]).optional(),
          active: z.boolean().optional(),
          order: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSound(id, data);
        return { success: true };
      }),

    deactivate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deactivateSound(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // Surprises Management
  // ============================================================================
  surprises: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSurprises(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const surprise = await db.getSurpriseById(input.id);
        if (surprise && surprise.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        return surprise;
      }),

    arm: protectedProcedure
      .input(
        z.object({
          minDelayMinutes: z.number().min(1).default(30),
          maxDelayMinutes: z.number().max(1440).default(240),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const sound = await db.getRandomSound();
        if (!sound) {
          throw new Error("No sounds available");
        }

        const now = new Date();
        const minDelay = input.minDelayMinutes * 60 * 1000;
        const maxDelay = input.maxDelayMinutes * 60 * 1000;
        const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        const fireAt = new Date(now.getTime() + randomDelay);

        const surpriseId = await db.createSurprise({
          userId: ctx.user.id,
          soundId: sound.id,
          soundUrl: sound.url,
          status: "armed",
          fireAt,
        });

        return {
          id: surpriseId,
          fireAt,
          sound: {
            id: sound.id,
            title: sound.title,
          },
        };
      }),

    markOpened: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const surprise = await db.getSurpriseById(input.id);
        if (!surprise || surprise.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        await db.updateSurpriseStatus(input.id, "opened", new Date());
        return { success: true };
      }),
  }),

  // ============================================================================
  // Unlocks Management
  // ============================================================================
  unlocks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const unlocks = await db.getUserUnlocks(ctx.user.id);
      const unlocksWithSounds = await Promise.all(
        unlocks.map(async (unlock) => {
          const sound = await db.getSoundById(unlock.soundId);
          return { ...unlock, sound };
        })
      );
      return unlocksWithSounds;
    }),

    isUnlocked: protectedProcedure
      .input(z.object({ soundId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.isUnlocked(ctx.user.id, input.soundId);
      }),

    processUnlock: protectedProcedure
      .input(z.object({ soundId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const alreadyUnlocked = await db.isUnlocked(ctx.user.id, input.soundId);
        if (alreadyUnlocked) {
          await db.incrementPlayCount(ctx.user.id, input.soundId);
          return { isNew: false, message: "You've heard this one before!" };
        } else {
          await db.unlockSound(ctx.user.id, input.soundId);
          return { isNew: true, message: "New sound unlocked! 🎉" };
        }
      }),

    progress: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnlockProgress(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
