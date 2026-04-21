import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import NurMascot from '../NurMascot/NurMascot';
import { useUserStore } from '../../store/userStore';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  green: '#58CC02',
  greenDark: '#46A302',
  teal: '#37607D',
  tealDark: '#2A4B63',
  bg: '#F6F3E6',
  doneGreen: '#D7FFB1',
  doneBorder: '#218151',
  errorRed: '#FFDFE0',
  errorBorder: '#C62828',
  errorDark: '#991b1b',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildMCQOptions = (words, targetWord) => {
  const correct = targetWord.translation?.en ?? '';
  const distractors = shuffle(
    words.filter((w) => (w.translation?.en ?? '') !== correct)
  ).slice(0, 3).map((w) => w.translation?.en ?? '');
  return shuffle([correct, ...distractors]);
};

const TARGET_QUESTIONS = 9;

const buildQuestionQueue = (words) => {
  if (!words || words.length === 0) return [];
  const n = words.length;
  const half = Math.ceil(n / 2);
  const queue = [];

  words.slice(0, half).forEach((w) => queue.push({ type: 'mcq', word: w }));
  const g1 = words.slice(0, Math.min(6, n));
  if (g1.length >= 3) queue.push({ type: 'match', words: g1 });

  words.slice(half).forEach((w) => queue.push({ type: 'mcq', word: w }));
  if (n > 5) {
    const g2 = words.slice(Math.max(0, n - 5));
    if (g2.length >= 3) queue.push({ type: 'match', words: g2 });
  }

  let padIdx = 0;
  while (queue.length < TARGET_QUESTIONS) {
    queue.push({ type: 'mcq', word: words[padIdx % n] });
    padIdx++;
    if (padIdx > n * 2) break;
  }
  return queue;
};

// ─── 3D Button helper class ───────────────────────────────────────────────────
const btn3d = 'border-2 border-b-[6px] rounded-2xl active:border-b-2 active:translate-y-[4px] transition-all';

// ─── MCQ Question ─────────────────────────────────────────────────────────────
const MCQQuestion = ({ word, allWords, onAnswer }) => {
  const options = useMemo(() => buildMCQOptions(allWords, word), [word, allWords]);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);

  const handleClick = (option) => {
    if (locked) return;
    setSelected(option);
    setLocked(true);
    const correct = option === (word.translation?.en ?? '');
    onAnswer(correct, option);
  };

  const getOptionStyle = (option) => {
    const isSelected = selected === option;
    const isCorrect = option === (word.translation?.en ?? '');
    const base = `w-full p-4 text-left font-bold text-base flex items-center min-h-[56px] cursor-pointer select-none ${btn3d}`;

    if (!locked) return `${base} bg-white text-slate-700 border-gray-200 hover:bg-slate-50`;
    if (isSelected && isCorrect) return `${base} bg-[${C.doneGreen}] text-[${C.doneBorder}] border-[${C.doneBorder}] cursor-default`;
    if (isSelected && !isCorrect) return `${base} bg-[#FFDFE0] text-[#C62828] border-[#C62828] cursor-default`;
    if (!isSelected && isCorrect) return `${base} bg-[${C.doneGreen}] text-[${C.doneBorder}] border-[${C.doneBorder}] cursor-default`;
    return `${base} bg-white text-slate-400 border-gray-200 opacity-50 cursor-default`;
  };

  // Inline styles to avoid Tailwind JIT purge issues with dynamic colors
  const getOptionInlineStyle = (option) => {
    const isSelected = selected === option;
    const isCorrect = option === (word.translation?.en ?? '');
    if (!locked) return {};
    if (isSelected && isCorrect) return { backgroundColor: C.doneGreen, color: C.doneBorder, borderColor: C.doneBorder };
    if (isSelected && !isCorrect) return { backgroundColor: C.errorRed, color: C.errorBorder, borderColor: C.errorBorder };
    if (!isSelected && isCorrect) return { backgroundColor: C.doneGreen, color: C.doneBorder, borderColor: C.doneBorder };
    return {};
  };

  return (
    <div className="grid grid-cols-1 gap-3 w-full">
      {options.map((option, i) => (
        <motion.button
          key={i}
          onClick={() => handleClick(option)}
          disabled={locked}
          className={`w-full p-4 text-left font-bold text-base flex items-center min-h-[56px] select-none ${btn3d} ${!locked ? 'bg-white text-slate-700 border-gray-200 hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
          style={getOptionInlineStyle(option)}
          animate={
            locked && selected === option && option !== (word.translation?.en ?? '')
              ? { x: [0, -10, 10, -7, 7, -4, 4, 0] }
              : {}
          }
          transition={{ duration: 0.45 }}
        >
          {option}
        </motion.button>
      ))}
    </div>
  );
};

// ─── Matching Pairs ───────────────────────────────────────────────────────────
const MatchingPairs = ({ words, onComplete }) => {
  const count = Math.min(words.length, 6);
  const pairs = useMemo(() => words.slice(0, count), [words, count]);

  const [leftItems] = useState(() => pairs.map((w, i) => ({ id: i, text: w.word, pairId: i })));
  const [rightItems] = useState(() =>
    shuffle(pairs.map((w, i) => ({ id: i, text: w.translation?.en ?? '', pairId: i })))
  );
  const [selLeft, setSelLeft] = useState(null);
  const [selRight, setSelRight] = useState(null);
  const [matched, setMatched] = useState(new Set());
  const [wrongLeft, setWrongLeft] = useState(null);
  const [wrongRight, setWrongRight] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done && matched.size === count) {
      setDone(true);
      setTimeout(() => onComplete(score, count), 500);
    }
  }, [matched, count, done, score, onComplete]);

  const tryMatch = useCallback((left, right) => {
    const ok = left.pairId === right.pairId;
    if (ok) {
      setMatched((prev) => new Set(prev).add(left.pairId));
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

  const cardState = (item, side) => {
    if (matched.has(item.pairId)) return 'matched';
    if (side === 'left' && wrongLeft === item.id) return 'wrong';
    if (side === 'right' && wrongRight === item.id) return 'wrong';
    if (side === 'left' && selLeft?.id === item.id) return 'selected';
    if (side === 'right' && selRight?.id === item.id) return 'selected';
    return 'idle';
  };

  const cardStyle = (state) => {
    const styles = {
      idle: { bg: 'bg-white', text: 'text-slate-700', border: 'border-gray-200' },
      selected: { bg: 'bg-[#E8F0F5]', text: 'text-[#37607D]', border: 'border-[#37607D]' },
      matched: { bg: 'bg-[#D7FFB1]', text: 'text-[#218151]', border: 'border-[#218151]' },
      wrong: { bg: 'bg-[#FFDFE0]', text: 'text-[#C62828]', border: 'border-[#C62828]' },
    };
    return styles[state] || styles.idle;
  };

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 gap-3 items-stretch">
        {pairs.map((_, i) => {
          const li = leftItems[i];
          const ri = rightItems[i];
          const ls = cardState(li, 'left');
          const rs = cardState(ri, 'right');
          const lStyle = cardStyle(ls);
          const rStyle = cardStyle(rs);

          return (
            <React.Fragment key={i}>
              <motion.button
                onClick={() => handleLeft(li)}
                disabled={matched.has(li.pairId)}
                className={`flex flex-col items-center justify-center p-3 text-center min-h-[120px] w-full h-full border-2 border-b-[6px] rounded-2xl select-none transition-all ${ls === 'matched' ? 'opacity-50 cursor-default border-b-[2px] translate-y-[4px]' : ls === 'idle' ? 'cursor-pointer hover:bg-slate-50 active:border-b-2 active:translate-y-[4px]' : 'cursor-pointer'} ${lStyle.bg} ${lStyle.text} ${lStyle.border}`}
                animate={ls === 'wrong' ? { x: [0, -9, 9, -6, 6, -3, 3, 0] } : {}}
                transition={{ duration: 0.45 }}
              >
                <span className="text-3xl font-bold leading-tight" style={{ fontFamily: 'Amiri, serif' }} dir="rtl">
                  {li.text}
                </span>
              </motion.button>

              <motion.button
                onClick={() => handleRight(ri)}
                disabled={matched.has(ri.pairId)}
                className={`flex flex-col items-center justify-center p-3 text-center min-h-[120px] w-full h-full border-2 border-b-[6px] rounded-2xl select-none transition-all ${rs === 'matched' ? 'opacity-50 cursor-default border-b-[2px] translate-y-[4px]' : rs === 'idle' ? 'cursor-pointer hover:bg-slate-50 active:border-b-2 active:translate-y-[4px]' : 'cursor-pointer'} ${rStyle.bg} ${rStyle.text} ${rStyle.border}`}
                animate={rs === 'wrong' ? { x: [0, 9, -9, 6, -6, 3, -3, 0] } : {}}
                transition={{ duration: 0.45 }}
              >
                <span className="text-sm font-bold leading-snug">{ri.text}</span>
              </motion.button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ─── Results Screen ───────────────────────────────────────────────────────────
const ResultsScreen = ({ score, total, xpEarned, lessonNum, totalLessons, onContinue }) => {
  const isPerfect = score === total;
  const pct = Math.round((score / Math.max(total, 1)) * 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      isPerfect
        ? confetti({ particleCount: 240, spread: 95, origin: { y: 0.45 } })
        : confetti({ particleCount: 110, spread: 70, origin: { y: 0.5 } });
    }, 80);
    return () => clearTimeout(timer);
  }, [isPerfect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-lg flex flex-col items-center space-y-5 p-4 min-h-screen"
      style={{ backgroundColor: C.bg }}
    >
      <div className={`w-full bg-white ${btn3d} border-gray-200 p-6 flex flex-col items-center space-y-5`}>
        {/* Lesson badge */}
        <div className="text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 border-b-4"
          style={{ backgroundColor: C.doneGreen, borderColor: C.doneBorder, color: C.doneBorder }}>
          Lesson {lessonNum} of {totalLessons}
        </div>

        <NurMascot mood="celebrate" size={160} sparkles={true} />

        <h2 className="text-2xl font-extrabold text-slate-800 text-center">
          {isPerfect ? 'Perfect Score!' : 'Lesson Complete!'}
        </h2>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <div className="flex flex-col items-center gap-1 rounded-xl p-4 border-2 border-b-4 border-slate-100">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="text-xl font-black text-slate-800">{score}/{total}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Score</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl p-4 border-2 border-b-4 border-slate-100">
            <CheckCircle2 className="w-5 h-5" style={{ color: C.doneBorder }} />
            <span className="text-xl font-black" style={{ color: C.doneBorder }}>{pct}%</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Accuracy</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl p-4 border-2 border-b-4 border-amber-100">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span className="text-xl font-black text-amber-600">+{xpEarned}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">XP</span>
          </div>
        </div>

        {/* Continue button */}
        <motion.button
          onClick={onContinue}
          whileHover={{ scale: 1.02 }}
          className={`w-full py-4 font-black text-xl text-white ${btn3d} border-b-[6px]`}
          style={{ backgroundColor: C.teal, borderColor: C.tealDark }}
        >
          Continue
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── Lesson Badge ─────────────────────────────────────────────────────────────
const LessonBadge = ({ lessonIndex, totalLessons, qIdx, qTotal }) => (
  <div className="w-full flex items-center justify-between px-1 mb-1">
    <span
      className="text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-b-4"
      style={{ backgroundColor: C.doneGreen, borderColor: C.doneBorder, color: C.doneBorder }}
    >
      Lesson {lessonIndex + 1} of {totalLessons}
    </span>
    <span className="text-xs font-bold text-slate-400">{qIdx + 1} / {qTotal}</span>
  </div>
);

// ─── Quiz (main export) ───────────────────────────────────────────────────────
const Quiz = ({
  words = [],
  lessonIndex = 0,
  totalLessons = 1,
  unitKey = 'unit',
  onComplete = () => {},
  onContinue = () => {},
}) => {
  const { completeLesson } = useUserStore();
  const safeWords = useMemo(() => (Array.isArray(words) ? words.filter(Boolean) : []), [words]);

  const [workingQueue, setWorkingQueue] = useState(() => buildQuestionQueue(safeWords));
  const [qIdx, setQIdx] = useState(0);
  const [mcqAnswered, setMcqAnswered] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [initialTotal, setInitialTotal] = useState(() => buildQuestionQueue(safeWords).length);
  const [showResults, setShowResults] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

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
  const progressPct = initialTotal > 0 ? Math.min((qIdx / initialTotal) * 100, 100) : 0;

  const advance = useCallback((wasCorrect, wrongWord) => {
    setWorkingQueue((prev) => {
      const next = [...prev];
      if (!wasCorrect && wrongWord) next.push({ type: 'mcq', word: wrongWord, isRetry: true });
      return next;
    });
    setQIdx((i) => i + 1);
    setMcqAnswered(null);
  }, []);

  const finishQuiz = useCallback((finalCorrect) => {
    const result = completeLesson(unitKey, lessonIndex, totalLessons, finalCorrect, initialTotal);
    setXpEarned(result?.xpEarned ?? 0);
    onComplete(finalCorrect, initialTotal);
    const isPerfect = finalCorrect === initialTotal;
    setTimeout(() => {
      isPerfect
        ? confetti({ particleCount: 240, spread: 95, origin: { y: 0.45 } })
        : confetti({ particleCount: 110, spread: 70, origin: { y: 0.5 } });
    }, 100);
    setShowResults(true);
    setTimeout(() => setResultsReady(true), 500);
  }, [completeLesson, unitKey, lessonIndex, totalLessons, initialTotal, onComplete]);

  useEffect(() => {
    if (!showResults && workingQueue.length > 0 && qIdx >= workingQueue.length) {
      finishQuiz(correctCount);
    }
  }, [qIdx, workingQueue.length, showResults, correctCount, finishQuiz]);

  const handleMCQAnswer = (correct) => {
    if (!currentQuestion?.word) return;
    setMcqAnswered({ correct });
    if (correct && !currentQuestion.isRetry) setCorrectCount((c) => c + 1);
  };

  const handleMCQNext = () => {
    if (!mcqAnswered) return;
    advance(mcqAnswered.correct, mcqAnswered.correct ? null : currentQuestion?.word);
  };

  const handleMatchComplete = useCallback((matchScore, matchTotal) => {
    if (!currentQuestion?.isRetry) setCorrectCount((c) => c + (matchScore === matchTotal ? 1 : 0));
    advance(matchScore === matchTotal, null);
  }, [advance, currentQuestion]);

  // ── Loading spinner ──
  if (!currentQuestion || safeWords.length === 0) {
    if (showResults) {
      if (!resultsReady) {
        return (
          <div className="w-full flex justify-center p-8">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-200 animate-spin border-t-[#58CC02]" />
          </div>
        );
      }
      return (
        <ResultsScreen
          score={correctCount}
          total={initialTotal}
          xpEarned={xpEarned}
          lessonNum={lessonIndex + 1}
          totalLessons={totalLessons}
          onContinue={onContinue}
        />
      );
    }
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 animate-spin mb-4"
          style={{ borderTopColor: C.teal }} />
        <p className="text-gray-500 font-medium">Loading quiz...</p>
      </div>
    );
  }

  // ── Results ──
  if (showResults) {
    if (!resultsReady) {
      return (
        <div className="w-full flex justify-center p-8">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-200 animate-spin border-t-[#58CC02]" />
        </div>
      );
    }
    return (
      <ResultsScreen
        score={correctCount}
        total={initialTotal}
        xpEarned={xpEarned}
        lessonNum={lessonIndex + 1}
        totalLessons={totalLessons}
        onContinue={onContinue}
      />
    );
  }

  // ── MCQ ──
  if (currentQuestion.type === 'mcq') {
    const word = currentQuestion.word;
    const isCorrect = mcqAnswered?.correct;
    const nextBtnLabel = mcqAnswered
      ? isCorrect
        ? qIdx < workingQueue.length - 1 ? 'Next' : 'Continue'
        : 'Got it'
      : '';

    return (
      <div
        className="w-full max-w-lg flex flex-col items-center space-y-4 p-4 min-h-screen"
        style={{ backgroundColor: C.bg }}
      >
        <LessonBadge
          lessonIndex={lessonIndex}
          totalLessons={totalLessons}
          qIdx={qIdx}
          qTotal={workingQueue.length}
        />

        {/* Progress bar */}
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: C.doneBorder }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`mcq-${qIdx}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            className={`w-full bg-white ${btn3d} border-gray-200 p-6 flex flex-col items-center space-y-5`}
          >
            {/* Quiz label */}
            <div className="text-xs font-black uppercase text-slate-400 tracking-widest">Quiz</div>

            {/* Arabic word */}
            <div className="text-center py-2">
              <span
                className="text-6xl font-bold text-slate-800"
                style={{ fontFamily: 'Amiri, serif' }}
                dir="rtl"
              >
                {word?.word}
              </span>
            </div>

            <MCQQuestion word={word} allWords={safeWords} onAnswer={handleMCQAnswer} />

            {/* Next / Got it / Continue button */}
            <AnimatePresence>
              {mcqAnswered && (
                <motion.button
                  key="next-btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleMCQNext}
                  className={`w-full py-4 font-black text-xl text-white flex items-center justify-center gap-2 ${btn3d} border-b-[6px]`}
                  style={{
                    backgroundColor: isCorrect ? C.doneBorder : C.errorBorder,
                    borderColor: isCorrect ? '#166534' : C.errorDark,
                  }}
                >
                  {nextBtnLabel}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Match ──
  return (
    <div
      className="w-full max-w-lg flex flex-col items-center space-y-4 p-4 min-h-screen"
      style={{ backgroundColor: C.bg }}
    >
      <LessonBadge
        lessonIndex={lessonIndex}
        totalLessons={totalLessons}
        qIdx={qIdx}
        qTotal={workingQueue.length}
      />

      {/* Progress bar */}
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: C.teal }}
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
          className={`w-full bg-white ${btn3d} border-gray-200 p-6 flex flex-col items-center space-y-4`}
        >
          <div className="text-xs font-black uppercase text-slate-400 tracking-widest">
            Match the Words
          </div>
          <MatchingPairs words={currentQuestion.words} onComplete={handleMatchComplete} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Quiz;