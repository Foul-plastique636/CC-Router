/**
 * Validate an OAuth access token against the Anthropic API.
 *
 * Uses GET /v1/models — lightweight call that doesn't create any resources.
 * Required header: anthropic-version (per API spec).
 * Auth: Authorization: Bearer <token> (OAuth tokens use Bearer, not x-api-key).
 */
export interface ValidationResult {
  valid: boolean;
  /** Human-readable reason if invalid */
  reason?: string;
}

export async function validateToken(accessToken: string): Promise<ValidationResult> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "anthropic-version": "2023-06-01",
        // Required for api.anthropic.com to accept OAuth tokens (sk-ant-oat01-*)
        "anthropic-beta": "oauth-2025-04-20",
      },
    });

    if (res.ok) return { valid: true };

    if (res.status === 401) {
      return { valid: false, reason: "Token invalid or expired (401)" };
    }
    if (res.status === 403) {
      return { valid: false, reason: "Token lacks required scopes (403) — needs user:inference" };
    }

    // Any other non-ok status is unexpected but the token may still work
    return { valid: false, reason: `Unexpected HTTP ${res.status}` };
  } catch (err) {
    // Network error — can't validate, let user decide
    return { valid: false, reason: `Network error: ${(err as Error).message}` };
  }
}
