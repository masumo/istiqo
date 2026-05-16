/**
 * LanguageSelectionScreen.jsx
 *
 * New first screen after Splash. User picks their language here,
 * which is saved to userStore and then App.jsx transitions to LoginScreen.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import NurMascot from '../NurMascot/NurMascot';

const LANGS = [
  { code: 'id', flag: '🇮🇩', label: 'Bahasa Indonesia' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

const LanguageSelectionScreen = () => {
  const setLanguage = useUserStore((s) => s.setLanguage);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#F6F3E6] flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-sm flex flex-col items-center space-y-8
                      bg-white p-8 rounded-3xl shadow-xl border-b-[6px] border-slate-200">

        {/* Mascot */}
        <NurMascot animateType="floating" size={130} />

        {/* Heading */}
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-black text-slate-800">Istiqo</h1>
          <p className="text-sm font-semibold text-slate-500">
            Choose your language / Pilih bahasa kamu
          </p>
        </div>

        {/* Language buttons */}
        <div className="w-full flex flex-col gap-4">
          {LANGS.map(({ code, flag, label }, i) => (
            <motion.button
              key={code}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLanguage(code)}
              className="flex items-center gap-4 w-full px-6 py-4
                         bg-slate-50 rounded-2xl border-2 border-b-4 border-slate-200
                         hover:border-[#58CC02] hover:bg-green-50
                         transition-colors font-bold text-slate-700 text-lg shadow-sm"
            >
              <span className="text-4xl">{flag}</span>
              <span>{label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default LanguageSelectionScreen;
