/**
 * server/routes/user.js
 *
 * Proxy layer for Quran Foundation User API.
 * Mounts at: /api/user
 *
 * The frontend sends its user auth token via Authorization header.
 * This server forwards it to the QF User API endpoint.
 *
 * Routes:
 *   GET  /api/user/streak
 *   POST /api/user/streak
 *   GET  /api/user/goals
 *   POST /api/user/goals
 *   POST /api/user/goals/progress
 *   GET  /api/user/goals/progress
 *   GET  /api/user/bookmarks
 *   POST /api/user/bookmarks
 *   DELETE /api/user/bookmarks/:id
 *   GET  /api/user/activity
 *   POST /api/user/activity
 */

import { Router } from 'express';

const router = Router();

const QF_USER_BASE = 'https://api.quran.com/api/v4/user';

/**
 * Extracts the Bearer token from the Authorization header.
 * Returns null if not present.
 */
function extractBearerToken(req) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

/**
 * Generic proxy for User API calls.
 * Requires a valid user token in Authorization header.
 */
async function proxyUserRequest(req, res, path, method = 'GET', body = null) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'User auth token required' });
  }

  const upstreamUrl = `${QF_USER_BASE}${path}`;

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(upstreamUrl, options);
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[user proxy] Error:', err.message);
    return res.status(502).json({ error: 'User API proxy error', detail: err.message });
  }
}

// ── Streak ────────────────────────────────────────────────────────────────────
router.get('/streak', (req, res) => proxyUserRequest(req, res, '/streak'));
router.post('/streak', (req, res) => proxyUserRequest(req, res, '/streak', 'POST'));

// ── Goals ─────────────────────────────────────────────────────────────────────
router.get('/goals', (req, res) => proxyUserRequest(req, res, '/goals'));
router.post('/goals', (req, res) =>
  proxyUserRequest(req, res, '/goals', 'POST', req.body)
);

// ── Goals Progress ────────────────────────────────────────────────────────────
router.get('/goals/progress', (req, res) =>
  proxyUserRequest(req, res, '/goals/progress')
);
router.post('/goals/progress', (req, res) =>
  proxyUserRequest(req, res, '/goals/progress', 'POST', req.body)
);

// ── Bookmarks ─────────────────────────────────────────────────────────────────
router.get('/bookmarks', (req, res) => proxyUserRequest(req, res, '/bookmarks'));
router.post('/bookmarks', (req, res) =>
  proxyUserRequest(req, res, '/bookmarks', 'POST', req.body)
);
router.delete('/bookmarks/:id', (req, res) =>
  proxyUserRequest(req, res, `/bookmarks/${req.params.id}`, 'DELETE')
);

// ── Activity ──────────────────────────────────────────────────────────────────
router.get('/activity', (req, res) => proxyUserRequest(req, res, '/activity'));
router.post('/activity', (req, res) =>
  proxyUserRequest(req, res, '/activity', 'POST', req.body)
);

export default router;
