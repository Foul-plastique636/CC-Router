import { describe, it, expect, beforeEach } from "vitest";
import { TokenPool } from "../proxy/token-pool.js";
import type { Account } from "../proxy/types.js";

function makeAccount(id: string, healthy = true, busy = false): Account {
  return {
    id,
    tokens: {
      accessToken: `sk-ant-oat01-${id}`,
      refreshToken: `sk-ant-ort01-${id}`,
      expiresAt: Date.now() + 3_600_000,
      scopes: ["user:inference", "user:profile"],
    },
    healthy,
    busy,
    requestCount: 0,
    errorCount: 0,
    lastUsed: 0,
    lastRefresh: 0,
    consecutiveErrors: 0,
  };
}

describe("TokenPool — round-robin", () => {
  it("cycles through all healthy accounts in order", () => {
    const pool = new TokenPool([makeAccount("a"), makeAccount("b"), makeAccount("c")]);
    const ids = Array.from({ length: 4 }, () => pool.getNext().id);
    expect(ids).toEqual(["a", "b", "c", "a"]);
  });

  it("wraps back to first account after the last", () => {
    const pool = new TokenPool([makeAccount("x"), makeAccount("y")]);
    expect(pool.getNext().id).toBe("x");
    expect(pool.getNext().id).toBe("y");
    expect(pool.getNext().id).toBe("x");
  });

  it("increments requestCount on every getNext()", () => {
    const pool = new TokenPool([makeAccount("a")]);
    pool.getNext();
    pool.getNext();
    pool.getNext();
    expect(pool.getAll()[0].requestCount).toBe(3);
  });

  it("updates lastUsed timestamp on every getNext()", () => {
    const before = Date.now();
    const pool = new TokenPool([makeAccount("a")]);
    pool.getNext();
    expect(pool.getAll()[0].lastUsed).toBeGreaterThanOrEqual(before);
  });
});

describe("TokenPool — unhealthy accounts", () => {
  it("skips unhealthy accounts", () => {
    const pool = new TokenPool([
      makeAccount("a", false),
      makeAccount("b"),
      makeAccount("c"),
    ]);
    const ids = [pool.getNext().id, pool.getNext().id, pool.getNext().id];
    expect(ids).toEqual(["b", "c", "b"]);
  });

  it("returns first account when ALL are unhealthy (emergency fallback)", () => {
    const pool = new TokenPool([makeAccount("a", false), makeAccount("b", false)]);
    expect(pool.getNext().id).toBe("a");
  });

  it("getHealthy() excludes unhealthy accounts", () => {
    const pool = new TokenPool([makeAccount("a", false), makeAccount("b"), makeAccount("c")]);
    expect(pool.getHealthy().map(a => a.id)).toEqual(["b", "c"]);
  });
});

describe("TokenPool — busy accounts", () => {
  it("skips busy accounts in round-robin", () => {
    const pool = new TokenPool([makeAccount("a", true, true), makeAccount("b")]);
    expect(pool.getNext().id).toBe("b");
    expect(pool.getNext().id).toBe("b");
  });

  it("returns least-loaded when ALL healthy accounts are busy", () => {
    const a = makeAccount("a", true, true);
    const b = makeAccount("b", true, true);
    a.requestCount = 10;
    b.requestCount = 3;
    const pool = new TokenPool([a, b]);
    expect(pool.getNext().id).toBe("b");
  });

  it("falls back to least-loaded of all when all are both busy AND unhealthy", () => {
    const a = makeAccount("a", false, true);
    const b = makeAccount("b", false, true);
    // All unhealthy → emergency path returns first account
    const pool = new TokenPool([a, b]);
    expect(pool.getNext().id).toBe("a");
  });
});

describe("TokenPool — stats", () => {
  it("getStats() returns one entry per account", () => {
    const pool = new TokenPool([makeAccount("a"), makeAccount("b")]);
    pool.getNext(); // trigger one request
    const stats = pool.getStats();
    expect(stats).toHaveLength(2);
    expect(stats[0].id).toBe("a");
    expect(stats[0].requestCount).toBe(1);
    expect(typeof stats[0].expiresInMs).toBe("number");
  });

  it("getAll() returns all accounts including unhealthy", () => {
    const pool = new TokenPool([makeAccount("a", false), makeAccount("b")]);
    expect(pool.getAll()).toHaveLength(2);
  });
});
