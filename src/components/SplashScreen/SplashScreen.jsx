import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NurMascot from '../NurMascot/NurMascot';

const SplashScreen = ({ onComplete, duration = 2500 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(completeTimer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
           initial={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.5 }}
           className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center gap-6"
          >
            <NurMascot mood="celebrate" size={180} sparkles={false} />
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
              className="text-5xl font-bold text-[#58CC02] tracking-[0.2em]"
              style={{ fontFamily: 'sans-serif' }}
            >
              Istiqo
            </motion.h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
