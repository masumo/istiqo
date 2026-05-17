import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useUserStore } from './store/userStore';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import LanguageSelectionScreen from './components/Onboarding/LanguageSelectionScreen';
import SplashScreen from './components/SplashScreen/SplashScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';

import Learn from './pages/Learn';
import Home from './pages/Home';
import { useVocabStore } from './store/vocabStore';
import LoginScreen from './components/Auth/LoginScreen';
import { useQFUserSession } from './hooks/useQFUserSession';

const queryClient = new QueryClient();

function AppInner() {
  const {
    isOnboarded,
    completeOnboarding,
    authStatus,
    hasPickedLanguage,
  } = useUserStore();

  const view = useVocabStore((s) => s.view);
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useQFUserSession();

  const setUser = useUserStore((s) => s.setUser);
  const setAuthSession = useUserStore((s) => s.setAuthSession);

  useEffect(() => {
    const { authSource, allowUserApiCalls } = useUserStore.getState();
    if (allowUserApiCalls && authSource !== 'qf') {
      useUserStore.setState({ allowUserApiCalls: false, authToken: null, authSource: null });
    }
  }, []);

  // Handle redirect from /api/auth/qf/callback (#access_token=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = params.get('access_token');
    const source = params.get('source');
    if (!token || source !== 'qf') return;

    setUser({
      name:    params.get('name')    || '',
      email:   params.get('email')   || '',
      picture: params.get('picture') || '',
    });
    setAuthSession({ token, source: 'qf' });
    console.log('%c[Auth] ✅ QF OAuth login — Activity API aktif', 'color:#16a34a;font-weight:bold');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [setUser, setAuthSession]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('qf_auth_error');
    if (err) {
      console.warn('[Auth] QF OAuth error:', err);
      sessionStorage.setItem('qf_auth_error', err);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!showSplash) setAppReady(true);
  }, [showSplash]);

  /**
   * New flow:
   *   Splash → LanguageSelectionScreen → LoginScreen → OnboardingFlow (steps 2+3) → App
   *
   * Guard: `hasPickedLanguage` is false on first install (never set).
   *         After language selection, setLanguage() sets it to true.
   */
  const renderScreen = () => {
    // 1. Language not yet chosen → always send here first
    if (!hasPickedLanguage) return <LanguageSelectionScreen />;

    // 2. Language chosen but not authenticated/guest yet → Login
    if (authStatus === 'pending') return <LoginScreen />;

    // 3. Authenticated/guest but onboarding not finished → goal + notification steps
    if (!isOnboarded) return <OnboardingFlow onComplete={completeOnboarding} />;

    // 4. Fully set up → main app
    return view === 'learn' ? <Learn /> : <Home />;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Splash always renders on top as a fixed overlay */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {/* Main content — rendered beneath splash, visible once splash exits */}
      <AnimatePresence mode="wait">
        {!showSplash && appReady && (
          <div key={
            !hasPickedLanguage ? 'lang'
              : authStatus === 'pending' ? 'login'
              : !isOnboarded ? 'onboard'
              : 'app'
          }>
            {renderScreen()}
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    console.error(
      '[Auth] VITE_GOOGLE_CLIENT_ID tidak ada di .env — Google Login tidak akan berfungsi.'
    );
  }
  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
