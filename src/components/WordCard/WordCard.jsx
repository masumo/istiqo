import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Volume2, VolumeX, ChevronRight, ChevronLeft, Star, Lightbulb, AlertCircle } from 'lucide-react';
import { Howl } from 'howler';
import { getTranslation } from '../../utils/i18n';
import { isSoundEnabled, stopAllSFX } from '../../utils/sfx';
import { useUserStore } from '../../store/userStore';

// ── Section theming ───────────────────────────────────────────────────────────
const SECTION_LABELS = {
  1: { id: 'Pondasi',    en: 'Foundations', color: 'emerald' },
  2: { id: 'Penghubung', en: 'Connectors',  color: 'sky' },
  3: { id: 'Penguasaan', en: 'Mastery',     color: 'violet' },
  4: { id: 'Para Nabi',  en: 'Prophets',    color: 'amber' },
  5: { id: 'Nuansa',     en: 'Nuances',     color: 'rose' },
};

const SECTION_COLORS = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-100', mnemBg: 'bg-emerald-50', mnemBorder: 'border-emerald-200', mnemText: 'text-emerald-800' },
  sky:     { bg: 'bg-sky-500',     text: 'text-sky-700',     light: 'bg-sky-50',     border: 'border-sky-100',     mnemBg: 'bg-sky-50',     mnemBorder: 'border-sky-200',     mnemText: 'text-sky-800'     },
  violet:  { bg: 'bg-violet-500',  text: 'text-violet-700',  light: 'bg-violet-50',  border: 'border-violet-100',  mnemBg: 'bg-violet-50',  mnemBorder: 'border-violet-200',  mnemText: 'text-violet-800'  },
  amber:   { bg: 'bg-amber-500',   text: 'text-amber-700',   light: 'bg-amber-50',   border: 'border-amber-100',   mnemBg: 'bg-amber-50',   mnemBorder: 'border-amber-200',   mnemText: 'text-amber-800'   },
  rose:    { bg: 'bg-rose-500',    text: 'text-rose-700',    light: 'bg-rose-50',    border: 'border-rose-100',    mnemBg: 'bg-rose-50',    mnemBorder: 'border-rose-200',    mnemText: 'text-rose-800'    },
};

// ── Helper: highlight target word in Arabic text ──────────────────────────────
const highlightVerse = (verse, target) => {
  if (!verse || !target) return verse;
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripH = (s) => s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '');
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
  const pattern = base.split('').map((ch) => `${charClass(ch)}${diacritics}`).join('');
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
    ) : part
  );
};

// ── WordCard ──────────────────────────────────────────────────────────────────
const WordCard = ({ wordData, onNext, onPrev, preferredLanguage = 'id' }) => {
  // Derive mute state from global store so header toggle is reflected instantly
  const isAudioMuted = useUserStore((s) => s.isAudioMuted);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [audioError, setAudioError]     = useState(false);
  const soundRef      = useRef(null);
  const hasPlayedRef  = useRef(false);

  const sectionMeta = SECTION_LABELS[wordData.section] || SECTION_LABELS[1];
  const colors      = SECTION_COLORS[sectionMeta.color];
  const tr          = (key) => getTranslation(preferredLanguage, key);

  // Build Howl and auto-play once per card
  useEffect(() => {
    hasPlayedRef.current = false;
    setShowMnemonic(false);
    setAudioError(false);

    if (soundRef.current) {
      soundRef.current.unload();
      soundRef.current = null;
    }

    if (wordData.audioUrl) {
      const sound = new Howl({
        src: [wordData.audioUrl],
        html5: true,
        mute: isAudioMuted,
        onloaderror: (_id, err) => { console.error('Audio load error:', err); setAudioError(true); },
        onplayerror: (_id, err) => { console.error('Audio play error:', err); setAudioError(true); },
      });
      soundRef.current = sound;

      const tId = setTimeout(() => {
        if (!hasPlayedRef.current && !isAudioMuted && isSoundEnabled()) {
          sound.play();
          hasPlayedRef.current = true;
        }
      }, 300);

      return () => {
        clearTimeout(tId);
        sound.unload();
        soundRef.current = null;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordData.audioUrl]);

  // Sync mute state to Howl whenever global toggle changes; stop immediately if muted
  useEffect(() => {
    if (!soundRef.current) return;
    soundRef.current.mute(isAudioMuted);
    if (isAudioMuted && soundRef.current.playing()) {
      soundRef.current.stop();
    }
  }, [isAudioMuted]);

  const handleManualPlay = () => {
    if (isAudioMuted || !isSoundEnabled()) return;
    if (!soundRef.current) return;
    if (soundRef.current.playing()) soundRef.current.stop();
    soundRef.current.mute(false);
    soundRef.current.play();
    hasPlayedRef.current = true;
  };

  // Resolve verse translation from multiple possible field names
  const verseTranslationText =
    wordData.verseTranslation ||
    wordData.translation_text ||
    wordData.verse_translation ||
    null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 border-slate-50 relative flex flex-col"
    >
      {/* ─ Top Controls ──────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center px-4 py-3 flex-none">
        {/* Rank + Section Badge */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-bold ${colors.bg} shadow-sm`}>
            <Star className="w-3 h-3 fill-white" />
            <span className="text-xs sm:text-sm font-medium">#{wordData.rank}</span>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium ${colors.light} ${colors.text} border ${colors.border}`}>
            {sectionMeta[preferredLanguage] || sectionMeta.en}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleManualPlay}
            className="p-2 bg-slate-100/80 backdrop-blur-sm rounded-full text-slate-600 hover:bg-slate-200 transition-all"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsBookmarked((b) => !b)}
            className={`p-2 rounded-full transition-all ${
              isBookmarked ? `${colors.bg} text-white` : 'bg-slate-100/80 backdrop-blur-sm text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* ─ Scrollable Main Content ────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-3 flex flex-col items-center gap-3 text-center">

        {/* Audio Error */}
        {(audioError || wordData.audioError) && (
          <div className="w-full bg-orange-50 border-2 border-orange-200 rounded-2xl px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <p className="text-xs text-orange-700 font-medium">
              {wordData.audioError || tr('audio_error')}
            </p>
          </div>
        )}

        {/* Arabic word */}
        <div className="space-y-1">
          <button onClick={handleManualPlay} className="group focus:outline-none">
            <h2
              className="text-4xl sm:text-5xl font-bold text-slate-800 leading-relaxed group-hover:opacity-75 transition-opacity"
              style={{ fontFamily: 'Amiri, serif' }}
              dir="rtl"
            >
              {wordData.arabic}
            </h2>
          </button>
          {wordData.transliteration && (
            <p className="text-base sm:text-lg text-slate-400 font-medium italic tracking-wide">
              {wordData.transliteration}
            </p>
          )}
        </div>

        {/* Translation */}
        <div className={`${colors.light} px-4 py-3 rounded-2xl border-2 ${colors.border} w-full`}>
          <p className={`text-lg sm:text-xl font-semibold ${colors.text}`}>
            {wordData.translation || <span className="text-slate-400 italic text-sm">—</span>}
          </p>
        </div>

        {/* Context Verse */}
        {wordData.verseArabic ? (
          <div className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
            <p className="text-xl sm:text-2xl leading-loose text-slate-700" style={{ fontFamily: 'Amiri, serif' }} dir="rtl">
              {highlightVerse(wordData.verseArabic, wordData.arabic)}
            </p>
            {/* Arti Ayat — always rendered when data is present */}
            {verseTranslationText && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed italic">
                  &ldquo;{verseTranslationText}&rdquo;
                </p>
                <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">
                  {wordData.surahName} : {wordData.ayahNumber}
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* Mnemonic */}
        {wordData.mnemonic && (
          <div className="w-full">
            <button
              onClick={() => setShowMnemonic((s) => !s)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 transition-all ${
                showMnemonic
                  ? `${colors.mnemBg} ${colors.mnemBorder}`
                  : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lightbulb
                  className={`w-4 h-4 ${showMnemonic ? colors.text : 'text-slate-400'}`}
                  fill={showMnemonic ? 'currentColor' : 'none'}
                />
                <span className={`text-sm sm:text-base font-bold ${showMnemonic ? colors.text : 'text-slate-500'}`}>
                  {showMnemonic ? tr('mnemonic.hide') : tr('mnemonic.show')}
                </span>
              </div>
              <span className="text-base">{wordData.mnemonic.emoji}</span>
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
                    {wordData.mnemonic.image && (
                      <img
                        src={wordData.mnemonic.image}
                        alt={`Mnemonic for ${wordData.arabic}`}
                        className="w-full h-36 object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className="px-4 py-3">
                      <p className={`text-sm sm:text-base leading-relaxed font-medium ${colors.mnemText}`}>
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
      <div className="flex border-t-4 border-slate-50 h-16 flex-none">
        <button
          onClick={onPrev}
          className="flex-1 flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all border-r-4 border-slate-50 font-bold uppercase tracking-widest text-xs sm:text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          {tr('navigation.back')}
        </button>
        <button
          onClick={onNext}
          className={`flex-1 flex items-center justify-center gap-1.5 ${colors.text} hover:opacity-80 transition-all font-bold uppercase tracking-widest text-xs sm:text-sm`}
        >
          {tr('navigation.next')}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default WordCard;
