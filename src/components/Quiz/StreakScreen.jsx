import React from 'react';
import { motion } from 'framer-motion';
import NurMascot from '../NurMascot/NurMascot';

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const StreakScreen = ({ streak, onDone, lang = 'id' }) => {
  const todayIdx = new Date().getDay();
  const isEn = lang === 'en';
  
  const days = isEn ? DAYS_EN : DAYS_ID;
  const daysText = isEn ? 'day streak! 🔥' : 'hari berturut-turut! 🔥';
  const subtitle = isEn 
    ? 'Keep up your consistency — Nur is always with you!' 
    : 'Terus jaga konsistensimu — Nur selalu menemanimu!';
  const warningText = isEn 
    ? 'Your streak will be lost if you skip tomorrow. Keep it up! 💪' 
    : 'Streakmu akan hilang jika kamu melewatkan hari esok. Jaga ya! 💪';
  const buttonText = isEn ? 'I Commit! 🔥' : 'Aku Berkomitmen! 🔥';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-lg min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col items-center justify-center p-8 text-center space-y-8"
    >
      <NurMascot animateType="spring" size={200} />

      <div className="space-y-3">
        <div className="text-7xl font-black text-orange-500">{streak}</div>
        <div className="text-2xl font-extrabold text-slate-800">
          {daysText}
        </div>
        <p className="text-slate-600 text-sm">
          {subtitle}
        </p>
      </div>

      {/* Weekly tracker */}
      <div className="w-full max-w-xs bg-slate-800 rounded-3xl p-5 border border-slate-700">
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {days.map((d, i) => (
            <div key={d} className="flex flex-col items-center gap-1.5">
              <span className={`text-xs font-bold ${i === todayIdx ? 'text-amber-400' : 'text-slate-500'}`}>{d}</span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  i === todayIdx
                    ? 'bg-orange-500 border-orange-400'
                    : 'bg-slate-700 border-slate-600'
                }`}
              >
                {i === todayIdx && <span className="text-white text-sm font-black">✓</span>}
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-400 text-xs mt-2">
          {warningText}
        </p>
      </div>

      <button
        id="streak-done-btn"
        onClick={onDone}
        className="w-full max-w-xs py-5 bg-orange-500 text-white rounded-3xl font-extrabold text-xl shadow-2xl shadow-orange-500/30 hover:bg-orange-400 active:scale-95 transition-all"
      >
        {buttonText}
      </button>
    </motion.div>
  );
};

export default StreakScreen;
