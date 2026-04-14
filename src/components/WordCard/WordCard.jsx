import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Volume2, VolumeX, ChevronRight, ChevronLeft, Star, Lightbulb, AlertCircle } from 'lucide-react';
import { Howl } from 'howler';
import { getTranslation } from '../../utils/i18n';

// ── Section theming ───────────────────────────────────────────────────────────
const SECTION_LABELS = {
  1: { label: 'Foundations',     color: 'emerald' },
  2: { label: 'Connectors',      color: 'sky' },
  3: { label: 'Mastery',         color: 'violet' },
  4: { label: 'Prophets',        color: 'amber' },
  5: { label: 'Nuances',         color: 'rose' },
};

const SECTION_COLORS = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-100', mnemBg: 'bg-emerald-50', mnemBorder: 'border-emerald-200', mnemText: 'text-emerald-800' },
  sky:     { bg: 'bg-sky-500',     text: 'text-sky-700',     light: 'bg-sky-50',     border: 'border-sky-100',     mnemBg: 'bg-sky-50',     mnemBorder: 'border-sky-200',     mnemText: 'text-sky-800'     },
  violet:  { bg: 'bg-violet-500',  text: 'text-violet-700',  light: 'bg-violet-50',  border: 'border-violet-100',  mnemBg: 'bg-violet-50',  mnemBorder: 'border-violet-200',  mnemText: 'text-violet-800'  },
  amber:   { bg: 'bg-amber-500',   text: 'text-amber-700',   light: 'bg-amber-50',   border: 'border-amber-100',   mnemBg: 'bg-amber-50',   mnemBorder: 'border-amber-200',   mnemText: 'text-amber-800'   },
  rose:    { bg: 'bg-rose-500',    text: 'text-rose-700',    light: 'bg-rose-50',    border: 'border-rose-100',    mnemBg: 'bg-rose-50',    mnemBorder: 'border-rose-200',    mnemText: 'text-rose-800'    },
};

// ── Helper: highlight target word in Arabic text ──────────────────────────────
const highlightVerse = (verse, target, colors) => {
  if (!verse || !target) return verse;
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripH = (s) =>
    s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '');
  const base = stripH(target).trim();
  if (!base) return verse;

  const charClass = (ch) => {
    if (ch === 'ا') return '[اأإآٱ]';
    if (ch === 'ي') return '[يىئ]';
    if (ch === 'و') return '[وؤ]';
    if (ch === 'ه') return '[هة]';
    return escapeRegex(ch);
  };

  const diacritics = '[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]*';
  const pattern = base
    .split('')
    .map((ch) => `${charClass(ch)}${diacritics}`)
    .join('');
  const splitRegex = new RegExp(`(${pattern})`, 'gu');
  const matchRegex = new RegExp(`^${pattern}$`, 'u');
  const parts = verse.split(splitRegex);

  return parts.map((part, i) =>
    matchRegex.test(part) ? (
      <span
        key={i}
        className="font-black bg-amber-400 text-slate-900 px-2 py-1 rounded-lg mx-0.5 ring-2 ring-amber-600 ring-offset-1 shadow-sm"
        style={{ display: 'inline-block', lineHeight: '1.8' }}
      >
        {part}
      </span>
    ) : (
      part
    )
  );
};

// ── WordCard ──────────────────────────────────────────────────────────────────
const WordCard = ({ wordData, onNext, onPrev, preferredLanguage = 'id' }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const soundRef = useRef(null);
  const hasPlayedRef = useRef(false);

  const sectionMeta = SECTION_LABELS[wordData.section] || SECTION_LABELS[1];
  const colors = SECTION_COLORS[sectionMeta.color];
  const t = (key) => getTranslation(preferredLanguage, key);

  // Build Howl and auto-play once per card
  useEffect(() => {
    hasPlayedRef.current = false;
    setShowMnemonic(false); // reset mnemonic panel on new card
    setAudioError(false);

    if (soundRef.current) {
      soundRef.current.unload();
      soundRef.current = null;
    }

    if (wordData.audioUrl) {
      const sound = new Howl({
        src: [wordData.audioUrl],
        html5: true,
        mute: isMuted,
        onloaderror: (id, error) => {
          console.error('Audio load error:', error);
          setAudioError(true);
        },
        onplayerror: (id, error) => {
          console.error('Audio play error:', error);
          setAudioError(true);
        },
      });
      soundRef.current = sound;

      const t = setTimeout(() => {
        if (!hasPlayedRef.current && !isMuted) {
          sound.play();
          hasPlayedRef.current = true;
        }
      }, 300);

      return () => {
        clearTimeout(t);
        sound.unload();
        soundRef.current = null;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordData.audioUrl]);

  // Sync mute without re-triggering play
  useEffect(() => {
    soundRef.current?.mute(isMuted);
  }, [isMuted]);

  const handleManualPlay = () => {
    if (!soundRef.current) return;
    if (soundRef.current.playing()) soundRef.current.stop();
    soundRef.current.mute(isMuted);
    soundRef.current.play();
    hasPlayedRef.current = true;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-slate-50 relative"
    >
      {/* ─ Top Controls ──────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center p-5 absolute top-0 left-0 right-0 z-10">
        {/* Rank + Section Badge */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold ${colors.bg} shadow-sm`}>
            <Star className="w-3 h-3 fill-white" />#{wordData.rank}
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${colors.light} ${colors.text} border ${colors.border}`}>
            {sectionMeta.label}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="p-2.5 bg-slate-100/80 backdrop-blur-sm rounded-full text-slate-600 hover:bg-slate-200 transition-all"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsBookmarked((b) => !b)}
            className={`p-2.5 rounded-full transition-all ${
              isBookmarked
                ? `${colors.bg} text-white`
                : 'bg-slate-100/80 backdrop-blur-sm text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bookmark className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* ─ Main Content ──────────────────────────────────────────────────── */}
      <div className="p-8 pt-24 flex flex-col items-center space-y-6 text-center">

        {/* Audio Error Message */}
        {(audioError || wordData.audioError) && (
          <div className="w-full bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <p className="text-sm text-orange-700 font-medium">
              {wordData.audioError || t('audio_error')}
            </p>
          </div>
        )}

        {/* Arabic word — tap to replay */}
        <div className="space-y-2">
          <button
            onClick={handleManualPlay}
            className="group focus:outline-none"
            title="Tap to replay"
          >
            <h2
              className="text-8xl font-amiri font-bold text-slate-800 leading-relaxed group-hover:opacity-75 transition-opacity"
              dir="rtl"
            >
              {wordData.arabic}
            </h2>
          </button>
          {wordData.transliteration && (
            <p className="text-xl text-slate-400 font-medium italic tracking-wide">
              {wordData.transliteration}
            </p>
          )}
        </div>

        {/* Translation */}
        <div className={`${colors.light} px-6 py-4 rounded-3xl border-2 ${colors.border} w-full`}>
          <p className={`text-2xl font-bold ${colors.text}`}>
            {wordData.translation || <span className="text-slate-400 italic text-base">—</span>}
          </p>
        </div>

        {/* Context Verse — only shown if word was found in the verse */}
        {wordData.verseArabic ? (
          <div className="w-full p-5 bg-slate-50 rounded-3xl border-2 border-slate-100">
            <p className="text-2xl font-amiri text-slate-700 leading-loose" dir="rtl">
              {highlightVerse(wordData.verseArabic, wordData.arabic, colors)}
            </p>
            {wordData.verseTranslation && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-sm text-slate-500 leading-relaxed italic">
                  &ldquo;{wordData.verseTranslation}&rdquo;
                </p>
                <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-widest">
                  {wordData.surahName} : {wordData.ayahNumber}
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* ─ Mnemonic Section ────────────────────────────────────────────── */}
        {wordData.mnemonic && (
          <div className="w-full">
            <button
              onClick={() => setShowMnemonic((s) => !s)}
              className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl border-2 transition-all ${
                showMnemonic
                  ? `${colors.mnemBg} ${colors.mnemBorder}`
                  : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lightbulb
                  className={`w-5 h-5 ${showMnemonic ? colors.text : 'text-slate-400'}`}
                  fill={showMnemonic ? 'currentColor' : 'none'}
                />
                <span className={`text-sm font-bold ${showMnemonic ? colors.text : 'text-slate-500'}`}>
                  {showMnemonic ? t('mnemonic.hide') : t('mnemonic.show')}
                </span>
              </div>
              <span className="text-lg">{wordData.mnemonic.emoji}</span>
            </button>

            <AnimatePresence>
              {showMnemonic && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className={`mt-2 rounded-2xl border-2 ${colors.mnemBg} ${colors.mnemBorder} overflow-hidden`}>
                    {/* Mnemonic image if available */}
                    {wordData.mnemonic.image && (
                      <img
                        src={wordData.mnemonic.image}
                        alt={`Mnemonic for ${wordData.arabic}`}
                        className="w-full h-44 object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    {/* Mnemonic text */}
                    <div className="px-5 py-4">
                      <p className={`text-sm leading-relaxed font-medium ${colors.mnemText}`}>
                        {wordData.mnemonic[preferredLanguage] || wordData.mnemonic.text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─ Navigation Footer ─────────────────────────────────────────────── */}
      <div className="flex border-t-4 border-slate-50 h-20">
        <button
          onClick={onPrev}
          className="flex-1 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all border-r-4 border-slate-50 font-bold uppercase tracking-widest text-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('navigation.back')}
        </button>
        <button
          onClick={onNext}
          className={`flex-1 flex items-center justify-center gap-2 ${colors.text} hover:opacity-80 transition-all font-bold uppercase tracking-widest text-sm`}
        >
          {t('navigation.next')}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default WordCard;
