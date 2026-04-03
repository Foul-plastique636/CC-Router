import type { Account } from "./types.js";

export class TokenPool {
  private accounts: Account[];
  private currentIndex = 0;

  constructor(accounts: Account[]) {
    this.accounts = accounts;
  }

  /**
   * Round-robin selection among healthy, non-busy accounts.
   * Falls back to least-loaded if all are busy.
   * Falls back to accounts[0] if all are unhealthy.
   */
  getNext(): Account {
    const available = this.accounts.filter(a => a.healthy && !a.busy);

    if (available.length === 0) {
      const healthy = this.accounts.filter(a => a.healthy);
      if (healthy.length === 0) {
        // Complete fallback: nothing healthy — return first account and hope it recovers
        return this.accounts[0];
      }
      // All healthy but busy — return least loaded
      return healthy.reduce((a, b) => a.requestCount < b.requestCount ? a : b);
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
    }));
  }
}
