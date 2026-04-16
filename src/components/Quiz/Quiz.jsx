import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import NurMascot from '../NurMascot/NurMascot';
import { useUserStore, t } from '../../store/userStore';

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildMCQOptions = (words, targetWord) => {
  const correct = targetWord.translation;
  const distractors = shuffle(
    words.filter((w) => w.translation !== correct)
  ).slice(0, 3).map((w) => w.translation);
  return shuffle([correct, ...distractors]);
};

// ─────────────────────────────────────────────────────────────────────────────
// Question Queue Builder  (8–10 items per lesson)
// ─────────────────────────────────────────────────────────────────────────────
const TARGET_QUESTIONS = 9;

const buildQuestionQueue = (words) => {
  if (!words || words.length === 0) return [];

  const n    = words.length;
  const half = Math.ceil(n / 2);
  const queue = [];

  // Phase 1 — introduce first half via MCQ
  words.slice(0, half).forEach((w) => queue.push({ type: 'mcq', word: w }));

  // Phase 2 — Matching Pairs (up to 6 words)
  const g1 = words.slice(0, Math.min(6, n));
  if (g1.length >= 3) queue.push({ type: 'match', words: g1 });

  // Phase 3 — reinforce second half via MCQ
  words.slice(half).forEach((w) => queue.push({ type: 'mcq', word: w }));

  // Phase 4 — second Matching if N > 5
  if (n > 5) {
    const g2 = words.slice(Math.max(0, n - 5));
    if (g2.length >= 3) queue.push({ type: 'match', words: g2 });
  }

  // Pad to TARGET by repeating MCQ for first few words
  let padIdx = 0;
  while (queue.length < TARGET_QUESTIONS) {
    queue.push({ type: 'mcq', word: words[padIdx % n] });
    padIdx++;
    if (padIdx > n * 2) break;
  }

  return queue;
};

// ─────────────────────────────────────────────────────────────────────────────
// MCQ Question
// ─────────────────────────────────────────────────────────────────────────────
const MCQQuestion = ({ word, allWords, onAnswer }) => {
  const options = useMemo(() => buildMCQOptions(allWords, word), [word, allWords]);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);

  const handleClick = (option) => {
    if (locked) return;
    setSelected(option);
    setLocked(true);
    const correct = option === word.translation;
    onAnswer(correct, option);
  };

  const getOptionStyle = (option) => {
    const isSelected = selected === option;
    const isCorrect  = option === word.translation;

    const base = {
      padding: '1rem 1.25rem',
      borderRadius: '1.25rem',
      borderWidth: '3px',
      borderStyle: 'solid',
      fontWeight: 700,
      fontSize: '1rem',
      textAlign: 'left',
      cursor: locked ? 'default' : 'pointer',
      userSelect: 'none',
      transition: 'all 0.18s',
      width: '100%',
    };

    if (!locked) {
      return { ...base, background: '#fff', borderColor: '#e2e8f0', color: '#334155' };
    }
    if (isSelected && isCorrect)  return { ...base, background: '#f0fdf4', borderColor: '#58CC02', color: '#166534' };
    if (isSelected && !isCorrect) return { ...base, background: '#fee2e2', borderColor: '#FF4B4B', color: '#991b1b' };
    if (!isSelected && isCorrect) return { ...base, background: '#f0fdf4', borderColor: '#58CC02', color: '#166534' };
    return { ...base, background: '#fff', borderColor: '#e2e8f0', color: '#94a3b8', opacity: 0.6 };
  };

  return (
    <div className="grid grid-cols-1 gap-3 w-full">
      {options.map((option, i) => (
        <motion.button
          key={i}
          onClick={() => handleClick(option)}
          disabled={locked}
          style={getOptionStyle(option)}
          animate={
            locked && selected === option && option !== word.translation
              ? { x: [0, -10, 10, -7, 7, -4, 4, 0] }
              : {}
          }
          transition={{ duration: 0.5 }}
          whileTap={{ scale: locked ? 1 : 0.97 }}
        >
          {option}
        </motion.button>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Matching Pairs — equal-height columns, Duolingo-accurate colors
// ─────────────────────────────────────────────────────────────────────────────
const MatchingPairs = ({ words, onComplete }) => {
  const count = Math.min(words.length, 6);
  const pairs = useMemo(() => words.slice(0, count), [words, count]);

  const [leftItems]  = useState(() => pairs.map((w, i) => ({ id: i, text: w.arabic,      pairId: i })));
  const [rightItems] = useState(() => shuffle(pairs.map((w, i) => ({ id: i, text: w.translation, pairId: i }))));

  const [selLeft,    setSelLeft]    = useState(null);
  const [selRight,   setSelRight]   = useState(null);
  const [matched,    setMatched]    = useState(new Set());
  const [wrongLeft,  setWrongLeft]  = useState(null);
  const [wrongRight, setWrongRight] = useState(null);
  const [score,      setScore]      = useState(0);
  const [done,       setDone]       = useState(false);

  useEffect(() => {
    if (!done && matched.size === count) {
      setDone(true);
      setTimeout(() => onComplete(score, count), 500);
    }
  }, [matched, count, done, score, onComplete]);

  const tryMatch = useCallback((left, right) => {
    const ok = left.pairId === right.pairId;
    if (ok) {
      setMatched((prev) => { const s = new Set(prev); s.add(left.pairId); return s; });
      setScore((s) => s + 1);
    } else {
      setWrongLeft(left.id);
      setWrongRight(right.id);
      setTimeout(() => { setWrongLeft(null); setWrongRight(null); }, 650);
    }
    setSelLeft(null);
    setSelRight(null);
  }, []);

  const handleLeft = (item) => {
    if (matched.has(item.pairId) || wrongLeft !== null) return;
    const next = selLeft?.id === item.id ? null : item;
    setSelLeft(next);
    if (next && selRight) tryMatch(next, selRight);
  };

  const handleRight = (item) => {
    if (matched.has(item.pairId) || wrongRight !== null) return;
    const next = selRight?.id === item.id ? null : item;
    setSelRight(next);
    if (next && selLeft) tryMatch(selLeft, next);
  };

  const leftState  = (item) => matched.has(item.pairId) ? 'matched' : wrongLeft  === item.id ? 'wrong' : selLeft?.id  === item.id ? 'selected' : 'idle';
  const rightState = (item) => matched.has(item.pairId) ? 'matched' : wrongRight === item.id ? 'wrong' : selRight?.id === item.id ? 'selected' : 'idle';

  // ── Inline styles for crisp Duolingo-accurate colors ──────────────────────
  const getLeftStyle = (state) => ({
    width: '100%',
    height: '100%',
    padding: '1rem 0.875rem',
    borderRadius: '1.25rem',
    borderWidth: '3px',
    borderStyle: 'solid',
    fontWeight: 700,
    fontSize: '1.75rem',
    direction: 'rtl',
    textAlign: 'center',
    lineHeight: 1.6,
    cursor: state === 'matched' ? 'default' : 'pointer',
    userSelect: 'none',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Amiri, serif',
    ...(state === 'matched'  && { background: '#f0fdf4', borderColor: '#58CC02', color: '#166534' }),
    ...(state === 'wrong'    && { background: '#fee2e2', borderColor: '#FF4B4B', color: '#991b1b' }),
    ...(state === 'selected' && { background: '#E1F5FE', borderColor: '#0ea5e9', color: '#0c4a6e', transform: 'scale(1.04)', boxShadow: '0 4px 16px rgba(14,165,233,0.18)' }),
    ...(state === 'idle'     && { background: '#fff', borderColor: '#e2e8f0', color: '#1e293b' }),
  });

  const getRightStyle = (state) => ({
    width: '100%',
    height: '100%',
    padding: '1rem 0.875rem',
    borderRadius: '1.25rem',
    borderWidth: '3px',
    borderStyle: 'solid',
    fontWeight: 600,
    fontSize: '0.875rem',
    textAlign: 'center',
    lineHeight: 1.4,
    cursor: state === 'matched' ? 'default' : 'pointer',
    userSelect: 'none',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(state === 'matched'  && { background: '#f0fdf4', borderColor: '#58CC02', color: '#166534' }),
    ...(state === 'wrong'    && { background: '#fee2e2', borderColor: '#FF4B4B', color: '#991b1b' }),
    ...(state === 'selected' && { background: '#E1F5FE', borderColor: '#0ea5e9', color: '#0c4a6e', transform: 'scale(1.04)', boxShadow: '0 4px 16px rgba(14,165,233,0.18)' }),
    ...(state === 'idle'     && { background: '#fff', borderColor: '#e2e8f0', color: '#475569' }),
  });

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 gap-3 items-stretch">
        <div className="flex flex-col gap-3">
          {leftItems.map((item) => {
            const state = leftState(item);
            return (
              <motion.button
                key={item.id}
                onClick={() => handleLeft(item)}
                disabled={matched.has(item.pairId)}
                style={getLeftStyle(state)}
                animate={state === 'wrong' ? { x: [0, -9, 9, -6, 6, -3, 3, 0] } : {}}
                transition={{ duration: 0.45 }}
                whileTap={{ scale: matched.has(item.pairId) ? 1 : 0.95 }}
              >
                <span style={{ fontFamily: 'Amiri, serif' }}>{item.text}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {rightItems.map((item) => {
            const state = rightState(item);
            return (
              <motion.button
                key={item.id}
                onClick={() => handleRight(item)}
                disabled={matched.has(item.pairId)}
                style={getRightStyle(state)}
                animate={state === 'wrong' ? { x: [0, 9, -9, 6, -6, 3, -3, 0] } : {}}
                transition={{ duration: 0.45 }}
                whileTap={{ scale: matched.has(item.pairId) ? 1 : 0.95 }}
              >
                {item.text}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-1">
        {pairs.map((_, i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            animate={{ backgroundColor: matched.has(i) ? '#58CC02' : '#e2e8f0' }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Results Screen — always shows Nur + confetti + score summary
// ─────────────────────────────────────────────────────────────────────────────
const ResultsScreen = ({ score, total, xpEarned, lang, lessonNum, totalLessons, onContinue }) => {
  const isPerfect = score === total;
  const pct       = Math.round((score / Math.max(total, 1)) * 100);

  // Confetti fires once on mount (already triggered in finishQuiz, but fire here too for safety)
  useEffect(() => {
    const t = setTimeout(() => {
      if (isPerfect) {
        confetti({ particleCount: 240, spread: 95, origin: { y: 0.45 } });
      } else {
        confetti({ particleCount: 110, spread: 70, origin: { y: 0.5 } });
      }
    }, 80);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-lg flex flex-col items-center space-y-5 p-4"
    >
      <div className="w-full bg-white rounded-[2rem] shadow-xl border-4 border-slate-50 p-6 flex flex-col items-center space-y-5">

        <div className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full">
          {t(lang, 'lesson.label')} {lessonNum} {t(lang, 'lesson.of')} {totalLessons}
        </div>

        <NurMascot mood="celebrate" size={160} sparkles={true} />

        <h2 className="text-2xl font-extrabold text-slate-800 text-center">
          {isPerfect ? t(lang, 'quiz.perfect_score') : t(lang, 'quiz.completed')}
        </h2>

        <div className="grid grid-cols-3 gap-3 w-full">
          <div className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl p-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="text-xl font-black text-slate-800">{score}/{total}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
              {t(lang, 'quiz.score')}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-xl font-black text-emerald-600">{pct}%</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
              Accuracy
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 bg-amber-50 rounded-xl p-4">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span className="text-xl font-black text-amber-600">+{xpEarned}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">XP</span>
          </div>
        </div>

        <motion.button
          onClick={onContinue}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-xl font-black text-lg text-white shadow-lg transition-colors"
          style={{ background: '#58CC02', boxShadow: '0 4px 16px rgba(88,204,2,0.3)' }}
        >
          {t(lang, 'quiz.continue')}
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Quiz Component
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Quiz
 *
 * Props:
 *   words        — [{ arabic, translation }]  lesson words
 *   lessonIndex  — zero-based lesson number
 *   totalLessons — total lessons in unit
 *   unitKey      — e.g. "1:1"
 *   onComplete   — (score, total) => void  (called after quiz, before results)
 *   onContinue   — () => void              (called when user taps Continue)
 */
const Quiz = ({
  words       = [],
  lessonIndex  = 0,
  totalLessons = 1,
  unitKey      = 'unit',
  onComplete   = () => {},
  onContinue   = () => {},
}) => {
  const { preferredLanguage, completeLesson } = useUserStore();
  const lang       = preferredLanguage || 'en';
  const safeWords  = useMemo(() => (Array.isArray(words) ? words.filter(Boolean) : []), [words]);

  // ── Working question queue ───────────────────────────────────────────────
  const [workingQueue, setWorkingQueue] = useState(() => buildQuestionQueue(safeWords));
  const [qIdx,         setQIdx]         = useState(0);
  const [mcqAnswered,  setMcqAnswered]  = useState(null);

  const [correctCount,  setCorrectCount]  = useState(0);
  const [initialTotal,  setInitialTotal]  = useState(() => buildQuestionQueue(safeWords).length);

  // Results — use a pending flag + 500ms delay for smooth transition
  const [showResults,  setShowResults]  = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [xpEarned,     setXpEarned]     = useState(0);

  // Re-init if words change
  useEffect(() => {
    const q = buildQuestionQueue(safeWords);
    setWorkingQueue(q);
    setInitialTotal(q.length);
    setQIdx(0);
    setMcqAnswered(null);
    setCorrectCount(0);
    setShowResults(false);
    setResultsReady(false);
  }, [safeWords]);

  const currentQuestion = workingQueue[qIdx] || null;
  const progressPct     = initialTotal > 0 ? Math.min((qIdx / initialTotal) * 100, 100) : 0;

  // ── Advance queue ─────────────────────────────────────────────────────────
  const advance = useCallback(
    (wasCorrect, wrongWord) => {
      setWorkingQueue((prev) => {
        const next = [...prev];
        if (!wasCorrect && wrongWord) {
          next.push({ type: 'mcq', word: wrongWord, isRetry: true });
        }
        return next;
      });
      setQIdx((i) => i + 1);
      setMcqAnswered(null);
    },
    []
  );

  // ── Finish quiz — 500ms delay before showing results ─────────────────────
  const finishQuiz = useCallback(
    (finalCorrect) => {
      const result = completeLesson(
        unitKey, lessonIndex, totalLessons,
        finalCorrect, initialTotal
      );
      const earned = result?.xpEarned ?? 0;
      setXpEarned(earned);
      onComplete(finalCorrect, initialTotal);

      // Trigger confetti immediately on finish (before card disappears)
      const isPerfect = finalCorrect === initialTotal;
      setTimeout(() => {
        if (isPerfect) {
          confetti({ particleCount: 240, spread: 95, origin: { y: 0.45 } });
        } else {
          confetti({ particleCount: 110, spread: 70, origin: { y: 0.5 } });
        }
      }, 100);

      // Show pending overlay, then reveal results after 500ms
      setShowResults(true);
      setTimeout(() => setResultsReady(true), 500);
    },
    [completeLesson, unitKey, lessonIndex, totalLessons, initialTotal, onComplete]
  );

  // ── Detect queue exhaustion ───────────────────────────────────────────────
  useEffect(() => {
    if (!showResults && workingQueue.length > 0 && qIdx >= workingQueue.length) {
      finishQuiz(correctCount);
    }
  }, [qIdx, workingQueue.length, showResults, correctCount, finishQuiz]);

  // ── MCQ handlers ─────────────────────────────────────────────────────────
  const handleMCQAnswer = (correct, option) => {
    if (!currentQuestion?.word) return;
    setMcqAnswered({ correct, option });
    if (correct && !currentQuestion.isRetry) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleMCQNext = () => {
    if (!mcqAnswered) return;
    advance(mcqAnswered.correct, mcqAnswered.correct ? null : currentQuestion?.word);
  };

  // ── Matching complete ─────────────────────────────────────────────────────
  const handleMatchComplete = useCallback(
    (matchScore, matchTotal) => {
      if (!currentQuestion?.isRetry) {
        setCorrectCount((c) => c + (matchScore === matchTotal ? 1 : 0));
      }
      advance(matchScore === matchTotal, null);
    },
    [advance, currentQuestion]
  );

  // ── Results: pending overlay (500ms transition) ───────────────────────────
  if (showResults) {
    if (!resultsReady) {
      // Smooth fade-out: blank white screen for 500ms before results appear
      return (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg flex items-center justify-center p-8"
          style={{ minHeight: 340 }}
        >
          <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
        </motion.div>
      );
    }
    return (
      <ResultsScreen
        score={correctCount}
        total={initialTotal}
        xpEarned={xpEarned}
        lang={lang}
        lessonNum={lessonIndex + 1}
        totalLessons={totalLessons}
        onContinue={onContinue}
      />
    );
  }

  if (!currentQuestion || safeWords.length === 0) return null;

  // ── Lesson badge ──────────────────────────────────────────────────────────
  const LessonBadge = () => (
    <div className="w-full flex items-center justify-between px-1 mb-1">
      <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
        {t(lang, 'lesson.label')} {lessonIndex + 1} {t(lang, 'lesson.of')} {totalLessons}
      </span>
      <span className="text-xs font-bold text-slate-400 tabular-nums">
        {qIdx + 1}
        <span className="text-slate-300"> / {workingQueue.length}</span>
      </span>
    </div>
  );

  // ── MCQ ───────────────────────────────────────────────────────────────────
  if (currentQuestion.type === 'mcq') {
    const word = currentQuestion.word;
    return (
      <div className="w-full max-w-lg flex flex-col items-center space-y-4 p-4">
        <LessonBadge />

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: '#58CC02' }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {currentQuestion.isRetry && (
          <div className="w-full text-center text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl py-1.5">
            🔄 {lang === 'id' ? 'Coba lagi kata yang salah' : 'Retry — you missed this one!'}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={`mcq-${qIdx}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            className="w-full bg-white rounded-[2rem] shadow-xl border-4 border-slate-50 p-6 flex flex-col items-center space-y-5"
          >
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t(lang, 'quiz.title')}
            </div>

            <div className="text-center py-2">
              <span
                className="text-6xl font-bold text-slate-800 leading-relaxed"
                style={{ fontFamily: 'Amiri, serif' }}
                dir="rtl"
              >
                {word?.arabic}
              </span>
            </div>

            <MCQQuestion
              word={word}
              allWords={safeWords}
              onAnswer={handleMCQAnswer}
            />

            <AnimatePresence>
              {mcqAnswered && (
                <motion.button
                  key="next-btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleMCQNext}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-xl font-black text-lg text-white shadow-lg transition-colors flex items-center justify-center gap-3"
                  style={
                    mcqAnswered.correct
                      ? { background: '#58CC02', boxShadow: '0 4px 16px rgba(88,204,2,0.28)' }
                      : { background: '#475569', boxShadow: '0 4px 16px rgba(71,85,105,0.2)' }
                  }
                >
                  {mcqAnswered.correct
                    ? (qIdx < workingQueue.length - 1 ? t(lang, 'next') : t(lang, 'quiz.continue'))
                    : (lang === 'id' ? 'Coba lagi nanti →' : 'Got it →')
                  }
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Matching Pairs ────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-lg flex flex-col items-center space-y-4 p-4">
      <LessonBadge />

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: '#38bdf8' }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`match-${qIdx}`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          className="w-full bg-white rounded-[2rem] shadow-xl border-4 border-slate-50 p-6 flex flex-col items-center space-y-4"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t(lang, 'quiz.matchTitle')}
            </div>
            <p className="text-sm text-slate-500 text-center">
              {lang === 'id'
                ? 'Ketuk kata Arab, lalu ketuk artinya yang cocok.'
                : 'Tap an Arabic word, then tap its matching meaning.'}
            </p>
          </div>

          <MatchingPairs
            words={currentQuestion.words}
            onComplete={handleMatchComplete}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
