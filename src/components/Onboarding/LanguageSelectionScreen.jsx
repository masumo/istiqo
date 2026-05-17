import React from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import NurMascot from '../NurMascot/NurMascot';

const C = {
  green: '#58CC02', greenDark: '#46A302',
  teal: '#37607D', tealDark: '#2A4B63',
  bg: '#F6F3E6',
};

const LANGS = [
  { code: 'id', flag: '🇮🇩', label: 'Bahasa Indonesia', sub: 'Terjemahan Indonesia' },
  { code: 'en', flag: '🇬🇧', label: 'English',          sub: 'English translation' },
];

const LanguageSelectionScreen = () => {
  const setLanguage = useUserStore((s) => s.setLanguage);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: C.bg }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Mascot + heading */}
        <div className="flex flex-col items-center gap-3">
          <NurMascot animateType="floating" size={120} />
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight" style={{ color: C.teal }}>Istiqo</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Choose your language · Pilih bahasa kamu
            </p>
          </div>
        </div>

        {/* Language buttons */}
        <div className="w-full flex flex-col gap-4">
          {LANGS.map(({ code, flag, label, sub }, i) => (
            <motion.button
              key={code}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLanguage(code)}
              className="flex items-center gap-4 w-full px-6 py-4 bg-white rounded-2xl border-2 border-b-[6px] transition-all select-none active:border-b-2 active:translate-y-[4px]"
              style={{ borderColor: C.tealDark }}
            >
              <span className="text-3xl">{flag}</span>
              <div className="text-left">
                <div className="text-sm font-black" style={{ color: C.teal }}>{label}</div>
                <div className="text-xs font-medium text-slate-400">{sub}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default LanguageSelectionScreen;
