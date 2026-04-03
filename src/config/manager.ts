import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "fs";
import { CONFIG_DIR, ACCOUNTS_PATH } from "./paths.js";
import type { Account, AccountRecord } from "../proxy/types.js";

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function accountsFileExists(): boolean {
  return existsSync(ACCOUNTS_PATH);
}

export function readAccountsRaw(): unknown[] {
  if (!existsSync(ACCOUNTS_PATH)) return [];
  try {
    return JSON.parse(readFileSync(ACCOUNTS_PATH, "utf-8"));
  } catch {
    return [];
  }
}

// Escritura atómica: escribe a .tmp y renombra — evita JSON corrupto si el proceso muere mid-write
export function writeAccountsAtomic(data: unknown[]): void {
  ensureConfigDir();
  const tmp = ACCOUNTS_PATH + ".tmp";
  writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  renameSync(tmp, ACCOUNTS_PATH);
}

/** Deserialize flat AccountRecord[] from disk into runtime Account[] */
export function loadAccounts(): Account[] {
  const raw = readAccountsRaw() as AccountRecord[];
  return raw.map(a => ({
    id: a.id,
    tokens: {
      accessToken: a.accessToken,
      refreshToken: a.refreshToken,
      expiresAt: a.expiresAt,
      scopes: a.scopes ?? ["user:inference", "user:profile"],
    },
    healthy: true,
    busy: false,
    requestCount: 0,
    errorCount: 0,
    lastUsed: 0,
    lastRefresh: 0,
    consecutiveErrors: 0,
  }));
}
