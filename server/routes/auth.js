/**
 * server/routes/auth.js — Google credential login
 *
 * Backend returns user info from Google JWT.
 * Activity tracking will be local-only for Google login users.
 */

import { Router } from 'express';
import { getContentBaseUrl } from '../lib/quranAuth.js';
import {
  getQFEnv,
  getUserAuthBaseUrl,
  getUserClientId,
} from '../lib/qfEnv.js';

const router = Router();

function decodeJwtPayload(jwt) {
  try {
    const [, payload] = jwt.split('.');
    const json = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const decodeGoogleJwt = decodeJwtPayload;

/**
 * POST /api/auth/google
 * Body: { credential: <Google ID token> }
 */
router.post('/google', async (req, res) => {
  const { credential, google_client_id: googleClientId } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Missing credential in request body' });
  }

  const userEnv = getQFEnv('user');
  console.log(`[auth] Google login (local fallback mode, QF_USER_ENV=${userEnv})`);

  const payload = decodeGoogleJwt(credential);
  if (!payload) {
    return res.status(400).json({ error: 'Invalid Google credential' });
  }

  return res.json({
    user: {
      name:    payload.name    || '',
      email:   payload.email   || '',
      picture: payload.picture || '',
    },
    access_token: null,
    source:       'local_only',
  });
});

/**
 * GET /api/auth/demo
 * Hackathon demo: pakai access token dari akun QF manual (Network tab → x-auth-token).
 * Token disimpan di .env sebagai QF_DEMO_ACCESS_TOKEN (tidak diekspos ke browser build).
 */
router.get('/demo', async (req, res) => {
  const token = process.env.QF_DEMO_ACCESS_TOKEN?.trim();
  if (!token) {
    return res.status(404).json({
      enabled: false,
      error: 'QF_DEMO_ACCESS_TOKEN belum di-set di .env server',
    });
  }

  const payload = decodeJwtPayload(token);
  const userEnv = getQFEnv('user');
  const expMs = payload?.exp ? payload.exp * 1000 : null;

  if (expMs && Date.now() >= expMs) {
    return res.status(400).json({
      enabled: false,
      error: 'Token demo kedaluwarsa',
      expiredAt: new Date(expMs).toISOString(),
      hint:
        'Login ulang di prelive-oauth2.quran.foundation → Network tab → salin access_token baru ke QF_DEMO_ACCESS_TOKEN',
      userEnv,
    });
  }

  const probeUrl = `${getUserAuthBaseUrl()}/v1/activity-days`;
  try {
    const probe = await fetch(probeUrl, {
      method: 'GET',
      headers: {
        'x-auth-token': token,
        'x-client-id':  getUserClientId(),
        Accept:         'application/json',
      },
    });
    if (probe.status === 403) {
      const body = await probe.text();
      return res.status(400).json({
        enabled: false,
        error: 'Token tidak valid untuk User API environment saat ini',
        userEnv,
        probeUrl,
        upstream: body.slice(0, 200),
        hint:
          userEnv === 'prelive'
            ? 'Token HARUS dari Pre-Production (prelive-oauth2 / apis-prelive). Token production tidak bisa dipakai di prelive.'
            : 'Pastikan token diambil dari environment yang sama dengan QF_USER_ENV.',
      });
    }
  } catch (err) {
    console.warn('[auth] Demo token probe failed:', err.message);
  }

  console.log(`[auth] ✅ Demo juri session — userEnv=${userEnv}`);

  return res.json({
    enabled:      true,
    user: {
      name:    payload?.name || payload?.given_name || 'Demo Juri',
      email:   payload?.email || '',
      picture: payload?.picture || '',
    },
    access_token: token,
    source:       'qf',
    mode:         'demo',
    userEnv,
    expiresAt: expMs ? new Date(expMs).toISOString() : null,
  });
});

export default router;
