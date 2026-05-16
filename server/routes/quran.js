/**
 * server/routes/quran.js
 *
 * Proxy layer for Quran Foundation Content API.
 * Source: https://api-docs.quran.foundation/docs/quickstart/first-api-call
 *
 * Mounts at: /api/quran
 *
 * Required headers on every Content API request (per official docs):
 *   x-auth-token: <access_token from OAuth2>
 *   x-client-id:  <QF_CLIENT_ID>
 *
 * Upstream Content API base URLs (per official docs):
 *   QF_ENV=prelive    → https://apis-prelive.quran.foundation/content/api/v4
 *   QF_ENV=production → https://apis.quran.foundation/content/api/v4
 *
 * Retry behaviour:
 *   On 401 → invalidate cached token → re-fetch → retry once.
 *   On 403 → usually wrong scope (must be scope=content). Does NOT retry.
 *
 * Supported routes (mirrors api.quran.com/api/v4 path structure):
 *   GET /api/quran/chapters
 *   GET /api/quran/chapters/:id
 *   GET /api/quran/verses/by_chapter/:chapter
 *   GET /api/quran/verses/by_key/:ayahKey
 *   GET /api/quran/recitations/:recitationId/by_ayah/:ayahKey
 */

import { Router } from 'express';
import { getAccessToken, getContentBaseUrl, invalidateToken } from '../lib/quranAuth.js';

const router = Router();

// ── Auth header builder ────────────────────────────────────────────────────────

/**
 * Builds the two required Content API headers.
 * @param {string} token  The current access token.
 * @returns {Object}
 */
function buildContentHeaders(token) {
  return {
    'x-auth-token': token,
    'x-client-id':  process.env.QF_CLIENT_ID ?? '',
    Accept:          'application/json',
  };
}

// ── Generic proxy helper ───────────────────────────────────────────────────────

/**
 * Forwards a GET request to the QF Content API with proper auth headers.
 * Retries once on 401 (expired token).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {string} qfPath  Path relative to the Content API root, e.g. '/chapters'
 */
async function proxyToContentApi(req, res, qfPath) {
  // Build the full upstream URL — forward query params unchanged
  const queryString = new URLSearchParams(req.query).toString();
  const contentBase = getContentBaseUrl();
  const upstreamUrl = `${contentBase}/content/api/v4${qfPath}${queryString ? '?' + queryString : ''}`;

  const attempt = async (token) =>
    fetch(upstreamUrl, { headers: buildContentHeaders(token) });

  try {
    let token    = await getAccessToken();
    let response = await attempt(token);

    // 401 → token likely just expired; invalidate cache, re-fetch, retry once
    if (response.status === 401) {
      console.warn('[quran proxy] 401 — invalidating token and retrying once...');
      invalidateToken();
      token    = await getAccessToken();
      response = await attempt(token);
    }

    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('[quran proxy] Upstream returned non-JSON:', text.slice(0, 200));
      return res.status(response.status || 502).json({
        error: 'Upstream API error',
        message: 'The Quran API returned a non-JSON response.',
        status: response.status
      });
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[quran proxy] Execution error:', err.message);
    return res.status(500).json({
      error:  'Internal Server Error',
      message: err.message,
      path: qfPath
    });
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────
// These paths mirror api.quran.com/api/v4 so existing frontend fetch calls
// need no change beyond the BASE_URL switch (already done in quranApi.js).

/** GET /api/quran/chapters — verification endpoint per migration checklist */
router.get('/chapters', (req, res) => proxyToContentApi(req, res, '/chapters'));

/** GET /api/quran/chapters/:id */
router.get('/chapters/:id', (req, res) =>
  proxyToContentApi(req, res, `/chapters/${req.params.id}`)
);

/** GET /api/quran/verses/by_chapter/:chapter */
router.get('/verses/by_chapter/:chapter', (req, res) =>
  proxyToContentApi(req, res, `/verses/by_chapter/${req.params.chapter}`)
);

/** GET /api/quran/verses/by_key/:ayahKey  (e.g. 1:1) */
router.get('/verses/by_key/:ayahKey', (req, res) =>
  proxyToContentApi(req, res, `/verses/by_key/${req.params.ayahKey}`)
);

/** GET /api/quran/recitations/:recitationId/by_ayah/:ayahKey */
router.get('/recitations/:recitationId/by_ayah/:ayahKey', (req, res) =>
  proxyToContentApi(
    req,
    res,
    `/recitations/${req.params.recitationId}/by_ayah/${req.params.ayahKey}`
  )
);

/** Catch-all: forward any other /api/quran/* paths generically */
router.get('/*path', (req, res) => proxyToContentApi(req, res, req.path));

export default router;
