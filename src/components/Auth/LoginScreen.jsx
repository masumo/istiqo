/**
 * LoginScreen.jsx — Secure Auth Flow (bilingual)
 *
 * Text is driven by preferredLanguage set on the Language Selection screen.
 *
 * Auth flow:
 *   1. User clicks Google Login → Google returns credential (JWT)
 *   2. Frontend sends credential to POST /api/auth/google (backend)
 *   3. Backend does QF exchange; falls back to JWT decode on failure
 *   4. Frontend stores { user, access_token } in Zustand
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import NurMascot from '../NurMascot/NurMascot';
import { useUserStore } from '../../store/userStore';
import { handleGoogleLogin } from '../../auth/googleAuth';
import { startQFLogin } from '../../auth/qfOAuthLogin';
import { loginAsDemoJudge } from '../../auth/demoLogin';

// ── Bilingual UI strings ───────────────────────────────────────────────────────
const STRINGS = {
  id: {
    subtitle: 'Mulai perjalanan Qurani kamu hari ini!',
    qfBtn: 'Masuk dengan Quran Foundation',
    qfHint: 'Wajib untuk Activity API hackathon',
    oauthUriLabel: 'Redirect URI (minta didaftarkan ke panitia QF):',
    guestBtn: 'Coba Tanpa Login',
    demoBtn: 'Mode Demo Juri',
    demoHint: 'Activity API aktif tanpa OAuth (token di server)',
    orDivider: 'ATAU',
    loading: 'Memproses login...',
    oauthBlockedTitle: 'Login QF gagal: redirect URI belum terdaftar',
    oauthBlockedBody:
      'Panitia QF harus mendaftarkan URL callback ini untuk Client ID Pre-Production Anda. Coba ubah QF_REDIRECT_URI di .env ke alternatif di bawah, restart server, lalu coba lagi.',
    oauthEmail: 'Email ke Hackathon@quran.com',
  },
  en: {
    subtitle: 'Start your Quranic journey today!',
    qfBtn: 'Sign in with Quran Foundation',
    qfHint: 'Required for hackathon Activity API',
    oauthUriLabel: 'Redirect URI (ask QF organizers to register):',
    guestBtn: 'Try Without Login',
    demoBtn: 'Judge Demo Mode',
    demoHint: 'Activity API without OAuth (token on server)',
    orDivider: 'OR',
    loading: 'Signing in...',
    oauthBlockedTitle: 'QF login failed: redirect URI not registered',
    oauthBlockedBody:
      'QF organizers must register this callback URL for your Pre-Production Client ID. Try changing QF_REDIRECT_URI in .env to an alternative below, restart the server, and try again.',
    oauthEmail: 'Email Hackathon@quran.com',
  },
};

const LoginScreen = () => {
  const { setUser, setAuthSession, setGuestMode, preferredLanguage } = useUserStore();

  const lang = preferredLanguage === 'en' ? 'en' : 'id';
  const s = STRINGS[lang];

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [oauthSetup, setOauthSetup] = useState(null);

  useEffect(() => {
    const oauthErr = sessionStorage.getItem('qf_auth_error');
    if (oauthErr) {
      sessionStorage.removeItem('qf_auth_error');
      setError(oauthErr);
    }
    fetch('/api/auth/qf/setup')
      .then((r) => (r.ok ? r.json() : null))
      .then(setOauthSetup)
      .catch(() => {});
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await handleGoogleLogin(credentialResponse);
      setUser({
        name:    data.user?.name    ?? '',
        email:   data.user?.email   ?? '',
        picture: data.user?.picture ?? '',
      });
      setAuthSession({
        token: data.access_token && data.source === 'qf' ? data.access_token : null,
        source: data.source === 'qf' ? 'qf' : 'local_only',
      });
      if (data.source === 'qf' && data.access_token) {
        console.log('%c[Auth] ✅ QF token OK — Activity API aktif', 'color:#16a34a;font-weight:bold');
      } else {
        console.warn(
          '%c[Auth] ⚠️ QF token gagal — streak/XP tetap lokal. Cek terminal server: [auth] ✅',
          'color:#d97706;font-weight:bold'
        );
      }
    } catch (err) {
      console.error('[LoginScreen] Auth error:', err);
      setError(lang === 'en' ? 'Login failed. Please try again.' : 'Login gagal. Coba lagi.');
      setGuestMode();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(
      lang === 'en'
        ? 'Google Login failed. Check your connection.'
        : 'Google Login gagal. Periksa koneksi kamu.'
    );
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loginAsDemoJudge();
      setUser({
        name:    data.user?.name    ?? '',
        email:   data.user?.email   ?? '',
        picture: data.user?.picture ?? '',
      });
      setAuthSession({
        token: data.access_token,
        source: data.source === 'qf' ? 'qf' : 'local_only',
      });
      console.log('%c[Auth] ✅ Demo juri — Activity API aktif', 'color:#d97706;font-weight:bold');
    } catch (err) {
      console.error('[Auth] Demo login failed:', err);
      setError(err.message || (lang === 'en' ? 'Demo login failed' : 'Login demo gagal'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-[#F6F3E6] flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="w-full max-w-sm flex flex-col items-center space-y-8
                      bg-white p-8 rounded-3xl shadow-xl border-b-[6px] border-slate-200">

        {/* Mascot — gentle floating animation */}
        <NurMascot animateType="floating" size={150} />

        {/* Title + Subtitle */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-800">Istiqo</h1>
          <p className="text-sm font-bold text-slate-500">{s.subtitle}</p>
        </div>

        {/* Auth area */}
        <div className="w-full flex flex-col space-y-4 pt-2">

          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3 text-left space-y-2"
            >
              {oauthSetup && /token_exchange|invalid_state|server_error/.test(String(error)) ? (
                <p className="font-semibold">
                  {lang === 'en' ? 'QF login failed: ' : 'Login QF gagal: '}
                  {error}
                </p>
              ) : oauthSetup ? (
                <>
                  <p className="font-bold">{s.oauthBlockedTitle}</p>
                  <p className="text-xs font-medium">{s.oauthBlockedBody}</p>
                  <p className="text-xs">
                    <span className="font-bold">redirect_uri sekarang:</span>
                    <code className="block mt-1 break-all bg-white/80 px-2 py-1 rounded">
                      {oauthSetup.redirectUri}
                    </code>
                  </p>
                  <p className="text-xs font-bold">{s.oauthEmail}</p>
                  <p className="text-xs text-red-600/90">
                    Daftarkan salah satu (exact):
                    <ul className="list-disc ml-4 mt-1">
                      {(oauthSetup.alternatives || []).map((u) => (
                        <li key={u}>
                          <code className="break-all">{u}</code>
                        </li>
                      ))}
                    </ul>
                  </p>
                </>
              ) : (
                <p className="font-semibold">{error}</p>
              )}
            </motion.div>
          )}

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => startQFLogin()}
            disabled={isLoading}
            className="w-full py-3.5 bg-emerald-600 text-white rounded-full font-bold
                       border-2 border-b-4 border-emerald-700 hover:bg-emerald-700
                       transition-colors disabled:opacity-50"
          >
            {s.qfBtn}
          </motion.button>
          <p className="text-xs text-emerald-700 font-medium -mt-2">{s.qfHint}</p>
          {oauthSetup?.redirectUri && (
            <p className="text-xs text-slate-500 text-left -mt-1 px-1">
              {s.oauthUriLabel}
              <code className="block mt-1 break-all bg-slate-50 rounded px-2 py-1 border border-slate-200">
                {oauthSetup.redirectUri}
              </code>
            </p>
          )}

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full py-3.5 bg-amber-500 text-white rounded-full font-bold
                       border-2 border-b-4 border-amber-600 hover:bg-amber-600
                       transition-colors disabled:opacity-50"
          >
            {s.demoBtn}
          </motion.button>
          <p className="text-xs text-amber-800 font-medium -mt-2">{s.demoHint}</p>

          {/* Google Login */}
          <motion.div className="w-full flex justify-center">
            {isLoading ? (
              <div className="py-3 text-slate-500 text-sm font-semibold animate-pulse">
                {s.loading}
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                shape="pill"
                theme="outline"
                text="continue_with"
                width="300"
              />
            )}
          </motion.div>

          {/* Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold tracking-wider">
              {s.orDivider}
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Guest button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setGuestMode()}
            disabled={isLoading}
            className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-full font-bold
                       border-2 border-b-4 border-slate-200 hover:bg-slate-200
                       transition-colors disabled:opacity-50"
          >
            {s.guestBtn}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginScreen;
