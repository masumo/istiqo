import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { ArrowLeft, Loader2, Flame } from 'lucide-react';
import WordCard from '../components/WordCard/WordCard';
import Quiz from '../components/Quiz/Quiz';
import NurMascot from '../components/NurMascot/NurMascot';
import { fetchVerseByKey, fetchRecitationAudio } from '../api/quranApi';
import { useUserStore } from '../store/userStore';
import { useVocabCurriculum } from '../hooks/useVocabCurriculum';
import { useRecordActivity } from '../hooks/useRecordActivity';
import { useStreakSync } from '../hooks/useStreakSync';
import { useDailyGoalSync } from '../hooks/useDailyGoalSync';
import { MNEMONICS } from '../utils/mnemonics';

const SECTION_NAMES = {
  1: 'Pondasi Utama',
  2: 'Penghubung Utama',
  3: 'Penguasaan Konteks',
  4: 'Kisah Para Nabi',
  5: 'Nuansa Lanjutan',
};

// ── Utilities ────────────────────────────────────────────────────────────────

const stripHtml = (str) => {
  if (!str) return '';
  return str
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
};

const normaliseArabic = (s) =>
  s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/[يى]/g, 'ي').replace(/ة/g, 'ه').trim();

const extractVerseSegment = (verseText, targetWord, windowWords = 4) => {
  if (!verseText || !targetWord) return { found: false, segment: '' };
  const words = verseText.split(/\s+/);
  const baseTarget = normaliseArabic(targetWord);
  if (!baseTarget) return { found: false, segment: '' };

  let foundIdx = -1;
  for (let i = 0; i < words.length; i++) {
    const w = normaliseArabic(words[i]);
    if (
      w === baseTarget ||
      w.startsWith(baseTarget) ||
      (baseTarget.length >= 2 && w.endsWith(baseTarget)) ||
      (baseTarget.length >= 3 && w.includes(baseTarget))
    ) {
      foundIdx = i;
      break;
    }
  }
  if (foundIdx === -1) return { found: false, segment: '' };
  const start = Math.max(0, foundIdx - windowWords);
  const end   = Math.min(words.length, foundIdx + windowWords + 1);
  const seg   = words.slice(start, end).join(' ');
  return {
    found: true,
    segment: (start > 0 ? '…' : '') + seg + (end < words.length ? '…' : ''),
  };
};

const getVersePayload = (data) => {
  if (!data) return null;
  if (data.verse)      return data.verse;
  if (data.verses?.[0]) return data.verses[0];
  return data;
};

// ── Streak Screen ────────────────────────────────────────────────────────────
const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const StreakScreen = ({ streak, onDone }) => {
  const todayIdx = new Date().getDay();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col items-center justify-center p-8 text-center space-y-8"
    >
      <NurMascot mood="streak" size={200} />

      <div className="space-y-3">
        <div className="text-7xl font-black text-orange-500">{streak}</div>
        <div className="text-2xl font-extrabold text-slate-800">
          hari berturut-turut! 🔥
        </div>
        <p className="text-slate-600 text-sm">
          Terus jaga konsistensimu — Nur selalu menemanimu!
        </p>
      </div>

      {/* Weekly tracker */}
      <div className="w-full max-w-xs bg-slate-800 rounded-3xl p-5 border border-slate-700">
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {DAYS_ID.map((d, i) => (
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
          Streakmu akan hilang jika kamu melewatkan hari esok. Jaga ya! 💪
        </p>
      </div>

      <button
        id="streak-done-btn"
        onClick={onDone}
        className="w-full max-w-xs py-5 bg-orange-500 text-white rounded-3xl font-extrabold text-xl shadow-2xl shadow-orange-500/30 hover:bg-orange-400 active:scale-95 transition-all"
      >
        Aku Berkomitmen! 🔥
      </button>
    </motion.div>
  );
};

// ── Learn page ────────────────────────────────────────────────────────────────
const Learn = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase]   = useState('cards'); // 'cards' | 'quiz' | 'streak'
  const [xpFeedback, setXpFeedback] = useState(null);

  const {
    preferredLanguage,
    recordUnitCompletion,
    streak,
  } = useUserStore();

  const { currentSessionWords, currentUnit, setView, finishUnit } = useVocabCurriculum();
  const recordActivity  = useRecordActivity();
  const syncStreak      = useStreakSync();
  const { updateDailyProgress } = useDailyGoalSync();

  // ── Session words ─────────────────────────────────────────────────────────
  // Use all session words (lesson's words, already trimmed in Home.jsx)
  const sessionWords = currentSessionWords;
  const currentWord  = sessionWords[currentIndex] || null;

  // ── Lesson meta from currentUnit ──────────────────────────────────────────
  const lessonIndex   = currentUnit?.lessonIndex   ?? 0;
  const totalLessons  = currentUnit?.totalLessons  ?? 1;
  const unitKey       = currentUnit?.unitKey       ?? `${currentUnit?.section}:${currentUnit?.unit}`;

  // ── Verse + Audio queries ─────────────────────────────────────────────────
  const { data: verseData, isLoading: isVerseLoading, error: verseError } = useQuery({
    queryKey: ['verseByKey', currentWord?.context_verse, preferredLanguage],
    queryFn:  () => fetchVerseByKey(currentWord.context_verse, preferredLanguage),
    enabled:  Boolean(currentWord?.context_verse),
    staleTime: Infinity,
    retry: 1,
  });

  const { data: audioData, isLoading: isAudioLoading, error: audioError } = useQuery({
    queryKey: ['recitationAudio', currentWord?.context_verse],
    queryFn:  () => fetchRecitationAudio(currentWord.context_verse, 7),
    enabled:  Boolean(currentWord?.context_verse),
    staleTime: Infinity,
    retry: 2,
  });

  const verse = getVersePayload(verseData);

  const wordCardData = useMemo(() => {
    if (!currentWord) return null;
    const [surahNumber, ayahNumber] = String(currentWord.context_verse || '1:1').split(':');
    const AUDIO_BASE = 'https://verses.quran.com/';

    let audioUrl = null;
    if (audioData?.audio_files?.[0]) {
      const f = audioData.audio_files[0];
      audioUrl = f.url || f.audio_url;
      if (audioUrl && !audioUrl.startsWith('http')) audioUrl = AUDIO_BASE + audioUrl;
    }
    if (!audioUrl && verse?.audio) {
      audioUrl = verse.audio.url || verse.audio.audio_url;
      if (audioUrl && !audioUrl.startsWith('http')) audioUrl = AUDIO_BASE + audioUrl;
    }

    const verseFullText = verse?.text_uthmani || '';
    const rawTranslation = (verse?.translations && verse.translations[0]?.text) || '';
    const cleanTranslation = stripHtml(rawTranslation);

    // Try to find the target word in the verse for a focused snippet.
    // If not found, fall back to a truncated verse (first 10 words + ellipsis)
    // so the verse section never renders as an empty gap.
    const { found, segment } = extractVerseSegment(verseFullText, currentWord.word);

    let verseArabic = '';
    let verseTranslation = '';

    if (verseFullText) {
      if (found) {
        verseArabic = segment;
        // Trim translation to roughly proportional length (first 15 words)
        if (cleanTranslation) {
          const tranWords = cleanTranslation.split(/\s+/);
          verseTranslation = tranWords.length > 15
            ? tranWords.slice(0, 15).join(' ') + '…'
            : cleanTranslation;
        }
      } else {
        // Fallback: show first 10 Arabic words + ellipsis
        const allWords = verseFullText.split(/\s+/);
        verseArabic = allWords.length > 10
          ? allWords.slice(0, 10).join(' ') + ' …'
          : verseFullText;
        // Show first 12 translation words
        if (cleanTranslation) {
          const tranWords = cleanTranslation.split(/\s+/);
          verseTranslation = tranWords.length > 12
            ? tranWords.slice(0, 12).join(' ') + '…'
            : cleanTranslation;
        }
      }
    }

    return {
      id:              currentWord.rank,
      rank:            currentWord.rank,
      section:         currentWord.section,
      arabic:          currentWord.word,
      transliteration: currentWord.transliteration || '',
      translation:     currentWord.translation?.[preferredLanguage] || currentWord.translation?.id || currentWord.translation?.en || '',
      verseArabic:     verseArabic,
      verseTranslation: verseTranslation,
      surahName:       `Surah ${surahNumber}`,
      ayahNumber:      Number(ayahNumber || 0),
      audioUrl,
      audioError:      audioError ? 'Audio tidak tersedia' : null,
      mnemonic:        MNEMONICS[currentWord.rank] || null,
    };
  }, [currentWord, preferredLanguage, verse, audioData, audioError]);

  // Quiz words — use language-correct translation field
  const quizWords = useUserStore(state => state.currentQuizWords);
  
  const mappedQuizWords = useMemo(() => {
    const sourceWords = quizWords?.length > 0 ? quizWords : sessionWords;
    return sourceWords.map((w) => ({
      word: w.word,
      arabic: w.word,
      translation: w.translation || {},
    }));
  }, [quizWords, sessionWords]);

  // ── XP pop feedback ───────────────────────────────────────────────────────
  const showXPFeedback = (amount) => {
    setXpFeedback(amount);
    setTimeout(() => setXpFeedback(null), 1000);
  };

  // ── Card nav ──────────────────────────────────────────────────────────────
  const handlePrev = () => {
    if (phase !== 'cards') return;
    setCurrentIndex((i) => (i > 0 ? i - 1 : 0));
  };

  const handleNext = () => {
    if (phase !== 'cards') return;
    if (currentIndex < sessionWords.length - 1) {
      setCurrentIndex((i) => i + 1);
      const xpEarned = recordUnitCompletion(1);
      showXPFeedback(xpEarned);
      return;
    }
    setPhase('quiz');
  };

  // ── Quiz completion ───────────────────────────────────────────────────────
  // Called by Quiz after internal results screen; XP already saved by completeLesson()
  const handleQuizComplete = async (score) => {
    // Mark unit words as learned in vocabStore (no XP call — Quiz already did it)
    finishUnit({ score });
    await syncStreak();
    await updateDailyProgress();

    // Record activity for analytics (non-blocking)
    if (currentUnit) {
      recordActivity({
        type:    'unit_completed',
        section: currentUnit.section,
        unit:    currentUnit.unit,
        score,
        words:   sessionWords.map((w) => ({ rank: w.rank, word: w.word })),
      }).catch(() => {});
    }
  };

  // Called by Quiz's "Lanjut" button (after results screen)
  const handleQuizContinue = () => {
    setPhase('streak');
  };

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!currentUnit || sessionWords.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ backgroundColor: '#F6F3E6' }}>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 max-w-md w-full">
          <div className="text-2xl font-extrabold text-slate-800">Tidak ada unit aktif.</div>
          <button
            onClick={() => setView('home')}
            className="mt-6 w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const sectionName = SECTION_NAMES[currentUnit.section] || `Bagian ${currentUnit.section}`;

  // ── Phase: quiz ───────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    return (
      <div className="min-h-screen flex flex-col items-center py-8 px-4" style={{ backgroundColor: '#F6F3E6' }}>
        {/* Header */}
        <div className="w-full max-w-lg flex items-center justify-between mb-6">
          <button
            onClick={() => setPhase('cards')}
            className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="text-sm font-bold text-slate-600 uppercase tracking-widest">
            Kuis
          </div>
          <div className="w-12" />
        </div>

        {/* Full progress bar */}
        <div className="w-full max-w-lg h-3 bg-slate-200 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-amber-400 rounded-full w-full" />
        </div>

        <Quiz
          words={mappedQuizWords}
          lessonIndex={lessonIndex}
          totalLessons={totalLessons}
          unitKey={unitKey}
          onComplete={handleQuizComplete}
          onContinue={handleQuizContinue}
          lang={preferredLanguage}
          exerciseType="auto"
        />
      </div>
    );
  }

  // ── Phase: streak ─────────────────────────────────────────────────────────
  if (phase === 'streak') {
    return (
      <StreakScreen
        streak={streak}
        onDone={() => setView('home')}
      />
    );
  }

  // ── Phase: cards ─────────────────────────────────────────────────────────
  const headerProgress = ((currentIndex + 1) / sessionWords.length) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4" style={{ backgroundColor: '#F6F3E6' }}>
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6">
        <button
          onClick={() => setView('home')}
          className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex flex-col items-center">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{sectionName}</div>
          <div className="text-sm font-extrabold text-slate-700">
            Unit {currentUnit.unit}
            <span className="ml-2 text-emerald-600 text-xs font-bold">
              P{lessonIndex + 1}/{totalLessons}
            </span>
          </div>
        </div>
        <div className="w-12" />
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg flex items-center gap-4 mb-8">
        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(headerProgress, 100)}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <span className="font-bold text-slate-500 text-sm tabular-nums">
          {currentIndex + 1}/{sessionWords.length}
        </span>
      </div>

      {/* XP pop */}
      <AnimatePresence>
        {xpFeedback && (
          <motion.div
            key="xp-pop"
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -24, scale: 1 }}
            exit={{ opacity: 0, y: -48 }}
            className="fixed top-24 right-6 bg-amber-400 text-white font-extrabold px-4 py-2 rounded-2xl shadow-lg z-50 text-sm pointer-events-none"
          >
            +{xpFeedback} XP ✨
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 70 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -70 }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          className="w-full flex justify-center"
        >
          {isVerseLoading || isAudioLoading ? (
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border-4 border-slate-50 p-10 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <div className="text-slate-500 font-bold">
                {isVerseLoading ? 'Memuat ayat...' : 'Memuat audio...'}
              </div>
            </div>
          ) : wordCardData ? (
            <WordCard
              wordData={wordCardData}
              onNext={handleNext}
              onPrev={handlePrev}
              preferredLanguage={preferredLanguage}
            />
          ) : (
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border-4 border-slate-50 p-10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Learn;
