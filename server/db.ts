import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  sounds,
  surprises,
  unlocks,
  type Sound,
  type InsertSound,
  type Surprise,
  type InsertSurprise,
  type Unlock,
  type InsertUnlock,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Sounds - Audio clips management
// ============================================================================

/**
 * Get all active sounds
 */
export async function getActiveSounds(): Promise<Sound[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(sounds)
    .where(eq(sounds.active, true))
    .orderBy(sounds.order, sounds.title);
}

/**
 * Get all sounds (including inactive)
 */
export async function getAllSounds(): Promise<Sound[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(sounds).orderBy(sounds.order, sounds.title);
}

/**
 * Get a single sound by ID
 */
export async function getSoundById(id: number): Promise<Sound | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(sounds).where(eq(sounds.id, id)).limit(1);
  return result[0];
}

/**
 * Get a random active sound
 */
export async function getRandomSound(): Promise<Sound | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(sounds)
    .where(eq(sounds.active, true))
    .orderBy(sql`RAND()`)
    .limit(1);
  
  return result[0];
}

/**
 * Create a new sound
 */
export async function createSound(data: InsertSound): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(sounds).values(data);
  return result[0].insertId;
}

/**
 * Update a sound
 */
export async function updateSound(id: number, data: Partial<InsertSound>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(sounds).set(data).where(eq(sounds.id, id));
}

/**
 * Delete a sound (soft delete by setting active = false)
 */
export async function deactivateSound(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(sounds).set({ active: false }).where(eq(sounds.id, id));
}

// ============================================================================
// Surprises - Scheduled surprise deliveries
// ============================================================================

/**
 * Get all surprises for a user
 */
export async function getUserSurprises(userId: number): Promise<Surprise[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(surprises)
    .where(eq(surprises.userId, userId))
    .orderBy(desc(surprises.createdAt));
}

/**
 * Get a single surprise by ID
 */
export async function getSurpriseById(id: number): Promise<Surprise | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(surprises).where(eq(surprises.id, id)).limit(1);
  return result[0];
}

/**
 * Get surprises that are ready to be sent (fireAt <= now and status = armed)
 */
export async function getPendingSurprises(): Promise<Surprise[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(surprises)
    .where(
      and(
        eq(surprises.status, "armed"),
        sql`${surprises.fireAt} <= NOW()`
      )
    )
    .orderBy(surprises.fireAt);
}

/**
 * Create a new surprise
 */
export async function createSurprise(data: InsertSurprise): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(surprises).values(data);
  return result[0].insertId;
}

/**
 * Update surprise status
 */
export async function updateSurpriseStatus(
  id: number,
  status: "armed" | "sent" | "opened",
  timestamp?: Date
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Partial<InsertSurprise> = { status };
  
  if (status === "sent" && timestamp) {
    updateData.sentAt = timestamp;
  } else if (status === "opened" && timestamp) {
    updateData.openedAt = timestamp;
  }
  
  await db.update(surprises).set(updateData).where(eq(surprises.id, id));
}

// ============================================================================
// Unlocks - Track which sounds each user has unlocked
// ============================================================================

/**
 * Get all unlocks for a user
 */
export async function getUserUnlocks(userId: number): Promise<Unlock[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(unlocks)
    .where(eq(unlocks.userId, userId))
    .orderBy(desc(unlocks.unlockedAt));
}

/**
 * Check if a user has unlocked a specific sound
 */
export async function isUnlocked(userId: number, soundId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select()
    .from(unlocks)
    .where(and(eq(unlocks.userId, userId), eq(unlocks.soundId, soundId)))
    .limit(1);
  
  return result.length > 0;
}

/**
 * Get a specific unlock record
 */
export async function getUnlock(userId: number, soundId: number): Promise<Unlock | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(unlocks)
    .where(and(eq(unlocks.userId, userId), eq(unlocks.soundId, soundId)))
    .limit(1);
  
  return result[0];
}

/**
 * Unlock a sound for a user (first time)
 */
export async function unlockSound(userId: number, soundId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(unlocks).values({
    userId,
    soundId,
    timesHeard: 1,
  });
  
  return result[0].insertId;
}

/**
 * Increment play count for an already unlocked sound
 */
export async function incrementPlayCount(userId: number, soundId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(unlocks)
    .set({
      timesHeard: sql`${unlocks.timesHeard} + 1`,
      lastHeardAt: new Date(),
    })
    .where(and(eq(unlocks.userId, userId), eq(unlocks.soundId, soundId)));
}

/**
 * Get unlock progress (count and total)
 */
export async function getUnlockProgress(userId: number): Promise<{ unlocked: number; total: number }> {
  const db = await getDb();
  if (!db) return { unlocked: 0, total: 0 };
  
  // Count user's unlocks
  const unlockedResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(unlocks)
    .where(eq(unlocks.userId, userId));
  
  // Count total active sounds
  const totalResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sounds)
    .where(eq(sounds.active, true));
  
  return {
    unlocked: Number(unlockedResult[0]?.count ?? 0),
    total: Number(totalResult[0]?.count ?? 0),
  };
}
