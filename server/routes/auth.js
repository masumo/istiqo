/**
 * server/routes/auth.js — Google credential → QF user access token
 *
 * POST {contentBase}/content/api/v4/user/auth/google
 * Headers: x-client-id + HTTP Basic (client_id:client_secret)
 * Body: { token: <Google ID token> }
 *
 * Jangan kirim x-auth-token (content token) ke endpoint ini — menyebabkan 404.
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

function googleAuthUrls() {
  const userEnv = getQFEnv('user');
  if (userEnv === 'production') {
    return [`${getContentBaseUrl()}/content/api/v4/user/auth/google`];
  }
  return [`https://apis-prelive.quran.foundation/content/api/v4/user/auth/google`];
}

function buildExchangeHeaders() {
  const clientId = process.env.QF_CLIENT_ID ?? '';
  const clientSecret = process.env.QF_CLIENT_SECRET ?? '';
  const headers = {
    'Content-Type': 'application/json',
    'x-client-id':  clientId,
  };

  if (clientId && clientSecret) {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers.Authorization = `Basic ${basic}`;
  }

  return headers;
}

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
  console.log(`[auth] Google exchange start (QF_USER_ENV=${userEnv})`);

  if (!process.env.QF_CLIENT_ID || !process.env.QF_CLIENT_SECRET) {
    console.error('[auth] QF_CLIENT_ID atau QF_CLIENT_SECRET belum di-set di .env');
  }

  const headers = buildExchangeHeaders();

  for (const url of googleAuthUrls()) {
    try {
      const qfResponse = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          token: credential,
          ...(googleClientId ? { client_id: googleClientId } : {}),
        }),
      });

      const text = await qfResponse.text();
      let data;
      try { data = JSON.parse(text); } catch { data = {}; }

      if (qfResponse.ok) {
        const token =
          data.access_token ||
          data.token ||
          data?.data?.access_token ||
          data?.data?.token ||
          null;
        console.log(`[auth] ✅ QF exchange OK via ${url} — token: ${token ? 'present' : 'missing'}`);
        return res.json({
          user:         data.user || data?.data?.user || data,
          access_token: token,
          source:       'qf',
        });
      }

      console.warn(`[auth] ${url} → ${qfResponse.status}:`, text.slice(0, 200));
    } catch (err) {
      console.warn(`[auth] ${url} failed:`, err.message);
    }
  }

  const payload = decodeGoogleJwt(credential);
  if (!payload) {
    return res.status(400).json({ error: 'Invalid Google credential' });
  }

  console.warn('[auth] ⚠️ QF exchange failed — activity API mode lokal');
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
        'Login ulang di prelive-oauth2.quran.foundation → Network tab → salin x-auth-token baru ke QF_DEMO_ACCESS_TOKEN',
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
