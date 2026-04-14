import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Step1Language from './Step1Language';
import Step2Goal from './Step2Goal';
import Step3Notification from './Step3Notification';

const OnboardingFlow = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const MotionDiv = motion.div;

  const nextStep = () => setStep(step + 1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">
        <div className="h-3 bg-slate-100 w-full flex">
          <MotionDiv
            className="h-full bg-emerald-500"
            initial={{ width: '33.33%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <MotionDiv
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {step === 1 && <Step1Language onNext={nextStep} />}
              {step === 2 && <Step2Goal onNext={nextStep} />}
              {step === 3 && <Step3Notification onComplete={onComplete} />}
            </MotionDiv>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
