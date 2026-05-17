import React from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../store/userStore';

const C = {
  green: '#58CC02', greenDark: '#46A302',
  teal: '#37607D', tealDark: '#2A4B63',
  bg: '#F6F3E6',
};

const btn3d = 'border-2 border-b-[6px] rounded-2xl active:border-b-2 active:translate-y-[4px] transition-all select-none';

const Step1Language = ({ onNext }) => {
  const { setLanguage } = useUserStore();

  const handleSelect = (lang) => {
    setLanguage(lang);
    onNext();
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: C.bg }}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        {/* Logo / title */}
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: C.teal }}>Istiqo</h1>
          <p className="text-sm font-medium text-slate-500">Pilih bahasa / Choose language</p>
        </div>

        {/* Language options */}
        <div className="w-full flex flex-col gap-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect('id')}
            className={`w-full flex items-center gap-4 px-6 py-5 bg-white text-slate-800 ${btn3d}`}
            style={{ borderColor: C.tealDark }}
          >
            <span className="text-3xl">🇮🇩</span>
            <div className="text-left">
              <div className="text-base font-black" style={{ color: C.teal }}>Bahasa Indonesia</div>
              <div className="text-xs font-medium text-slate-400">Terjemahan Indonesia</div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect('en')}
            className={`w-full flex items-center gap-4 px-6 py-5 bg-white text-slate-800 ${btn3d}`}
            style={{ borderColor: C.tealDark }}
          >
            <span className="text-3xl">🇬🇧</span>
            <div className="text-left">
              <div className="text-base font-black" style={{ color: C.teal }}>English</div>
              <div className="text-xs font-medium text-slate-400">English translation</div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Step1Language;
