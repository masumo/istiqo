import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ── Translations (inline, canonical source of truth) ─────────────────────────
export const translations = {
  en: {
    welcome: 'Welcome to Istiqo',
    appSubtitle: 'Top 300 High-Frequency Quranic Words',
    languageSelect: 'Select Language',
    dailyGoal: 'Your Daily Goal',
    notification: 'Notification Time',
    wordsPerDay: 'words / day',
    continue: 'Continue',
    startJourney: 'Start Journey',
    bookmark: 'Bookmark',
    learned: 'Learned',
    next: 'Next',
    prev: 'Previous',
    settings: 'Settings',
    streak: 'Streak',
    xp: 'XP',
    notificationsPermission: 'Request Notification Permission',
    notificationTime: 'Select Notification Time',
    loading_verse: 'Loading verse...',
    loading_audio: 'Loading audio...',
    audio_error: 'Audio unavailable',
    audio_loading: 'Loading audio...',
    mnemonic: { show: '💡 Memory Trick', hide: 'Hide Mnemonic' },
    navigation: { back: 'Back', next: 'Next' },
    stats: { streak: 'Streak', xp: 'XP', words: 'Words' },
    unit: {
      completed: '✓ Completed',
      active: 'Active',
      locked: '🔒 Locked',
      available: 'Available',
      review: 'Review',
      continue: 'Continue',
      start: 'Start',
    },
    lesson: {
      label: 'Lesson',
      of: 'of',
      completed: 'Lesson Complete!',
      perfect: 'Perfect Score! 🌟',
    },
    quiz: {
      title: 'Quiz',
      score: 'Score',
      perfect_score: 'Perfect! 🌟',
      completed: 'Lesson Complete!',
      continue: 'Continue',
      matchTitle: 'Match the Words',
    },
    celebration: {
      title: '🎉 Daily Goal Achieved!',
      description: "Amazing! You've learned {wordsLearned} words today!",
      continue: 'Continue',
    },
    goals: {
      casual: { label: 'Relaxed', description: '5 words/day' },
      serious: { label: 'Serious', description: '10 words/day' },
      intense: { label: 'Intensive', description: '15 words/day' },
    },
    noActiveUnit: 'No active unit.',
    back: 'Back',
    languages: { indonesian: 'Bahasa Indonesia', english: 'English' },
  },
  id: {
    welcome: 'Selamat Datang di Istiqo',
    appSubtitle: '300 Kata Paling Sering dalam Al-Quran',
    languageSelect: 'Pilih Bahasa',
    dailyGoal: 'Target Harian Anda',
    notification: 'Waktu Notifikasi',
    wordsPerDay: 'kata / hari',
    continue: 'Lanjutkan',
    startJourney: 'Mulai Perjalanan',
    bookmark: 'Simpan',
    learned: 'Telah Dipelajari',
    next: 'Selanjutnya',
    prev: 'Sebelumnya',
    settings: 'Pengaturan',
    streak: 'Streak',
    xp: 'XP',
    notificationsPermission: 'Minta Izin Notifikasi',
    notificationTime: 'Pilih Waktu Notifikasi',
    loading_verse: 'Memuat ayat...',
    loading_audio: 'Memuat audio...',
    audio_error: 'Audio tidak tersedia',
    audio_loading: 'Memuat audio...',
    mnemonic: { show: '💡 Cara Mengingat', hide: 'Sembunyikan Mnemonik' },
    navigation: { back: 'Kembali', next: 'Lanjut' },
    stats: { streak: 'Streak', xp: 'XP', words: 'Kata' },
    unit: {
      completed: '✓ Selesai',
      active: 'Aktif',
      locked: '🔒 Terkunci',
      available: 'Tersedia',
      review: 'Review',
      continue: 'Lanjut',
      start: 'Start',
    },
    lesson: {
      label: 'Lesson',
      of: 'dari',
      completed: 'Lesson Selesai!',
      perfect: 'Nilai Sempurna! 🌟',
    },
    quiz: {
      title: 'Kuis',
      score: 'Skor',
      perfect_score: 'Sempurna! 🌟',
      completed: 'Lesson Selesai!',
      continue: 'Lanjutkan',
      matchTitle: 'Cocokkan Kata',
    },
    celebration: {
      title: '🎉 Target Harian Tercapai!',
      description: 'Luar biasa! Kamu sudah belajar {wordsLearned} kata hari ini!',
      continue: 'Lanjutkan',
    },
    goals: {
      casual: { label: 'Santai', description: '5 kata/hari' },
      serious: { label: 'Serius', description: '10 kata/hari' },
      intense: { label: 'Intensif', description: '15 kata/hari' },
    },
    noActiveUnit: 'Tidak ada Unit aktif.',
    back: 'Kembali',
    languages: { indonesian: 'Bahasa Indonesia', english: 'English' },
  },
};

/**
 * t(lang, key) — traverse nested translations by dot-path.
 * Falls back to EN, then returns the bare key.
 * Supports {param} replacement via optional `params` object.
 */
export const t = (lang, key, params = {}) => {
  const parts = String(key).split('.');
  const resolve = (obj) => {
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[p];
    }
    return typeof cur === 'string' ? cur : undefined;
  };

  const dict = translations[lang] || translations.en;
  let result = resolve(dict) ?? resolve(translations.en) ?? key;

  if (typeof result === 'string' && Object.keys(params).length) {
    Object.entries(params).forEach(([k, v]) => {
      result = result.replace(`{${k}}`, v);
    });
  }
  return result;
};

// ── Date helpers ──────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);

const daysBetween = (a, b) => {
  if (!a || !b) return Infinity;
  return Math.round(Math.abs(new Date(b) - new Date(a)) / 86_400_000);
};

// ── Lesson layout helper ──────────────────────────────────────────────────────
/**
 * Splits a unit's words into 4–5 Duolingo-style lessons with spaced repetition.
 * Lesson structure (example for a 13-word unit):
 *   L1: words 0-2   (3 new)
 *   L2: words 3-5 + review words 0-1   (3 new + 2 review)
 *   L3: words 6-8 + review words 2-4   (3 new + 2 review)
 *   L4: words 9-11 + review words 5-7  (3 new + 2 review)
 *   L5: word 12 + review words 8-12    (full review + final)
 *
 * Returns array of lesson objects: { lessonIndex, words: Word[] }
 */
export const buildLessons = (words) => {
  if (!Array.isArray(words) || words.length === 0) return [];

  const BATCH = 4;  // new words introduced per lesson
  const REVIEW = 3; // words carried over from previous lesson for revision

  const lessons = [];
  let i = 0;

  while (i < words.length) {
    const newWords    = words.slice(i, i + BATCH);
    const reviewStart = Math.max(0, i - REVIEW);
    const reviewWords = i === 0 ? [] : words.slice(reviewStart, i).slice(0, REVIEW);
    lessons.push({
      lessonIndex: lessons.length,
      words: [...reviewWords, ...newWords], // review first, then new
    });
    i += BATCH;
  }

  return lessons;
};

// ── Store ─────────────────────────────────────────────────────────────────────
export const useUserStore = create(
  persist(
    (set, get) => ({
      preferredLanguage: 'en',
      dailyGoal: 5,
      notificationTime: '07:00',
      isOnboarded: false,
      authToken: null,
      allowUserApiCalls: false,
      xp: 0,
      streak: 0,
      streakFreezeCount: 1,
      lastSessionDate: null,

      // Daily XP tracking
      dailyXP: 0,
      dailyXPDate: null,
      dailyWordsLearned: 0,
      dailyGoalCompleted: false,
      dailyGoalCompletedAt: null,

      // ── Lesson progress per unit ───────────────────────────────────────────
      // lessonProgress: { [unitKey]: { completedLessons: number[], totalLessons: number } }
      lessonProgress: {},

      // ── Setters ────────────────────────────────────────────────────────────
      setLanguage: (lang) => set({ preferredLanguage: lang }),
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      setNotificationTime: (time) => set({ notificationTime: time }),
      completeOnboarding: () => set({ isOnboarded: true }),
      setAuthToken: (token) => set({ authToken: token }),
      setAllowUserApiCalls: (allow) => set({ allowUserApiCalls: allow }),

      // ── Lesson completion ──────────────────────────────────────────────────
      /**
       * completeLesson — called when user taps "Continue" on the quiz results screen.
       * @param {string} unitKey   e.g. "1:1"
       * @param {number} lessonIdx zero-based index of the completed lesson
       * @param {number} totalLessons total lessons in this unit
       * @param {number} score    number of correct answers
       * @param {number} total    total questions
       * @returns {{ xpEarned: number, unitComplete: boolean }}
       */
      completeLesson: (unitKey, lessonIdx, totalLessons, score, total) => {
        // Guard clauses
        if (!unitKey || lessonIdx == null || isNaN(lessonIdx)) {
          return { xpEarned: 0, unitComplete: false };
        }
        const safeScore = Number(score) || 0;
        const safeTotal = Number(total) || 1;
        const safeLessonIdx = Number(lessonIdx);
        const safeTotalLessons = Number(totalLessons) || 1;

        const state = get();
        const today = todayKey();
        const isNewDay = state.dailyXPDate !== today;

        // XP: 10 per correct + 25 bonus for perfect
        const baseXP = safeScore * 10;
        const bonusXP = safeScore === safeTotal ? 25 : 0;
        const xpEarned = baseXP + bonusXP;

        const newDailyXP = isNewDay ? xpEarned : (state.dailyXP || 0) + xpEarned;
        const newTotalXP = (state.xp || 0) + xpEarned;

        // Words learned per lesson (count new words, not review)
        const newDailyWordsLearned = isNewDay
          ? safeScore
          : (state.dailyWordsLearned || 0) + safeScore;

        const goalReached = newDailyWordsLearned >= (state.dailyGoal || 5);
        const wasNotCompleted = !state.dailyGoalCompleted || isNewDay;

        // Update lesson progress
        const prev = state.lessonProgress?.[unitKey] || { completedLessons: [], totalLessons: safeTotalLessons };
        const completedSet = new Set(Array.isArray(prev.completedLessons) ? prev.completedLessons : []);
        completedSet.add(safeLessonIdx);

        const unitComplete = completedSet.size >= safeTotalLessons;

        set({
          xp: newTotalXP,
          dailyXP: newDailyXP,
          dailyXPDate: today,
          dailyWordsLearned: newDailyWordsLearned,
          dailyGoalCompleted: goalReached,
          dailyGoalCompletedAt:
            goalReached && wasNotCompleted
              ? new Date().toISOString()
              : state.dailyGoalCompletedAt,
          lessonProgress: {
            ...state.lessonProgress,
            [unitKey]: {
              completedLessons: Array.from(completedSet),
              totalLessons: safeTotalLessons,
            },
          },
        });

        return { xpEarned, unitComplete };
      },

      getLessonProgress: (unitKey) => {
        const state = get();
        return state.lessonProgress?.[unitKey] || { completedLessons: [], totalLessons: 0 };
      },

      isUnitFullyComplete: (unitKey, totalLessons) => {
        const state = get();
        const prog = state.lessonProgress?.[unitKey];
        if (!prog) return false;
        const completed = new Set(Array.isArray(prog.completedLessons) ? prog.completedLessons : []);
        return completed.size >= (totalLessons || prog.totalLessons || 1);
      },

      // ── Legacy quiz XP (used by Learn.jsx) ────────────────────────────────
      addXP: (amount) =>
        set((state) => {
          const today = todayKey();
          const isNewDay = state.dailyXPDate !== today;
          const amt = Number(amount) || 0;
          const newDailyXP = isNewDay ? amt : (state.dailyXP || 0) + amt;
          const newTotalXP = (state.xp || 0) + amt;
          const isCardLearning = amt === 1;
          const newDailyWordsLearned = isNewDay
            ? (isCardLearning ? 1 : 0)
            : (state.dailyWordsLearned || 0) + (isCardLearning ? 1 : 0);
          const goalReached = newDailyWordsLearned >= (state.dailyGoal || 5);
          const wasNotCompleted = !state.dailyGoalCompleted || isNewDay;
          return {
            xp: newTotalXP,
            dailyXP: newDailyXP,
            dailyXPDate: today,
            dailyWordsLearned: newDailyWordsLearned,
            dailyGoalCompleted: goalReached,
            dailyGoalCompletedAt:
              goalReached && wasNotCompleted
                ? new Date().toISOString()
                : state.dailyGoalCompletedAt,
          };
        }),

      recordUnitCompletion: (wordCount) => {
        const xpAmount = Number(wordCount) || 1;
        get().addXP(xpAmount);
        return xpAmount;
      },

      recordQuizCompletion: (correctAnswers, totalQuestions) => {
        const correct = Number(correctAnswers) || 0;
        const total = Number(totalQuestions) || 1;
        const baseXP = correct * 10;
        const bonusXP = correct === total ? 25 : 0;
        const totalXP = baseXP + bonusXP;

        const state = get();
        const today = todayKey();
        const isNewDay = state.dailyXPDate !== today;

        const newDailyXP = isNewDay ? totalXP : (state.dailyXP || 0) + totalXP;
        const newTotalXP = (state.xp || 0) + totalXP;
        const newDailyWordsLearned = isNewDay
          ? correct
          : (state.dailyWordsLearned || 0) + correct;
        const goalReached = newDailyWordsLearned >= (state.dailyGoal || 5);
        const wasNotCompleted = !state.dailyGoalCompleted || isNewDay;

        set({
          xp: newTotalXP,
          dailyXP: newDailyXP,
          dailyXPDate: today,
          dailyWordsLearned: newDailyWordsLearned,
          dailyGoalCompleted: goalReached,
          dailyGoalCompletedAt:
            goalReached && wasNotCompleted
              ? new Date().toISOString()
              : state.dailyGoalCompletedAt,
        });

        return totalXP;
      },

      // ── Daily progress ─────────────────────────────────────────────────────
      getDailyProgress: () => {
        const state = get();
        const today = todayKey();
        if (state.dailyXPDate !== today) return 0;
        return Math.min(((state.dailyWordsLearned || 0) / (state.dailyGoal || 5)) * 100, 100);
      },

      shouldCelebrateDailyGoal: () => {
        const state = get();
        const today = todayKey();
        if (!state.dailyGoalCompleted || state.dailyXPDate !== today) return false;
        if (state.dailyGoalCompletedAt) {
          const diffSeconds = (Date.now() - new Date(state.dailyGoalCompletedAt).getTime()) / 1000;
          return diffSeconds < 15;
        }
        return false;
      },

      acknowledgeDailyGoalCelebration: () => set({ dailyGoalCompletedAt: null }),

      syncDailyGoalFromAPI: (goalData) =>
        set({
          dailyGoal: goalData?.daily_goal ?? get().dailyGoal,
          dailyXP: goalData?.daily_xp ?? get().dailyXP,
          dailyXPDate: goalData?.date ?? get().dailyXPDate,
        }),

      // ── Streak ─────────────────────────────────────────────────────────────
      localIncrementStreak: () =>
        set((state) => {
          const today = todayKey();
          const last = state.lastSessionDate;
          if (last === today) return {};
          const gap = daysBetween(last, today);
          if (gap <= 1) return { streak: (state.streak || 0) + 1, lastSessionDate: today };
          if ((state.streakFreezeCount || 0) > 0)
            return {
              streak: (state.streak || 0) + 1,
              streakFreezeCount: (state.streakFreezeCount || 1) - 1,
              lastSessionDate: today,
            };
          return { streak: 1, lastSessionDate: today };
        }),

      updateStreak: (streakData) =>
        set({
          streak: streakData?.current_streak ?? get().streak,
          lastSessionDate: streakData?.last_read_at
            ? streakData.last_read_at.slice(0, 10)
            : get().lastSessionDate,
        }),

      setLastSessionDate: (date) => set({ lastSessionDate: date }),
      incrementStreak: () => set((state) => ({ streak: (state.streak || 0) + 1 })),
      resetStreak: () => set({ streak: 0 }),
    }),
    {
      name: 'istiqo-user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Keep legacy getTranslation export so other files importing from i18n.js still work,
// but also export the canonical `t` from here.
export default useUserStore;
