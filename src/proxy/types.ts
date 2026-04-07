export interface OAuthTokens {
  accessToken: string;   // sk-ant-oat01-...
  refreshToken: string;  // sk-ant-ort01-...
  expiresAt: number;     // Unix timestamp in ms
  scopes: string[];      // ["user:inference", "user:profile"]
}

export interface AccountRateLimits {
  status: "allowed" | "rate_limited" | "unknown";
  fiveHourUtil: number;      // 0.0 – 1.0
  fiveHourReset: number;     // Unix timestamp in seconds
  sevenDayUtil: number;      // 0.0 – 1.0
  sevenDayReset: number;     // Unix timestamp in seconds
  claim: string;             // "five_hour" | "seven_day" — which window is limiting
  plan: string;              // "Pro" | "Max 5x" | "Max 20x" | ""
  requestsLimit: number;     // per-minute RPM from anthropic-ratelimit-requests-limit
  lastUpdated: number;       // Unix timestamp in ms
}

export const DEFAULT_RATE_LIMITS: AccountRateLimits = {
  status: "unknown",
  fiveHourUtil: 0,
  fiveHourReset: 0,
  sevenDayUtil: 0,
  sevenDayReset: 0,
  claim: "",
  plan: "",
  requestsLimit: 0,
  lastUpdated: 0,
};

export interface Account {
  id: string;
  tokens: OAuthTokens;
  healthy: boolean;
  busy: boolean;
  requestCount: number;
  errorCount: number;
  lastUsed: number;      // Unix timestamp in ms
  lastRefresh: number;   // Unix timestamp in ms
  consecutiveErrors: number;
  rateLimits: AccountRateLimits;
}

export interface RefreshResponse {
  token_type: string;      // "Bearer"
  access_token: string;
  expires_in: number;      // seconds, typically 28800 (8h)
  refresh_token: string;   // ROTATES on every refresh — must save immediately
  scope: string;           // "user:inference user:profile"
}

// Shape of each entry in accounts.json
export interface AccountRecord {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
}
