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

const queryClient = new QueryClient();

function App() {
  const {
    isOnboarded,
    completeOnboarding,
    authStatus,
    hasPickedLanguage,
  } = useUserStore();

  const view = useVocabStore((s) => s.view);
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
