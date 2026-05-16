import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getTranslation } from '../../utils/i18n';
import { getUIString } from '../../store/userStore';
import NurMascot from '../NurMascot/NurMascot';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  green: '#58CC02', greenDark: '#46A302',
  bg: '#F6F3E6',
  doneGreen: '#D7FFB1', doneBorder: '#218151',
  amber: '#F59E0B', amberLight: '#FEF3C7',
  teal: '#37607D', tealLight: '#E8F0F5',
};

const btn3d = 'border-2 border-b-[6px] rounded-2xl active:border-b-2 active:translate-y-[4px] transition-all select-none cursor-pointer';

const formatMMSS = (secs) => {
  const m = String(Math.floor((secs || 0) / 60)).padStart(2, '0');
  const s = String((secs || 0) % 60).padStart(2, '0');
  return `${m}:${s}`;
};



// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ emoji, value, label, bgColor, borderColor, textColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 200 }}
    className="flex flex-col items-center gap-1.5 rounded-2xl p-4 border-2 border-b-[6px] bg-white"
    style={{ borderColor }}
  >
    <span className="text-2xl leading-none">{emoji}</span>
    <span className="text-2xl font-black" style={{ color: textColor }}>{value}</span>
    <span className="text-[10px] uppercase tracking-widest font-bold text-center leading-tight" style={{ color: textColor, opacity: 0.7 }}>{label}</span>
  </motion.div>
);

// ─── Result Screen ────────────────────────────────────────────────────────────
const ResultScreen = ({ score, total, xpEarned, wordsCount, durationSecs, onContinue, lang }) => {
  const T = (k) => getTranslation(lang, k);
  const s = (k) => getUIString(lang, k);
  const isPerfect = score >= total;

  // Celebratory confetti burst on mount
  useEffect(() => {
    // Initial big burst
    const burst = (origin) =>
      confetti({
        particleCount: 90,
        spread: 120,
        startVelocity: 45,
        origin,
        colors: ['#58CC02', '#FFD700', '#37607D', '#FF6B6B', '#A78BFA', '#6EE7B7'],
        gravity: 0.9,
        scalar: 1.1,
      });

    // Fire from both sides
    setTimeout(() => burst({ x: 0.2, y: 0.5 }), 100);
    setTimeout(() => burst({ x: 0.8, y: 0.5 }), 250);
    // Gentle follow-up shower
    setTimeout(() => confetti({ particleCount: 40, spread: 70, origin: { x: 0.5, y: 0.3 }, colors: ['#FCD34D', '#58CC02', '#A78BFA'] }), 600);

    // Loop if perfect
    if (isPerfect) {
      let stopped = false;
      const loop = () => {
        if (stopped) return;
        confetti({ particleCount: 30, spread: 80, origin: { x: Math.random(), y: 0.2 }, colors: ['#58CC02', '#FFD700', '#A78BFA'] });
        setTimeout(loop, 1400);
      };
      const t = setTimeout(loop, 1200);
      return () => { stopped = true; clearTimeout(t); };
    }
  }, [isPerfect]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, type: 'spring', stiffness: 180 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 py-10 overflow-y-auto"
      style={{ backgroundColor: C.bg }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-5">

        {/* Badge chip */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, delay: 0.1 }}
          className="px-5 py-2 rounded-full text-sm font-black border-2 border-b-4 shadow-md"
          style={{
            backgroundColor: isPerfect ? C.doneGreen : '#FFF8E1',
            borderColor: isPerfect ? C.doneBorder : '#D97706',
            color: isPerfect ? C.doneBorder : '#92400E',
          }}
        >
          {isPerfect ? '⭐ ' + T('quiz.results.perfectBadge') : '🎉 ' + T('quiz.results.lessonBadge')}
        </motion.div>

        {/* SVG Nur mascot */}
        <div className="relative">
          {/* Ambient glow */}
          <div className="absolute inset-0 rounded-full bg-amber-200/40 blur-2xl scale-110" />
          <NurMascot animateType="spring" size={190} />
        </div>

        {/* Result title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-black text-slate-800 text-center"
        >
          {isPerfect
            ? (lang === 'en' ? 'Perfect! Amazing work! 🌟' : 'Sempurna! Luar biasa! 🌟')
            : (lang === 'en' ? 'Lesson Complete! 🎊' : 'Pelajaran Selesai! 🎊')}
        </motion.h2>

        {/* 3D Stat cards */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <StatCard
            emoji="📚"
            value={wordsCount}
            label={T('quiz.results.wordsLearned')}
            bgColor={C.tealLight}
            borderColor={C.teal}
            textColor={C.teal}
          />
          <StatCard
            emoji="⭐"
            value={`+${xpEarned}`}
            label={T('quiz.results.xpEarned')}
            bgColor={C.amberLight}
            borderColor={C.amber}
            textColor="#92400E"
          />
          <StatCard
            emoji="⏱️"
            value={formatMMSS(durationSecs)}
            label={T('quiz.results.duration')}
            bgColor={C.doneGreen}
            borderColor={C.doneBorder}
            textColor={C.doneBorder}
          />
        </div>

        {/* CTA Button */}
        <motion.button
          onClick={onContinue}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`w-full py-5 font-black text-xl text-white ${btn3d} border-b-[6px] mt-1`}
          style={{ backgroundColor: C.green, borderColor: C.greenDark }}
        >
          {s('resultsDone')} →
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ResultScreen;
