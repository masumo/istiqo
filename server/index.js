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
import qfOAuthRoutes from './routes/qfOAuth.js';
import { getEnvSummary } from './lib/qfEnv.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.API_PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(express.json());

// CORS for Vite dev server in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-timezone');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });
}

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/quran', quranRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/qf', qfOAuthRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const summary = getEnvSummary();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      ...summary,
      hasClientId:     Boolean(process.env.QF_CLIENT_ID),
      hasClientSecret: Boolean(process.env.QF_CLIENT_SECRET),
      hasContentCreds: Boolean(
        process.env.QF_CONTENT_CLIENT_ID || process.env.QF_CLIENT_ID
      ),
      oauthRedirect: process.env.QF_REDIRECT_URI ?? '(not set)',
      hasDemoToken:  Boolean(process.env.QF_DEMO_ACCESS_TOKEN),
      hint: summary.split
        ? `Split env: content=${summary.contentEnv}, user=${summary.userEnv} — demo token harus dari ${summary.userEnv}`
        : summary.userEnv === 'prelive'
          ? 'Pre-Production: User API + Activity API OK untuk hackathon'
          : 'Production: user/auth mungkin tidak aktif — set QF_USER_ENV=prelive',
    },
  });
});

// ── Production: serve Vite build (Skip on Vercel) ───────────────────────────────
// On Vercel, the frontend is served as static files from the CDN.
const distPath = join(__dirname, '..', 'dist');
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
    const s = getEnvSummary();

    console.log(`\n🕌  Istiqo API Server`);
    console.log(`   ├─ Running at:    http://localhost:${PORT}`);
    console.log(`   ├─ Content env:   ${s.contentEnv}  → ${s.contentBaseUrl}`);
    console.log(`   ├─ User env:      ${s.userEnv}  → ${s.userAuthBaseUrl}`);
    console.log(`   ├─ OAuth (user):  ${s.authBaseUrl}`);
    console.log(`   ├─ Client ID:     ${process.env.QF_CLIENT_ID ? '✓ set' : '✗ MISSING'}`);
    console.log(`   └─ Demo token:    ${process.env.QF_DEMO_ACCESS_TOKEN ? '✓ set' : '(optional)'}\n`);
  });
}
