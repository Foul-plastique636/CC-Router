import type { Account } from "./types.js";

/** Returns the earliest non-zero reset timestamp (seconds) for an account. */
function earliestReset(a: Account): number {
  const r = a.rateLimits;
  if (r.fiveHourReset && r.sevenDayReset) return Math.min(r.fiveHourReset, r.sevenDayReset);
  return r.fiveHourReset || r.sevenDayReset || Infinity;
}

export class TokenPool {
  private accounts: Account[];
  private currentIndex = 0;

  constructor(accounts: Account[]) {
    this.accounts = accounts;
  }

  /**
   * Round-robin selection among healthy, non-busy, non-rate-limited accounts.
   * Falls back to least-loaded if all are busy/limited.
   * When all are rate-limited, picks the one with the earliest reset.
   * Falls back to accounts[0] if all are unhealthy.
   */
  getNext(): Account {
    const available = this.accounts.filter(a =>
      a.healthy && !a.busy && a.rateLimits.status !== "rate_limited"
    );

    if (available.length === 0) {
      const healthy = this.accounts.filter(a => a.healthy);
      if (healthy.length === 0) {
        return this.accounts[0];
      }
      // All healthy but busy/limited — pick earliest reset time
      return healthy.reduce((best, a) => {
        const resetA = earliestReset(a);
        const resetBest = earliestReset(best);
        return resetA < resetBest ? a : best;
      });
    }

    const account = available[this.currentIndex % available.length];
    this.currentIndex = (this.currentIndex + 1) % available.length;
    account.requestCount++;
    account.lastUsed = Date.now();
    return account;
  }

  getAll(): Account[] {
    return this.accounts;
  }

  getHealthy(): Account[] {
    return this.accounts.filter(a => a.healthy);
  }

  getStats() {
    return this.accounts.map(a => ({
      id: a.id,
      healthy: a.healthy,
      busy: a.busy,
      requestCount: a.requestCount,
      errorCount: a.errorCount,
      expiresInMs: a.tokens.expiresAt - Date.now(),
      lastUsedMs: a.lastUsed,
      lastRefreshMs: a.lastRefresh,
      rateLimits: a.rateLimits,
    }));
  }
}
