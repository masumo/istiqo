import React from 'react';
import { useUserStore } from './store/userStore';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';

import Learn from './pages/Learn';
import Home from './pages/Home';
import { useVocabStore } from './store/vocabStore';

const queryClient = new QueryClient();

function App() {
  const { isOnboarded, completeOnboarding } = useUserStore();
  const view = useVocabStore((s) => s.view);

  return (
    <GoogleOAuthProvider clientId="MOCK_CLIENT_ID">
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-slate-50 font-sans">
          {!isOnboarded ? (
            <OnboardingFlow onComplete={completeOnboarding} />
          ) : (
            <>
              {view === 'learn' ? <Learn /> : <Home />}
            </>
          )}
        </div>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
