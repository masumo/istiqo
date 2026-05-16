/**
 * server/routes/auth.js
 *
 * Auth flow:
 *   1. Frontend sends Google credential to POST /api/auth/google
 *   2. Backend calls POST https://api.quran.com/api/v4/user/auth/google
 *   3. Backend returns user data + QF access token to frontend
 *   4. Frontend stores token in Zustand (never exposed to other external services)
 *
 * If QF auth endpoint fails, falls back to decoding the Google JWT locally
 * so the app still works (guest-like mode without QF user features).
 */

import { Router } from 'express';

const router = Router();

const QF_AUTH_URL = 'https://api.quran.com/api/v4/user/auth/google';

/**
 * Safely decodes the payload from a Google JWT credential.
 * @param {string} credential
 * @returns {Object|null}
 */
function decodeGoogleJwt(credential) {
  try {
    const [, payload] = credential.split('.');
    const json = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/google
 * Body: { credential: <Google ID token> }
 */
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Missing credential in request body' });
  }

  // ── Attempt 1: Exchange with Quran Foundation User API ────────────────────
  try {
    const qfResponse = await fetch(QF_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: credential }),
    });

    if (qfResponse.ok) {
      const data = await qfResponse.json();
      // QF returns: { user: {...}, access_token: '...' } or similar
      return res.json({
        user: data.user || data,
        access_token: data.access_token || null,
        source: 'qf',
      });
    }

    console.warn(
      `[auth] QF auth returned ${qfResponse.status} — falling back to JWT decode`
    );
  } catch (err) {
    console.warn('[auth] QF auth request failed:', err.message);
  }

  // ── Fallback: Decode Google JWT locally ───────────────────────────────────
  const payload = decodeGoogleJwt(credential);

  if (!payload) {
    return res.status(400).json({ error: 'Invalid Google credential' });
  }

  return res.json({
    user: {
      name: payload.name || '',
      email: payload.email || '',
      picture: payload.picture || '',
    },
    access_token: null, // No QF user token available in fallback
    source: 'google_jwt',
  });
});

export default router;
