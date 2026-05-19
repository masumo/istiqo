/**
 * server/routes/user.js — Quran Foundation User API proxy (activity days only)
 *
 * Docs: https://api-docs.quran.foundation/docs/user_related_apis_versioned/add-update-activity-day/
 *
 * Base: https://apis[-prelive].quran.foundation/api
 * Headers: Authorization (Bearer), x-client-id, x-timezone (optional)
 */

import { Router } from 'express';
import { getUserAuthBaseUrl, getUserClientId, getQFEnv } from '../lib/qfEnv.js';

const router = Router();

function getUserApiBase() {
  return getUserAuthBaseUrl();
}

function extractBearerToken(req) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

async function proxyUserRequest(req, res, path, method = 'GET', body = null) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'User auth token required' });
  }

  const upstreamUrl = `${getUserApiBase()}${path}`;

  const options = {
    method,
    headers: {
      Authorization:   `Bearer ${token}`,
      'x-client-id':   getUserClientId(),
      'x-timezone':    req.headers['x-timezone'] || 'UTC',
      'Content-Type':  'application/json',
      Accept:          'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(upstreamUrl, options);
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!response.ok) {
      console.error(`[user proxy] ${method} ${upstreamUrl} → ${response.status}:`, text.slice(0, 300));
      if (response.status === 403 && data?.type === 'invalid_token') {
        const userEnv = getQFEnv('user');
        console.error(
          `[user proxy] ⚠️ Token tidak cocok dengan userEnv=${userEnv}. ` +
            (userEnv === 'prelive'
              ? 'Ambil QF_DEMO_ACCESS_TOKEN dari prelive-oauth2 / apis-prelive — BUKAN production.'
              : 'Pastikan token dari environment yang sama.')
        );
      }
    }
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[user proxy] Fetch error:', err.message, '→', upstreamUrl);
    return res.status(502).json({ error: 'User API proxy error', detail: err.message });
  }
}

// ── Activity Days ─────────────────────────────────────────────────────────────
router.get('/activity-days', (req, res) => proxyUserRequest(req, res, '/v1/user/activity_days'));

router.post('/activity-days', (req, res) =>
  proxyUserRequest(req, res, '/v1/user/activity_days', 'POST', req.body)
);

// Legacy alias used by older client paths
router.post('/activity', (req, res) =>
  proxyUserRequest(req, res, '/v1/user/activity_days', 'POST', req.body)
);

export default router;
