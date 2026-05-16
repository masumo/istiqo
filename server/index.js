/**
 * server/index.js — Istiqo Backend API Server
 *
 * Responsibilities:
 *   - Serve /api/quran/* → Quran Foundation Content API (OAuth2 client credentials)
 *   - Serve /api/user/*  → Quran Foundation User API   (user bearer token forwarded)
 *   - Serve /api/auth/*  → Google auth exchange         (never exposes client_secret)
 *
 * In development: Vite dev server (port 5173) proxies /api → this server (port 3001)
 * In production:  This server also serves the built Vite dist/ as static files
 */

import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

import quranRoutes from './routes/quran.js';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.API_PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(express.json());

// CORS for Vite dev server in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });
}

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/quran', quranRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const env = process.env.QF_ENV ?? 'prelive';
  const AUTH_BASE = {
    prelive:    'https://prelive-oauth2.quran.foundation',
    production: 'https://oauth2.quran.foundation',
  };
  const CONTENT_BASE = {
    prelive:    'https://apis-prelive.quran.foundation',
    production: 'https://apis.quran.foundation',
  };
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      qfEnv:          env,
      hasClientId:    Boolean(process.env.QF_CLIENT_ID),
      hasClientSecret: Boolean(process.env.QF_CLIENT_SECRET),
      authBaseUrl:    AUTH_BASE[env]    ?? '(unknown QF_ENV)',
      contentBaseUrl: CONTENT_BASE[env] ?? '(unknown QF_ENV)',
    },
  });
});

// ── Production: serve Vite build (Skip on Vercel) ───────────────────────────────
// On Vercel, the frontend is served as static files from the CDN.
// This logic is only needed for local production testing or other platforms.
if (process.env.NODE_ENV === 'production' && existsSync(distPath) && !process.env.VERCEL) {
  app.use(express.static(distPath));
  // SPA fallback: all non-/api routes → index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
}

// ── Export for Vercel ─────────────────────────────────────────────────────────
export default app;

// ── Start (Only if running locally) ──────────────────────────────────────────
// Vercel handles the serverless execution, so we don't call .listen() there.
if (process.env.NODE_ENV !== 'production' || process.env.RUN_LOCAL === 'true') {
  app.listen(PORT, () => {
    const qfEnv = process.env.QF_ENV ?? 'prelive';
    const AUTH_BASE    = { prelive: 'https://prelive-oauth2.quran.foundation', production: 'https://oauth2.quran.foundation' };
    const CONTENT_BASE = { prelive: 'https://apis-prelive.quran.foundation',   production: 'https://apis.quran.foundation' };

    console.log(`\n🕌  Istiqo API Server`);
    console.log(`   ├─ Running at:   http://localhost:${PORT}`);
    console.log(`   ├─ QF_ENV:       ${qfEnv}`);
    console.log(`   ├─ Auth URL:     ${AUTH_BASE[qfEnv] ?? '(invalid QF_ENV)'}`);
    console.log(`   ├─ Content URL:  ${CONTENT_BASE[qfEnv] ?? '(invalid QF_ENV)'}`);
    console.log(`   ├─ Client ID:    ${process.env.QF_CLIENT_ID    ? '✓ set' : '✗ MISSING'}`);
    console.log(`   └─ Client Secret: ${process.env.QF_CLIENT_SECRET ? '✓ set' : '✗ MISSING'}\n`);
  });
}
