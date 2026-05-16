import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NurMascot from '../NurMascot/NurMascot';
import ResultScreen from './ResultScreen';
import { useUserStore, getUIString } from '../../store/userStore';
import { getTranslation } from '../../utils/i18n';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  green: '#58CC02', greenDark: '#46A302',
  teal: '#37607D', tealDark: '#2A4B63',
  bg: '#F6F3E6', card: '#FFFFFF',
  doneGreen: '#D7FFB1', doneBorder: '#218151',
  errorRed: '#FFDFE0', errorBorder: '#C62828', errorDark: '#991b1b',
};

const btn3d = 'border-2 border-b-[6px] rounded-2xl active:border-b-2 active:translate-y-[4px] transition-all select-none';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getLabel = (word, lang) =>
  word?.translation?.[lang] || word?.translation?.id || word?.translation?.en || '';

const buildMCQOptions = (words, targetWord, lang) => {
  const correct = getLabel(targetWord, lang);
  const distractors = shuffle(
    words.filter((w) => getLabel(w, lang) !== correct)
  ).slice(0, 3).map((w) => getLabel(w, lang));
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

const formatMMSS = (secs) => {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
};

// ─── MCQ Question ─────────────────────────────────────────────────────────────
const MCQQuestion = ({ word, allWords, lang, onAnswer }) => {
  const options = useMemo(
    () => buildMCQOptions(allWords, word, lang),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [word, allWords, lang]
  );
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const correctLabel = getLabel(word, lang);

  const handleClick = (option) => {
    if (locked) return;
    setSelected(option);
    setLocked(true);
    onAnswer(option === correctLabel, option);
  };

  const optionStyle = (option) => {
    if (!locked) return {};
    const isSel = selected === option;
    const isOk  = option === correctLabel;
    if (isSel && isOk)  return { backgroundColor: C.doneGreen, color: C.doneBorder, borderColor: C.doneBorder };
    if (isSel && !isOk) return { backgroundColor: C.errorRed,  color: C.errorBorder, borderColor: C.errorBorder };
    if (!isSel && isOk) return { backgroundColor: C.doneGreen, color: C.doneBorder, borderColor: C.doneBorder };
    return {};
  };

  return (
    <div className="grid grid-cols-1 gap-3 w-full">
      {options.map((option, i) => (
        <motion.button
          key={i}
          onClick={() => handleClick(option)}
          disabled={locked}
          className={`w-full p-4 text-left font-bold text-base min-h-[56px] ${btn3d} ${
            !locked ? 'bg-white text-slate-700 border-gray-200 hover:bg-slate-50 cursor-pointer' : 'cursor-default'
          }`}
          style={optionStyle(option)}
          animate={locked && selected === option && option !== correctLabel ? { x: [0,-10,10,-7,7,-4,4,0] } : {}}
          transition={{ duration: 0.45 }}
        >
          {option}
        </motion.button>
      ))}
    </div>
  );
};

// ─── Matching Pairs ───────────────────────────────────────────────────────────
const MatchingPairs = ({ words, lang, onComplete }) => {
  const count = Math.min(words.length, 6);
  const pairs = useMemo(() => words.slice(0, count), [words, count]);
  const [leftItems]  = useState(() => pairs.map((w, i) => ({ id: i, text: w.word, pairId: i })));
  const [rightItems] = useState(() => shuffle(pairs.map((w, i) => ({ id: i, text: getLabel(w, lang), pairId: i }))));
  const [selLeft,  setSelLeft]  = useState(null);
  const [selRight, setSelRight] = useState(null);
  const [matched,  setMatched]  = useState(new Set());
  const [wrongLeft,  setWrongLeft]  = useState(null);
  const [wrongRight, setWrongRight] = useState(null);
  const [score, setScore] = useState(0);
  const [done,  setDone]  = useState(false);

  useEffect(() => {
    if (!done && matched.size === count) {
      setDone(true);
      setTimeout(() => onComplete(score, count), 500);
    }
  }, [matched, count, done, score, onComplete]);

  const tryMatch = useCallback((left, right) => {
    if (left.pairId === right.pairId) {
      setMatched((p) => new Set(p).add(left.pairId));
      setScore((s) => s + 1);
    } else {
      setWrongLeft(left.id); setWrongRight(right.id);
      setTimeout(() => { setWrongLeft(null); setWrongRight(null); }, 650);
    }
    setSelLeft(null); setSelRight(null);
  }, []);

  const handleLeft  = (item) => { if (matched.has(item.pairId) || wrongLeft !== null) return; const next = selLeft?.id === item.id ? null : item; setSelLeft(next); if (next && selRight) tryMatch(next, selRight); };
  const handleRight = (item) => { if (matched.has(item.pairId) || wrongRight !== null) return; const next = selRight?.id === item.id ? null : item; setSelRight(next); if (next && selLeft) tryMatch(selLeft, next); };

  const state = (item, side) => {
    if (matched.has(item.pairId)) return 'matched';
    if (side === 'left'  && wrongLeft  === item.id) return 'wrong';
    if (side === 'right' && wrongRight === item.id) return 'wrong';
    if (side === 'left'  && selLeft?.id  === item.id) return 'selected';
    if (side === 'right' && selRight?.id === item.id) return 'selected';
    return 'idle';
  };

  const cs = {
    idle:     ['bg-white','text-slate-700','border-gray-200'],
    selected: ['bg-[#E8F0F5]','text-[#37607D]','border-[#37607D]'],
    matched:  ['bg-[#D7FFB1]','text-[#218151]','border-[#218151]'],
    wrong:    ['bg-[#FFDFE0]','text-[#C62828]','border-[#C62828]'],
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 items-stretch">
        {pairs.map((_, i) => {
          const li = leftItems[i]; const ri = rightItems[i];
          const ls = state(li,'left'); const rs = state(ri,'right');
          const [lBg,lTx,lBd] = cs[ls]; const [rBg,rTx,rBd] = cs[rs];
          const dimmed = 'opacity-50 cursor-default border-b-[2px] translate-y-[4px]';
          return (
            <React.Fragment key={i}>
              <motion.button
                onClick={() => handleLeft(li)} disabled={matched.has(li.pairId)}
                className={`flex items-center justify-center p-3 text-center min-h-[110px] w-full border-2 border-b-[6px] rounded-2xl transition-all ${ls==='matched'?dimmed:ls==='idle'?'cursor-pointer hover:opacity-80 active:border-b-2 active:translate-y-[4px]':'cursor-pointer'} ${lBg} ${lTx} ${lBd}`}
                animate={ls==='wrong'?{x:[0,-9,9,-6,6,0]}:{}} transition={{duration:0.4}}
              >
                <span className="text-3xl font-bold leading-tight" style={{fontFamily:'Amiri, serif'}} dir="rtl">{li.text}</span>
              </motion.button>
              <motion.button
                onClick={() => handleRight(ri)} disabled={matched.has(ri.pairId)}
                className={`flex items-center justify-center p-3 text-center min-h-[110px] w-full border-2 border-b-[6px] rounded-2xl transition-all ${rs==='matched'?dimmed:rs==='idle'?'cursor-pointer hover:opacity-80 active:border-b-2 active:translate-y-[4px]':'cursor-pointer'} ${rBg} ${rTx} ${rBd}`}
                animate={rs==='wrong'?{x:[0,9,-9,6,-6,0]}:{}} transition={{duration:0.4}}
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

// ─── Lesson Badge ─────────────────────────────────────────────────────────────
const LessonBadge = ({ lessonIndex, totalLessons, qIdx, qTotal, lang }) => {
  const T = (k) => getTranslation(lang, k);
  return (
    <div className="w-full flex items-center justify-between px-1 mb-1">
      <span className="text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-b-4"
        style={{backgroundColor:C.doneGreen, borderColor:C.doneBorder, color:C.doneBorder}}>
        {T('lesson.label')} {lessonIndex+1} {T('lesson.of')} {totalLessons}
      </span>
      <span className="text-xs font-bold text-slate-400">{qIdx+1} / {qTotal}</span>
    </div>
  );
};


// ─── Transition Screen (Learning → Quiz) ─────────────────────────────────────
const TransitionScreen = ({ lang, wordsCount, onStartQuiz }) => {
  const s = (k) => getUIString(lang, k);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.45, type: 'spring', stiffness: 180 }}
      className="w-full min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ backgroundColor: C.bg }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        {/* Word count chip */}
        <div
          className="px-5 py-2 rounded-full text-sm font-black border-2 border-b-4 shadow"
          style={{ backgroundColor: C.doneGreen, borderColor: C.doneBorder, color: C.doneBorder }}
        >
          {wordsCount} {lang === 'en' ? 'words learned' : 'kata dipelajari'} 📖
        </div>

        {/* Mascot */}
        <NurMascot mood="reading" size={180} sparkles={true} />

        {/* Text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-800">{s('transitionTitle')}</h2>
          <p className="text-base font-semibold text-slate-500">{s('transitionDesc')}</p>
        </div>

        {/* Start Quiz CTA */}
        <motion.button
          onClick={onStartQuiz}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`w-full py-5 font-black text-xl text-white ${btn3d} border-b-[6px] mt-2`}
          style={{ backgroundColor: C.green, borderColor: C.greenDark }}
        >
          {s('startQuiz')} →
        </motion.button>
      </div>
    </motion.div>
  );
};

// QuizResultsPage is now ResultScreen — imported above

// ─── Quiz (main export) ───────────────────────────────────────────────────────
const Quiz = ({
  words = [],
  lessonIndex = 0,
  totalLessons = 1,
  unitKey = 'unit',
  onComplete = () => {},
  onContinue = () => {},
  lang,
}) => {
  const { completeLesson, preferredLanguage, startQuizTimer, getQuizElapsedSecs, clearQuizTimer } = useUserStore();
  const activeLang = lang || preferredLanguage || 'id';

  const safeWords = useMemo(
    () => (Array.isArray(words) ? words.filter(Boolean) : []),
    [words]
  );

  // 'transition' → 'quiz' → 'results'
  const [screen, setScreen] = useState('transition');

  const [workingQueue, setWorkingQueue] = useState(() => buildQuestionQueue(safeWords));
  const [qIdx,         setQIdx]         = useState(0);
  const [mcqAnswered,  setMcqAnswered]  = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [initialTotal]                  = useState(() => buildQuestionQueue(safeWords).length);
  const [xpEarned,     setXpEarned]     = useState(0);
  const [durationSecs, setDurationSecs] = useState(0);

  // Guard: ensure finishQuiz runs at most once per quiz session
  const finishedRef = useRef(false);

  // Reset when words change
  useEffect(() => {
    const q = buildQuestionQueue(safeWords);
    setWorkingQueue(q);
    setQIdx(0);
    setMcqAnswered(null);
    setCorrectCount(0);
    setScreen('transition');
    finishedRef.current = false; // reset guard for new session
  }, [safeWords]);

  const handleStartQuiz = () => {
    startQuizTimer();
    setScreen('quiz');
  };

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

  // Store latest values in refs so the finish effect never has stale captures
  // but also never re-fires due to reference churn.
  const storeRef = useRef({});
  storeRef.current = { getQuizElapsedSecs, clearQuizTimer, completeLesson, onComplete, unitKey, lessonIndex, totalLessons, initialTotal };

  useEffect(() => {
    if (screen !== 'quiz') return;
    if (workingQueue.length === 0) return;
    if (qIdx < workingQueue.length) return;
    if (finishedRef.current) return; // already finished — do not re-run
    finishedRef.current = true;

    const { getQuizElapsedSecs: elapsed, clearQuizTimer: clearTimer, completeLesson: complete,
            onComplete: done, unitKey: uk, lessonIndex: li, totalLessons: tl, initialTotal: it } = storeRef.current;

    const secs = elapsed();
    clearTimer();
    setDurationSecs(secs);
    const result = complete(uk, li, tl, correctCount, it);
    setXpEarned(result?.xpEarned ?? 0);
    done(correctCount, it);
    setScreen('results');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, workingQueue.length, screen]);

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

  const T = (k) => getTranslation(activeLang, k);

  // ── Transition screen ──
  if (screen === 'transition') {
    return (
      <TransitionScreen
        lang={activeLang}
        wordsCount={safeWords.length}
        onStartQuiz={handleStartQuiz}
      />
    );
  }

  // ── Results ──
  if (screen === 'results') {
    return (
      <ResultScreen
        score={correctCount}
        total={initialTotal}
        xpEarned={xpEarned}
        wordsCount={safeWords.length}
        durationSecs={durationSecs}
        onContinue={onContinue}
        lang={activeLang}
      />
    );
  }

  // ── Loading ──
  if (!currentQuestion || safeWords.length === 0) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-4" style={{ backgroundColor: C.bg }}>
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 animate-spin mb-4" style={{ borderTopColor: C.teal }} />
        <p className="text-gray-500 font-medium">{T('loading')}</p>
      </div>
    );
  }

  // ── MCQ ──
  if (currentQuestion.type === 'mcq') {
    const word = currentQuestion.word;
    const isCorrect = mcqAnswered?.correct;
    const nextLabel = mcqAnswered ? (isCorrect ? T('quiz.continue') : T('gotIt')) : '';

    return (
      <div className="w-full max-w-lg flex flex-col items-center space-y-4 p-4 min-h-screen" style={{ backgroundColor: C.bg }}>
        <LessonBadge lessonIndex={lessonIndex} totalLessons={totalLessons} qIdx={qIdx} qTotal={workingQueue.length} lang={activeLang} />
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: C.doneBorder }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`mcq-${qIdx}`}
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
            className={`w-full bg-white ${btn3d} border-gray-200 p-6 flex flex-col items-center space-y-5`}
          >
            <div className="text-xs font-black uppercase text-slate-400 tracking-widest">{T('quiz.title')}</div>
            <div className="text-center py-2">
              <span className="text-6xl font-bold text-slate-800" style={{ fontFamily: 'Amiri, serif' }} dir="rtl">
                {word?.word}
              </span>
            </div>
            <MCQQuestion word={word} allWords={safeWords} lang={activeLang} onAnswer={handleMCQAnswer} />
            <AnimatePresence>
              {mcqAnswered && (
                <motion.button
                  key="next-btn"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={handleMCQNext}
                  className={`w-full py-4 font-black text-xl text-white flex items-center justify-center gap-2 ${btn3d} border-b-[6px]`}
                  style={{ backgroundColor: isCorrect ? C.doneBorder : C.errorBorder, borderColor: isCorrect ? '#166534' : C.errorDark }}
                >
                  {nextLabel}
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
    <div className="w-full max-w-lg flex flex-col items-center space-y-4 p-4 min-h-screen" style={{ backgroundColor: C.bg }}>
      <LessonBadge lessonIndex={lessonIndex} totalLessons={totalLessons} qIdx={qIdx} qTotal={workingQueue.length} lang={activeLang} />
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: C.teal }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={`match-${qIdx}`}
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
          className={`w-full bg-white ${btn3d} border-gray-200 p-6 flex flex-col items-center space-y-4`}
        >
          <div className="text-xs font-black uppercase text-slate-400 tracking-widest">{T('quiz.matchTitle')}</div>
          <MatchingPairs words={currentQuestion.words} lang={activeLang} onComplete={handleMatchComplete} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Quiz;