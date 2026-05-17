/**
 * QF OAuth2 Authorization Code + PKCE (prelive / production)
 * Docs: https://api-docs.quran.foundation/docs/tutorials/oidc/getting-started-with-oauth2/
 */

import { Router } from 'express';
import crypto from 'crypto';
import { AUTH_BASE_BY_ENV, getQFEnv } from '../lib/qfEnv.js';

const router = Router();

const pkceStore = new Map();
const PKCE_TTL_MS = 10 * 60 * 1000;

function base64url(buf) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function getConfig() {
  const env = getQFEnv('user');
  return {
    env,
    authBaseUrl: AUTH_BASE_BY_ENV[env],
    clientId:     process.env.QF_CLIENT_ID ?? '',
    clientSecret: process.env.QF_CLIENT_SECRET ?? '',
    redirectUri:
      process.env.QF_REDIRECT_URI ?? 'http://localhost:3001/api/auth/qf/callback',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    scopes:
      process.env.QF_OAUTH_SCOPES ??
      'openid offline_access activity_day user',
  };
}

function decodeJwtPayload(jwt) {
  try {
    const [, payload] = jwt.split('.');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

function prunePkce() {
  const now = Date.now();
  for (const [key, val] of pkceStore) {
    if (now - val.at > PKCE_TTL_MS) pkceStore.delete(key);
  }
}

/** GET /api/auth/qf/setup — info redirect URI untuk didaftarkan ke panitia QF */
router.get('/setup', (_req, res) => {
  const cfg = getConfig();
  const port5173 = 'http://localhost:5173/api/auth/qf/callback';
  const port3001 = 'http://localhost:3001/api/auth/qf/callback';
  res.json({
    userEnv:      cfg.env,
    clientId:     cfg.clientId ? `${cfg.clientId.slice(0, 8)}…` : null,
    redirectUri:  cfg.redirectUri,
    frontendUrl:  cfg.frontendUrl,
    scopes:       cfg.scopes,
  alternatives: [port5173, port3001],
    hint:
      'Email Hackathon@quran.com: minta daftarkan redirectUri (atau alternatives) untuk Pre-Production Client ID Anda. Harus exact match (localhost vs 127.0.0.1 beda).',
  });
});

/** GET /api/auth/qf/login */
router.get('/login', (req, res) => {
  const cfg = getConfig();
  if (!cfg.clientId || !cfg.clientSecret) {
    return res.status(500).send('QF_CLIENT_ID / QF_CLIENT_SECRET belum di-set di .env');
  }

  prunePkce();
  const state = base64url(crypto.randomBytes(24));
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(
    crypto.createHash('sha256').update(codeVerifier).digest()
  );
  pkceStore.set(state, { codeVerifier, at: Date.now() });

  const params = new URLSearchParams({
    response_type:         'code',
    client_id:             cfg.clientId,
    redirect_uri:          cfg.redirectUri,
    scope:                 cfg.scopes,
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
  });

  console.log(
    `[qf-oauth] Redirect login env=${cfg.env} redirect_uri=${cfg.redirectUri}`
  );
  res.redirect(`${cfg.authBaseUrl}/oauth2/auth?${params}`);
});

/** GET /api/auth/qf/callback */
router.get('/callback', async (req, res) => {
  const cfg = getConfig();
  const { code, state, error, error_description: errorDesc } = req.query;

  if (error) {
    console.warn('[qf-oauth] Provider error:', error, errorDesc || '');
    return res.redirect(
      `${cfg.frontendUrl}/?qf_auth_error=${encodeURIComponent(String(error))}`
    );
  }

  if (!code || !state) {
    return res.redirect(`${cfg.frontendUrl}/?qf_auth_error=missing_code`);
  }

  const entry = pkceStore.get(state);
  pkceStore.delete(state);
  if (!entry) {
    return res.redirect(`${cfg.frontendUrl}/?qf_auth_error=invalid_state`);
  }

  try {
    const body = new URLSearchParams({
      grant_type:    'authorization_code',
      code:          String(code),
      redirect_uri:  cfg.redirectUri,
      code_verifier: entry.codeVerifier,
    });

    const tokenRes = await fetch(`${cfg.authBaseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:  `Basic ${Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64')}`,
      },
      body,
    });

    const text = await tokenRes.text();
    let data;
    try { data = JSON.parse(text); } catch { data = {}; }

    if (!tokenRes.ok) {
      console.error('[qf-oauth] Token exchange failed:', tokenRes.status, text.slice(0, 300));
      return res.redirect(
        `${cfg.frontendUrl}/?qf_auth_error=token_exchange_failed`
      );
    }

    const accessToken = data.access_token;
    if (!accessToken) {
      return res.redirect(`${cfg.frontendUrl}/?qf_auth_error=no_access_token`);
    }

    const idPayload = data.id_token ? decodeJwtPayload(data.id_token) : null;
    const name =
      idPayload?.name ||
      [idPayload?.given_name, idPayload?.family_name].filter(Boolean).join(' ') ||
      '';
    const email = idPayload?.email || '';
    const picture = idPayload?.picture || '';

    console.log('[qf-oauth] ✅ Token exchange OK — Activity API dapat digunakan');

    const hash = new URLSearchParams({
      access_token: accessToken,
      source:       'qf',
      name,
      email,
      picture,
    });

    res.redirect(`${cfg.frontendUrl}/#${hash.toString()}`);
  } catch (err) {
    console.error('[qf-oauth] Callback error:', err.message);
    res.redirect(`${cfg.frontendUrl}/?qf_auth_error=server_error`);
  }
});

export default router;
