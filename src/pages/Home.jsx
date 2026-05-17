import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Star, Lock, Check, Settings, Volume2, VolumeX, X, Bell, RotateCcw } from 'lucide-react';
import NurMascot from '../components/NurMascot/NurMascot';
import {
  useUserStore,
  buildLessons,
  SECTIONS_DATA,
  getUnitsForSection,
  getUnitKey,
  getUIString,
} from '../store/userStore';
import { VOCAB_WORDS } from '../utils/wordFrequency';
import { useVocabStore } from '../store/vocabStore';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  green: '#58CC02',
  greenDark: '#46A302',
  teal: '#37607D',
  tealDark: '#2A4B63',
  bg: '#F6F3E6',
  doneGreen: '#D7FFB1',
  doneBorder: '#218151',
  lockedGray: '#E5E7EB',
  lockedBorder: '#9CA3AF',
  ringTrack: '#E5E7EB',
  pathLine: '#E5E7EB',
};

// ─── SVG Circular Progress Ring ───────────────────────────────────────────────
const ProgressRing = ({ pct = 0, size = 80, stroke = 6 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.ringTrack} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={pct >= 100 ? C.doneBorder : C.green}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
    </svg>
  );
};

// ─── Settings Modal ───────────────────────────────────────────────────────────
const REMINDER_KEY = 'istiqo_reminder_time';

const scheduleReminder = (timeStr) => {
  if (!('Notification' in window)) return;
  Notification.requestPermission().then((permission) => {
    if (permission !== 'granted') return;

    // Clear any existing scheduled reminder
    const existingId = localStorage.getItem('istiqo_reminder_timeout_id');
    if (existingId) clearTimeout(Number(existingId));

    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    const delay = target.getTime() - now.getTime();
    const id = setTimeout(() => {
      new Notification('Istiqo – Waktunya Belajar! 📖', {
        body: 'Jangan lupa latihan harian kamu hari ini.',
        icon: '/icons/icon-192.png',
      });
    }, delay);
    localStorage.setItem('istiqo_reminder_timeout_id', String(id));
  });
};

const SettingsModal = ({ isOpen, onClose, lang }) => {
  const s = (k) => getUIString(lang, k);
  const [reminderTime, setReminderTime] = useState(
    () => localStorage.getItem(REMINDER_KEY) || '18:00'
  );

  const handleTimeChange = (e) => {
    const val = e.target.value;
    setReminderTime(val);
    localStorage.setItem(REMINDER_KEY, val);
    scheduleReminder(val);
  };

  const handleResetProgress = () => {
    if (window.confirm(lang === 'en' ? 'Reset all progress? This cannot be undone.' : 'Reset semua progres? Ini tidak bisa dibatalkan.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />
          {/* Bottom sheet */}
          <motion.div
            key="settings-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-gray-200" />
            </div>

            <div className="px-6 pb-10 pt-2">
              {/* Title row */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-800">
                  {lang === 'en' ? 'Settings' : 'Pengaturan'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Daily Reminder */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-bold text-slate-700">
                    {lang === 'en' ? 'Daily Reminder Time' : 'Waktu Pengingat Harian'}
                  </span>
                </div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={handleTimeChange}
                  className="w-full rounded-xl border-2 border-gray-200 p-3 text-gray-800 font-bold text-base focus:outline-none focus:border-teal-400 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1.5 font-medium">
                  {lang === 'en'
                    ? 'You\'ll get a browser notification at this time each day.'
                    : 'Kamu akan mendapat notifikasi browser setiap hari pada waktu ini.'}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 mb-6" />

              {/* Reset Progress */}
              <button
                onClick={handleResetProgress}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-b-[5px] border-red-200 bg-red-50 text-red-600 font-black text-sm hover:bg-red-100 active:translate-y-[3px] active:border-b-[2px] transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                {lang === 'en' ? 'Reset Progress' : 'Reset Progres'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
const HeaderBar = ({ streak, xp, lang, isAudioMuted, onToggleAudio, onOpenSettings }) => {
  const s = (k) => getUIString(lang, k);
  return (
    <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-100 shadow-sm">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: C.teal }}>Istiqo</h1>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
            <span className="text-sm font-bold text-gray-700">{streak}</span>
            <span className="text-xs font-medium text-gray-400">{s('streakLabel')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-bold text-gray-700">{xp}</span>
            <span className="text-xs font-medium text-gray-400">{s('xpLabel')}</span>
          </div>
          <button onClick={onToggleAudio} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            {isAudioMuted ? <VolumeX className="w-5 h-5 text-gray-500" /> : <Volume2 className="w-5 h-5 text-gray-500" />}
          </button>
          <button onClick={onOpenSettings} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <Settings className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Section Banner ───────────────────────────────────────────────────────────
const SectionBanner = ({ title, subtitle, color, sectionLabel }) => (
  <div
    className="w-full rounded-2xl p-6 mb-4 flex flex-col justify-end min-h-[120px] relative overflow-hidden border-2 border-b-[6px]"
    style={{ backgroundColor: color, borderColor: '#2A4B63' }}
  >
    <div className="absolute inset-0 opacity-10"
      style={{ background: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)' }} />
    <div className="relative z-10">
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">{sectionLabel}</div>
      <h2 className="text-xl font-black text-white mb-0.5">{title}</h2>
      <p className="text-xs text-white/70 font-medium">{subtitle}</p>
    </div>
  </div>
);

// ─── Zig-Zag path constants ───────────────────────────────────────────────────
const RING_SIZE = 84;
const BUBBLE_SIZE = 64;
const RING_STROKE = 7;
const ROW_H = 180;

const zigX = (idx) => {
  const cycle = idx % 4;
  if (cycle === 0) return 0;
  if (cycle === 1) return 56;
  if (cycle === 2) return 0;
  return -56;
};

// ─── Unit Circle ─────────────────────────────────────────────────────────────
const UnitCircle = ({ unitNum, isLocked, isCompleted, pct, isNext, onStart, lang }) => {
  const s = (k) => getUIString(lang, k);
  const ringOffset = (RING_SIZE - BUBBLE_SIZE) / 2;
  const bubbleBg = isCompleted ? C.doneGreen : isLocked ? C.lockedGray : C.teal;
  const bubbleBorder = isCompleted ? C.doneBorder : isLocked ? C.lockedBorder : C.tealDark;
  const canClick = !isLocked;

  return (
    <div className="flex flex-col items-center" style={{ position: 'relative' }}>
      {isNext && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 flex flex-col items-center"
        >
          <div
            className="px-4 py-1.5 rounded-full font-black text-xs text-white shadow-lg"
            style={{ backgroundColor: C.green }}
          >
            {s('start')} →
          </div>
          <div className="w-2.5 h-2.5 -mt-1.5 rotate-45" style={{ backgroundColor: C.green }} />
        </motion.div>
      )}

      <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE }}>
        <ProgressRing pct={pct} size={RING_SIZE} stroke={RING_STROKE} />
        <button
          onClick={canClick ? onStart : undefined}
          disabled={!canClick}
          style={{
            position: 'absolute',
            top: ringOffset,
            left: ringOffset,
            width: BUBBLE_SIZE,
            height: BUBBLE_SIZE,
            borderRadius: '50%',
            backgroundColor: bubbleBg,
            border: `2px solid ${bubbleBorder}`,
            borderBottom: `6px solid ${bubbleBorder}`,
            boxShadow: canClick ? `0 4px 0 ${bubbleBorder}` : 'none',
            cursor: canClick ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.1s, border-bottom-width 0.1s',
          }}
          className={`select-none ${canClick ? 'hover:scale-105 active:translate-y-[3px] active:border-b-[3px]' : ''}`}
        >
          {isCompleted ? (
            <Check className="w-7 h-7" style={{ color: C.doneBorder }} strokeWidth={3} />
          ) : isLocked ? (
            <Lock className="w-5 h-5" style={{ color: C.lockedBorder }} />
          ) : (
            <span className="text-sm font-black text-white">U{unitNum}</span>
          )}
        </button>
      </div>

      <div className="absolute top-[100%] left-1/2 -translate-x-1/2 mt-3 text-center z-10 flex flex-col items-center w-36 px-2 py-1 bg-[#F6F3E6] rounded-xl shadow-sm border border-white/50">
        <div
          className="text-xs font-black uppercase tracking-wider"
          style={{ color: isLocked ? C.lockedBorder : isCompleted ? C.doneBorder : C.tealDark }}
        >
          {s('unit')} {unitNum}
        </div>
        {isLocked && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <Lock className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-400 font-bold leading-tight">{s('finishPrev')}</span>
          </div>
        )}
        {isCompleted && (
          <div className="text-[10px] font-black mt-1 uppercase tracking-widest" style={{ color: C.doneBorder }}>
            {s('done')}
          </div>
        )}
        {!isLocked && !isCompleted && (
          <div className="text-[10px] text-gray-500 mt-1 font-bold">{s('pctDone')(pct)}</div>
        )}
      </div>
    </div>
  );
};

// ─── Journey Path ─────────────────────────────────────────────────────────────
const JourneyPath = ({ units, getUnitStatus, onUnitStart, lang }) => {
  const count = units.length;
  const svgH = count * ROW_H + RING_SIZE + 60;
  const centerX = 160;

  const positions = units.map((_, i) => ({
    cx: centerX + zigX(i),
    cy: i * ROW_H + RING_SIZE / 2,
  }));

  return (
    <div className="relative w-full" style={{ height: svgH }}>
      <svg
        className="absolute inset-0 w-full pointer-events-none"
        style={{ height: svgH }}
        viewBox={`0 0 320 ${svgH}`}
        preserveAspectRatio="none"
      >
        {positions.slice(0, -1).map((pos, i) => {
          const next = positions[i + 1];
          const { isCompleted } = getUnitStatus(units[i]);
          return (
            <line
              key={i}
              x1={pos.cx} y1={pos.cy + RING_SIZE / 2 + 10}
              x2={next.cx} y2={next.cy - RING_SIZE / 2 - 10}
              stroke={isCompleted ? C.doneBorder : C.pathLine}
              strokeWidth={isCompleted ? 4 : 3}
              strokeDasharray={isCompleted ? 'none' : '8 6'}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {units.map((unitNum, idx) => {
        const { isLocked, isCompleted, completedCount, totalLessons } = getUnitStatus(unitNum);
        const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
        const isNext = !isLocked && !isCompleted && (idx === 0 || getUnitStatus(units[idx - 1]).isCompleted);

        return (
          <motion.div
            key={unitNum}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.08, duration: 0.3, type: 'spring', stiffness: 200 }}
            style={{
              position: 'absolute',
              left: positions[idx].cx - RING_SIZE / 2,
              top: positions[idx].cy - RING_SIZE / 2,
            }}
          >
            <UnitCircle
              unitNum={unitNum}
              isLocked={isLocked}
              isCompleted={isCompleted}
              pct={pct}
              isNext={isNext}
              onStart={() => onUnitStart(unitNum)}
              lang={lang}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

// ─── Main Home ────────────────────────────────────────────────────────────────
const Home = () => {
  const { streak, xp, lessonProgress, preferredLanguage, isAudioMuted, toggleAudio } = useUserStore();
  const lang = preferredLanguage || 'id';
  const s = (k) => getUIString(lang, k);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const setView = useVocabStore((st) => st.setView);
  const startUnit = useVocabStore((st) => st.startUnit);
  const setCurrentQuizWords = useUserStore((st) => st.setCurrentQuizWords);

  const section = SECTIONS_DATA[0];
  const sectionTitle = section.title?.[lang] ?? section.title?.id;
  const sectionSubtitle = section.subtitle?.[lang] ?? section.subtitle?.id;
  const units = getUnitsForSection(1).map(({ unit }) => unit);

  const getUnitStatus = (unitNum) => {
    const unitKey = getUnitKey(1, unitNum);
    const unitWords = VOCAB_WORDS.filter((w) => w.section === 1 && w.unit === unitNum);
    const totalLessons = buildLessons(unitWords).length;
    const lp = lessonProgress?.[unitKey] || { completedLessons: [], totalLessons };
    const completedCount = new Set(lp.completedLessons ?? []).size;
    const isCompleted = totalLessons > 0 && completedCount >= totalLessons;

    if (unitNum === 1) {
      return { isLocked: false, isCompleted, completedCount, totalLessons };
    }

    const prevKey = getUnitKey(1, unitNum - 1);
    const prevWords = VOCAB_WORDS.filter((w) => w.section === 1 && w.unit === unitNum - 1);
    const prevTotal = buildLessons(prevWords).length;
    const prevLP = lessonProgress?.[prevKey] || { completedLessons: [] };
    const prevDone = new Set(prevLP.completedLessons ?? []).size >= prevTotal && prevTotal > 0;

    return { isLocked: !prevDone, isCompleted, completedCount, totalLessons };
  };

  const handleUnitStart = (unitNum) => {
    const unitKey = `1:${unitNum}`;
    const unitWords = VOCAB_WORDS.filter((w) => w.section === 1 && w.unit === unitNum);
    const lessons = buildLessons(unitWords);
    const lp = lessonProgress?.[unitKey] || { completedLessons: [], totalLessons: lessons.length };
    const completedSet = new Set(lp.completedLessons ?? []);
    const nextIdx = lessons.findIndex((_, i) => !completedSet.has(i));
    const actualIdx = nextIdx === -1 ? 0 : nextIdx;

    setCurrentQuizWords(lessons[actualIdx]?.words ?? []);
    startUnit({
      section: 1,
      unit: unitNum,
      ranks: (lessons[actualIdx]?.words ?? []).map((w) => w.rank),
      lessonIndex: actualIdx,
      totalLessons: lessons.length,
      unitKey,
    });
  };

  const completedUnits = units.filter((u) => getUnitStatus(u).isCompleted).length;
  const sectionLabel = lang === 'en'
    ? `Section 1 of 5`
    : `Bagian 1 dari 5`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <HeaderBar streak={streak} xp={xp} lang={lang} isAudioMuted={isAudioMuted} onToggleAudio={toggleAudio} onOpenSettings={() => setIsSettingsOpen(true)} />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} lang={lang} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="relative pt-6">
          <SectionBanner
            title={sectionTitle}
            subtitle={sectionSubtitle}
            color={section.themeColor}
            sectionLabel={sectionLabel}
          />
        </div>

        {/* Journey summary */}
        <div className="flex items-center justify-between mb-6 px-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {s('yourJourney')}
          </span>
          <span className="text-xs font-bold" style={{ color: C.teal }}>
            {completedUnits}/{units.length} {s('units')}
          </span>
        </div>

        {/* Zig-Zag Journey */}
        <JourneyPath
          units={units}
          getUnitStatus={getUnitStatus}
          onUnitStart={handleUnitStart}
          lang={lang}
        />

        {/* Section 2 Locked Teaser */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <div className="w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-400">{s('section2')}</div>
                <div className="text-xs text-gray-300">{s('section2Sub')}</div>
              </div>
            </div>
            <span className="text-xs font-medium text-gray-300">{s('locked')}</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Home;
