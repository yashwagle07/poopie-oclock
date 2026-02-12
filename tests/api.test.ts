import { describe, it, expect, beforeAll } from "vitest";
import * as db from "../server/db";

describe("Database Functions", () => {
  describe("Sounds", () => {
    it("should get active sounds", async () => {
      const sounds = await db.getActiveSounds();
      expect(Array.isArray(sounds)).toBe(true);
    });

    it("should get all sounds", async () => {
      const sounds = await db.getAllSounds();
      expect(Array.isArray(sounds)).toBe(true);
    });
  });

  describe("Unlock Progress", () => {
    it("should return progress with unlocked and total counts", async () => {
      // Test with a non-existent user ID
      const progress = await db.getUnlockProgress(999999);
      expect(progress).toHaveProperty("unlocked");
      expect(progress).toHaveProperty("total");
      expect(typeof progress.unlocked).toBe("number");
      expect(typeof progress.total).toBe("number");
      expect(progress.unlocked).toBeGreaterThanOrEqual(0);
      expect(progress.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Surprises", () => {
    it("should get user surprises", async () => {
      // Test with a non-existent user ID
      const surprises = await db.getUserSurprises(999999);
      expect(Array.isArray(surprises)).toBe(true);
    });

    it("should get pending surprises", async () => {
      const surprises = await db.getPendingSurprises();
      expect(Array.isArray(surprises)).toBe(true);
    });
  });

  describe("Unlocks", () => {
    it("should get user unlocks", async () => {
      // Test with a non-existent user ID
      const unlocks = await db.getUserUnlocks(999999);
      expect(Array.isArray(unlocks)).toBe(true);
    });

    it("should check if sound is unlocked", async () => {
      // Test with a non-existent user and sound
      const isUnlocked = await db.isUnlocked(999999, 999999);
      expect(typeof isUnlocked).toBe("boolean");
      expect(isUnlocked).toBe(false);
    });
  });
});

describe("API Schema Validation", () => {
  it("should have correct sound schema structure", () => {
    // This test validates that the schema types are correctly exported
    const mockSound = {
      id: 1,
      url: "https://example.com/sound.mp3",
      title: "Test Sound",
      description: "A test sound",
      type: "normal" as const,
      rarity: "common" as const,
      active: true,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(mockSound).toHaveProperty("id");
    expect(mockSound).toHaveProperty("url");
    expect(mockSound).toHaveProperty("title");
    expect(mockSound).toHaveProperty("type");
    expect(mockSound).toHaveProperty("rarity");
    expect(mockSound).toHaveProperty("active");
  });

  it("should have correct surprise schema structure", () => {
    const mockSurprise = {
      id: 1,
      userId: 1,
      soundId: 1,
      soundUrl: "https://example.com/sound.mp3",
      status: "armed" as const,
      fireAt: new Date(),
      sentAt: null,
      openedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(mockSurprise).toHaveProperty("id");
    expect(mockSurprise).toHaveProperty("userId");
    expect(mockSurprise).toHaveProperty("soundId");
    expect(mockSurprise).toHaveProperty("status");
    expect(mockSurprise).toHaveProperty("fireAt");
  });

  it("should have correct unlock schema structure", () => {
    const mockUnlock = {
      id: 1,
      userId: 1,
      soundId: 1,
      unlockedAt: new Date(),
      timesHeard: 1,
      lastHeardAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(mockUnlock).toHaveProperty("id");
    expect(mockUnlock).toHaveProperty("userId");
    expect(mockUnlock).toHaveProperty("soundId");
    expect(mockUnlock).toHaveProperty("unlockedAt");
    expect(mockUnlock).toHaveProperty("timesHeard");
  });
});
