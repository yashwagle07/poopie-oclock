import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  unique,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// Sounds Table - Audio clips that can be played as surprises
// ============================================================================

export const sounds = mysqlTable("sounds", {
  id: int("id").autoincrement().primaryKey(),
  url: varchar("url", { length: 512 }).notNull(), // S3 or Firebase Storage URL
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["normal", "punishment"]).default("normal").notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "legendary"]).default("common").notNull(),
  active: boolean("active").default(true).notNull(), // Only active sounds can be selected
  order: int("order").default(0).notNull(), // Display order in SurpriseDex
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// Surprises Table - Scheduled surprise deliveries
// ============================================================================

export const surprises = mysqlTable("surprises", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // User who armed the surprise
  soundId: int("soundId").notNull(), // Selected sound for this surprise
  soundUrl: varchar("soundUrl", { length: 512 }), // Cached URL for quick access
  status: mysqlEnum("status", ["armed", "sent", "opened"]).default("armed").notNull(),
  fireAt: timestamp("fireAt").notNull(), // When to send the notification
  sentAt: timestamp("sentAt"), // When notification was actually sent
  openedAt: timestamp("openedAt"), // When user opened and played the surprise
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// Unlocks Table - Track which sounds each user has unlocked
// ============================================================================

export const unlocks = mysqlTable(
  "unlocks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    soundId: int("soundId").notNull(),
    unlockedAt: timestamp("unlockedAt").defaultNow().notNull(), // First time heard
    timesHeard: int("timesHeard").default(1).notNull(), // How many times played
    lastHeardAt: timestamp("lastHeardAt").defaultNow().notNull(), // Most recent play
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    // Ensure each user can only unlock a sound once
    userSoundUnique: unique().on(table.userId, table.soundId),
  })
);

// ============================================================================
// Type Exports
// ============================================================================

export type Sound = typeof sounds.$inferSelect;
export type InsertSound = typeof sounds.$inferInsert;

export type Surprise = typeof surprises.$inferSelect;
export type InsertSurprise = typeof surprises.$inferInsert;

export type Unlock = typeof unlocks.$inferSelect;
export type InsertUnlock = typeof unlocks.$inferInsert;
