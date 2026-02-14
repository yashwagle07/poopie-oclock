import { describe, it, expect } from "vitest";

const API_BASE = "http://127.0.0.1:3000";

// Helper to do demo login and get cookie
async function demoLogin(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const setCookie = res.headers.get("set-cookie");
  return setCookie || "";
}

describe("Demo Login", () => {
  it("should create a demo user and return session cookie", async () => {
    const res = await fetch(`${API_BASE}/api/auth/demo-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.name).toBe("Poopie");
    expect(data.user.openId).toBe("demo-user");

    // Should set a session cookie
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
  });
});

describe("Auth Me", () => {
  it("should return user info with valid session cookie", async () => {
    const cookie = await demoLogin();
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Cookie: cookie },
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    // The /api/auth/me endpoint wraps the user in a user property
    const user = data.user || data;
    expect(user.id).toBeDefined();
    expect(user.name).toBe("Poopie");
  });
});

describe("Sounds API", () => {
  it("should list active sounds", async () => {
    const res = await fetch(`${API_BASE}/api/trpc/sounds.list`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.result.data.json).toBeDefined();
    expect(Array.isArray(data.result.data.json)).toBe(true);
    expect(data.result.data.json.length).toBeGreaterThan(0);
  });

  it("should get a sound by id", async () => {
    const res = await fetch(
      `${API_BASE}/api/trpc/sounds.getById?input=${encodeURIComponent(JSON.stringify({ json: { id: 1 } }))}`
    );
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.result.data.json).toBeDefined();
    expect(data.result.data.json.id).toBe(1);
    expect(data.result.data.json.title).toBeDefined();
  });
});

describe("Arm Surprise", () => {
  it("should arm a surprise and return surprise data", async () => {
    const cookie = await demoLogin();
    const res = await fetch(`${API_BASE}/api/trpc/surprises.arm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ json: { minDelayMinutes: 1, maxDelayMinutes: 5 } }),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    const surprise = data.result.data.json;
    expect(surprise.id).toBeDefined();
    expect(surprise.fireAt).toBeDefined();
    expect(surprise.sound).toBeDefined();
    expect(surprise.sound.id).toBeDefined();
    expect(surprise.sound.title).toBeDefined();
  });

  it("should fail without authentication", async () => {
    const res = await fetch(`${API_BASE}/api/trpc/surprises.arm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { minDelayMinutes: 1, maxDelayMinutes: 5 } }),
    });
    // Should return an error (401 or error in response)
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});

describe("Unlock Progress", () => {
  it("should return unlock progress", async () => {
    const cookie = await demoLogin();
    const res = await fetch(`${API_BASE}/api/trpc/unlocks.progress`, {
      headers: { Cookie: cookie },
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    const progress = data.result.data.json;
    expect(progress.total).toBeGreaterThan(0);
    expect(typeof progress.unlocked).toBe("number");
  });
});

describe("Process Unlock", () => {
  it("should process an unlock and return result", async () => {
    const cookie = await demoLogin();

    // Get a random sound
    const soundsRes = await fetch(`${API_BASE}/api/trpc/sounds.list`);
    const soundsData = await soundsRes.json();
    const sounds = soundsData.result.data.json;
    const sound = sounds[sounds.length - 1];

    const res = await fetch(`${API_BASE}/api/trpc/unlocks.processUnlock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ json: { soundId: sound.id } }),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    const result = data.result.data.json;
    expect(typeof result.isNew).toBe("boolean");
    expect(result.message).toBeDefined();
  });
});

describe("Get Surprise By ID", () => {
  it("should get a surprise by id after arming", async () => {
    const cookie = await demoLogin();

    // Arm a surprise first
    const armRes = await fetch(`${API_BASE}/api/trpc/surprises.arm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ json: { minDelayMinutes: 1, maxDelayMinutes: 5 } }),
    });
    const armData = await armRes.json();
    const surpriseId = armData.result.data.json.id;

    // Get the surprise by ID
    const res = await fetch(
      `${API_BASE}/api/trpc/surprises.getById?input=${encodeURIComponent(JSON.stringify({ json: { id: surpriseId } }))}`,
      { headers: { Cookie: cookie } }
    );
    expect(res.ok).toBe(true);
    const data = await res.json();
    const surprise = data.result.data.json;
    expect(surprise.id).toBe(surpriseId);
    expect(surprise.status).toBe("armed");
    expect(surprise.soundId).toBeDefined();
  });
});
