export interface OAuthTokens {
  accessToken: string;   // sk-ant-oat01-...
  refreshToken: string;  // sk-ant-ort01-...
  expiresAt: number;     // Unix timestamp in ms
  scopes: string[];      // ["user:inference", "user:profile"]
}

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
