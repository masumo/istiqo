/**
 * server/lib/quranAuth.js — OAuth2 Client Credentials token manager
 *
 * Source: https://api-docs.quran.foundation/docs/quickstart/manual-authentication
 *
 * Token request spec (from official docs):
 *   Method:       POST
 *   URL:          {authBaseUrl}/oauth2/token
 *   Auth:         HTTP Basic  →  Authorization: Basic base64(client_id:client_secret)
 *   Content-Type: application/x-www-form-urlencoded
 *   Body:         grant_type=client_credentials&scope=content
 *
 * Environment URLs (from official docs):
 *   QF_ENV=prelive    → OAuth2: https://prelive-oauth2.quran.foundation
 *                        Content: https://apis-prelive.quran.foundation
 *   QF_ENV=production → OAuth2: https://oauth2.quran.foundation
 *                        Content: https://apis.quran.foundation
 *
 * Token response shape:
 *   { access_token: string, token_type: "bearer", expires_in: number, scope: "content" }
 */

// ── Environment URL maps (per official docs) ───────────────────────────────────
const AUTH_BASE_BY_ENV = {
  prelive:    'https://prelive-oauth2.quran.foundation',
  production: 'https://oauth2.quran.foundation',
};

const CONTENT_BASE_BY_ENV = {
  prelive:    'https://apis-prelive.quran.foundation',
  production: 'https://apis.quran.foundation',
};

/**
 * Returns the resolved OAuth2 base URL for the current QF_ENV.
 * Throws if QF_ENV is set to an unrecognised value.
 */
export function getAuthBaseUrl() {
  const env = process.env.QF_ENV ?? 'prelive';
  if (!(env in AUTH_BASE_BY_ENV)) {
    throw new Error(`[quranAuth] QF_ENV must be 'prelive' or 'production', got: ${env}`);
  }
  return AUTH_BASE_BY_ENV[env];
}

/**
 * Returns the resolved Content API base URL for the current QF_ENV.
 */
export function getContentBaseUrl() {
  const env = process.env.QF_ENV ?? 'prelive';
  if (!(env in CONTENT_BASE_BY_ENV)) {
    throw new Error(`[quranAuth] QF_ENV must be 'prelive' or 'production', got: ${env}`);
  }
  return CONTENT_BASE_BY_ENV[env];
}

// ── Token cache ────────────────────────────────────────────────────────────────
let _cachedToken = null;
let _expiresAt   = 0;

/**
 * Returns a valid access token, fetching a new one only when necessary.
 * Cache is invalidated 30 s before actual expiry to avoid edge-case races.
 * @returns {Promise<string>}
 */
export async function getAccessToken() {
  if (_cachedToken && Date.now() < _expiresAt - 30_000) {
    return _cachedToken;
  }
  return _fetchToken();
}

/**
 * Force-invalidates the cached token.
 * Call this when a Content API request returns 401 so the next call re-fetches.
 */
export function invalidateToken() {
  _cachedToken = null;
  _expiresAt   = 0;
}

// ── Internal token fetch ───────────────────────────────────────────────────────

/**
 * Fetches a fresh access token from the QF OAuth2 endpoint using HTTP Basic auth.
 *
 * Per official docs the credentials go in the Authorization header as Basic,
 * NOT as form fields in the request body.
 *
 * @returns {Promise<string>}
 */
async function _fetchToken() {
  const { QF_CLIENT_ID, QF_CLIENT_SECRET } = process.env;

  if (!QF_CLIENT_ID || !QF_CLIENT_SECRET) {
    throw new Error(
      '[quranAuth] QF_CLIENT_ID and QF_CLIENT_SECRET must be set in .env'
    );
  }

  const authBaseUrl = getAuthBaseUrl();
  const tokenUrl    = `${authBaseUrl}/oauth2/token`;

  // HTTP Basic auth: base64(client_id:client_secret)
  const basicAuth = Buffer.from(`${QF_CLIENT_ID}:${QF_CLIENT_SECRET}`).toString('base64');

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization:  `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope:      'content',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[quranAuth] Token fetch failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  _cachedToken = data.access_token;
  // expires_in is in seconds; default to 3600 if missing
  _expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;

  const env = process.env.QF_ENV ?? 'prelive';
  console.log(
    `[quranAuth] Token refreshed  env=${env}  expires_in=${data.expires_in ?? 3600}s`
  );

  return _cachedToken;
}
