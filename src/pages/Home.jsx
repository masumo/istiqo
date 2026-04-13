import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import { useVocabCurriculum } from '../hooks/useVocabCurriculum';
import { useDailyGoalSync } from '../hooks/useDailyGoalSync';
import { Flame, Star, Lock, CheckCircle2, Zap, BookOpen, Link2, Layers, ScrollText, Sparkles, Target } from 'lucide-react';
import GoalRing from '../components/Gamification/GoalRing';
import NurMascot from '../components/NurMascot/NurMascot';
import { getTranslation } from '../utils/i18n';

// ── Section theming ──────────────────────────────────────────────────────────
const SECTION_THEME = {
  1: { icon: BookOpen, label: 'Foundations',     gradient: 'from-emerald-500 to-teal-500',     ring: '#10b981', locked: '#a7f3d0', text: 'text-emerald-700', bg: 'bg-emerald-50',   border: 'border-emerald-200', btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' },
  2: { icon: Link2,    label: 'Core Connectors',  gradient: 'from-sky-500 to-cyan-500',         ring: '#0ea5e9', locked: '#bae6fd', text: 'text-sky-700',     bg: 'bg-sky-50',       border: 'border-sky-200',     btn: 'bg-sky-600 hover:bg-sky-700 shadow-sky-200' },
  3: { icon: Layers,   label: 'Contextual Mastery', gradient: 'from-violet-500 to-purple-500', ring: '#8b5cf6', locked: '#ddd6fe', text: 'text-violet-700', bg: 'bg-violet-50',   border: 'border-violet-200',  btn: 'bg-violet-600 hover:bg-violet-700 shadow-violet-200' },
  4: { icon: ScrollText, label: 'Stories of Prophets', gradient: 'from-amber-500 to-orange-500', ring: '#f59e0b', locked: '#fde68a', text: 'text-amber-700', bg: 'bg-amber-50',   border: 'border-amber-200',   btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' },
  5: { icon: Sparkles, label: 'Advanced Nuances', gradient: 'from-rose-500 to-pink-500',       ring: '#f43f5e', locked: '#fecdd3', text: 'text-rose-700',   bg: 'bg-rose-50',     border: 'border-rose-200',    btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' },
};

// ── ProgressRing ─────────────────────────────────────────────────────────────
const ProgressRing = ({ progress, size = 88, strokeWidth = 8, color, isActive, isCompleted }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const display = isCompleted ? 100 : Math.min(progress, 98);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="transparent" stroke="#e2e8f0" strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (display / 100) * circumference }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isCompleted ? (
          <CheckCircle2 className="w-8 h-8 text-current" style={{ color }} />
        ) : (
          <span className="text-lg font-extrabold text-slate-700">{Math.round(display)}%</span>
        )}
      </div>
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `3px solid ${color}` }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
};

// ── UnitNode ──────────────────────────────────────────────────────────────────
const UnitNode = ({ unit, theme, onStart }) => {
  const { preferredLanguage } = useUserStore();
  const isClickable = !unit.isLocked;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-4 ${unit.isLocked ? 'opacity-50' : ''}`}
    >
      {/* Ring */}
      <motion.div
        animate={unit.isActive ? { scale: [1, 1.05, 1] } : {}}
        transition={unit.isActive ? { repeat: Infinity, duration: 1.8 } : {}}
        className="shrink-0"
      >
        <ProgressRing
          progress={unit.progress}
          color={theme.ring}
          isActive={unit.isActive}
          isCompleted={unit.isCompleted}
        />
      </motion.div>

      {/* Card */}
      <div
        className={`flex-1 rounded-2xl border p-4 shadow-sm transition-all ${
          unit.isActive
            ? `bg-white ${theme.border} shadow-md`
            : unit.isCompleted
            ? `${theme.bg} ${theme.border}`
            : 'bg-white border-slate-100'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className={`text-[10px] uppercase tracking-widest font-bold ${theme.text}`}>
              {unit.isCompleted 
                ? getTranslation(preferredLanguage, 'unit.completed') 
                : unit.isActive 
                ? getTranslation(preferredLanguage, 'unit.active') 
                : unit.isLocked 
                ? getTranslation(preferredLanguage, 'unit.locked') 
                : getTranslation(preferredLanguage, 'unit.available')}
            </span>
            <span className="text-base font-extrabold text-slate-800 mt-0.5">{unit.title}</span>
            <span className="text-xs text-slate-500 mt-0.5">
              {unit.wordsCount} {getTranslation(preferredLanguage, 'stats.words')}
              {unit.learnedCount > 0 && !unit.isCompleted ? ` · ${unit.learnedCount} ${getTranslation(preferredLanguage, 'learned')}` : ''}
            </span>
          </div>

          {unit.isLocked ? (
            <div className="p-3 rounded-xl bg-slate-100">
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
          ) : (
            <button
              onClick={() => onStart(unit)}
              disabled={!isClickable}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${theme.btn}`}
            >
              {unit.isCompleted 
                ? getTranslation(preferredLanguage, 'unit.review') 
                : unit.learnedCount > 0 
                ? getTranslation(preferredLanguage, 'unit.continue') 
                : getTranslation(preferredLanguage, 'unit.start')}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── SectionHeader ─────────────────────────────────────────────────────────────
const SectionHeader = ({ sec, theme }) => {
  const Icon = theme.icon;
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${theme.gradient} p-5 text-white shadow-lg`}>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/70">Section {sec.section}</div>
          <div className="text-xl font-extrabold">{sec.title}</div>
          <div className="text-xs text-white/70 mt-0.5">Unit {sec.unitStart}–{sec.unitEnd} · Rank #{sec.rankStart}–{sec.rankEnd}</div>
        </div>
      </div>
      {/* Decorative blobs */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
      <div className="absolute -right-2 top-8 w-12 h-12 bg-white/10 rounded-full blur-md" />
    </div>
  );
};

// ── Home ──────────────────────────────────────────────────────────────────────
const Home = () => {
  const {
    preferredLanguage,
    streak,
    xp,
    dailyGoal,
    getDailyProgress,
    shouldCelebrateDailyGoal,
    acknowledgeDailyGoalCelebration,
  } = useUserStore();
  const { sections, startUnit } = useVocabCurriculum();
  const { updateDailyProgress } = useDailyGoalSync();
  const [showCelebration, setShowCelebration] = useState(false);

  const totalLearned = sections.reduce(
    (acc, sec) => acc + sec.units.reduce((a, u) => a + u.learnedCount, 0),
    0
  );

  const dailyProgress = getDailyProgress();
  const dailyWordsLearned = useUserStore((s) => s.dailyWordsLearned);

  // Check for daily goal celebration
  useEffect(() => {
    if (shouldCelebrateDailyGoal()) {
      setShowCelebration(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowCelebration(false);
        acknowledgeDailyGoalCelebration();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [dailyWordsLearned, shouldCelebrateDailyGoal, acknowledgeDailyGoalCelebration]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* ─── Daily Goal Celebration Modal ──────────────────────── */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setShowCelebration(false);
                acknowledgeDailyGoalCelebration();
              }}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-4 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <NurMascot
                  variant="celebrate"
                  size={160}
                  className="mx-auto mb-4"
                />
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                  {getTranslation(preferredLanguage, 'celebration.title')}
                </h2>
                <p className="text-lg text-slate-600 mb-6">
                  {getTranslation(preferredLanguage, 'celebration.description', { wordsLearned: dailyWordsLearned })}
                </p>
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    acknowledgeDailyGoalCelebration();
                  }}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                >
                  {getTranslation(preferredLanguage, 'celebration.continue')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Stats Header ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Title bar */}
          <div className="px-6 pt-6 pb-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Istiqo</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {getTranslation(preferredLanguage, 'home.subtitle')}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 divide-x divide-slate-100 border-t border-slate-100">
            <div className="flex flex-col items-center py-4 gap-1">
              <div className="flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-2xl font-extrabold text-slate-800">{streak}</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                {getTranslation(preferredLanguage, 'stats.streak')}
              </span>
            </div>
            <div className="flex flex-col items-center py-4 gap-1">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span className="text-2xl font-extrabold text-slate-800">{xp}</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                {getTranslation(preferredLanguage, 'stats.xp')}
              </span>
            </div>
            <div className="flex flex-col items-center py-4 gap-1">
              <div className="flex items-center gap-1.5">
                <Zap className="w-5 h-5 text-emerald-500" />
                <span className="text-2xl font-extrabold text-slate-800">{totalLearned}</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                {getTranslation(preferredLanguage, 'stats.words')}
              </span>
            </div>
            <div className="flex flex-col items-center py-4 gap-1">
              <GoalRing
                progress={dailyProgress}
                size={48}
                strokeWidth={5}
                color="#10b981"
                isActive={dailyProgress > 0 && dailyProgress < 100}
                isCompleted={dailyProgress >= 100}
              />
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">
                {dailyWordsLearned}/{dailyGoal}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Roadmap Sections ──────────────────────────────────────────── */}
        <AnimatePresence>
          {sections.map((sec, sIdx) => {
            const theme = SECTION_THEME[sec.section] || SECTION_THEME[1];
            return (
              <motion.div
                key={sec.section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sIdx * 0.08, duration: 0.4 }}
                className="space-y-4"
              >
                <SectionHeader sec={sec} theme={theme} />

                {/* Vertical path */}
                <div className="relative pl-2">
                  {/* Connector line */}
                  <div className="absolute left-[43px] top-0 bottom-0 w-0.5 bg-slate-200 rounded-full" />

                  <div className="space-y-4">
                    {sec.units.map((unit) => (
                      <UnitNode
                        key={unit.key}
                        unit={unit}
                        theme={theme}
                        onStart={(u) => startUnit({ section: u.section, unit: u.unit, count: 5 })}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Footer padding */}
        <div className="h-8" />
      </div>
    </div>
  );
};

export default Home;
