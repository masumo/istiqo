/**
 * OnboardingFlow.jsx
 *
 * Language is now chosen BEFORE login (LanguageSelectionScreen).
 * This flow handles only the post-login steps:
 *   Step 2 — Daily goal
 *   Step 3 — Notification time
 *
 * Progress bar reflects 2 steps (starts at 50%).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Step2Goal from './Step2Goal';
import Step3Notification from './Step3Notification';

const TOTAL_STEPS = 2;

const OnboardingFlow = ({ onComplete }) => {
  // Internal step 1 = Goal, step 2 = Notification
  const [step, setStep] = useState(1);

  const nextStep = () => setStep((s) => s + 1);
  const progressPercent = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">

        {/* Progress bar */}
        <div className="h-3 bg-slate-100 w-full flex">
          <motion.div
            className="h-full bg-emerald-500"
            initial={{ width: `${(1 / TOTAL_STEPS) * 100}%` }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Step content */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {step === 1 && <Step2Goal onNext={nextStep} />}
              {step === 2 && <Step3Notification onComplete={onComplete} />}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default OnboardingFlow;
