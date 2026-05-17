import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Step2Goal from './Step2Goal';
import Step3Notification from './Step3Notification';

const TOTAL_STEPS = 2;

const OnboardingFlow = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const nextStep = () => setStep((s) => s + 1);
  const progressPercent = (step / TOTAL_STEPS) * 100;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: '#F6F3E6' }}
    >
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Progress bar */}
        <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#58CC02' }}
            initial={{ width: `${(1 / TOTAL_STEPS) * 100}%` }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Step content */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
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
