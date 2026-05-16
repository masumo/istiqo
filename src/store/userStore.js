import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Section / Unit / Lesson Data ────────────────────────────────────────────
export const SECTIONS_DATA = [
  {
    section: 1,
    title:    { id: 'Pondasi Utama',    en: 'Core Foundation' },
    subtitle: { id: 'Kuasai 50 kata Al-Quran paling sering digunakan', en: 'Master the 50 most frequent Quranic words' },
    units: [1, 2, 3, 4],
    themeColor: '#37607D',
    accentColor: '#4A8BBF',
  },
];

export const getUnitsForSection = (sectionNum) => {
  const section = SECTIONS_DATA.find((s) => s.section === sectionNum);
  return section ? section.units.map((u) => ({ section: sectionNum, unit: u })) : [];
};

export const getSectionTitle = (sectionNum, lang = 'id') => {
  const section = SECTIONS_DATA.find((s) => s.section === sectionNum);
  if (!section) return lang === 'en' ? 'Section' : 'Bagian';
  return section.title?.[lang] ?? section.title?.id ?? 'Bagian';
};

export const getSectionSubtitle = (sectionNum, lang = 'id') => {
  const section = SECTIONS_DATA.find((s) => s.section === sectionNum);
  if (!section) return '';
  return section.subtitle?.[lang] ?? section.subtitle?.id ?? '';
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => {
  if (!a || !b) return Infinity;
  return Math.round(Math.abs(new Date(b) - new Date(a)) / 86_400_000);
};

export const buildLessons = (words) => {
  if (!Array.isArray(words) || words.length === 0) return [];
  const BATCH = 4, REVIEW = 3;
  const lessons = [];
  let i = 0;
  while (i < words.length) {
    const newWords = words.slice(i, i + BATCH);
    const reviewStart = Math.max(0, i - REVIEW);
    const reviewWords = i === 0 ? [] : words.slice(reviewStart, i).slice(0, REVIEW);
    lessons.push({ lessonIndex: lessons.length, words: [...reviewWords, ...newWords] });
    i += BATCH;
  }
  return lessons;
};

export const getUnitKey = (section, unit) => `${section}:${unit}`;

/** Returns true only when every lesson in every unit of the given section is complete. */
export const isSectionFullyComplete = (sectionNum, lessonProgress) => {
  const units = getUnitsForSection(sectionNum);
  return units.every(({ section, unit }) => {
    const key = getUnitKey(section, unit);
    const prog = lessonProgress?.[key];
    if (!prog) return false;
    const done = new Set(prog.completedLessons ?? []).size;
    return done >= (prog.totalLessons ?? 1);
  });
};

// ─── Bilingual UI strings ─────────────────────────────────────────────────────
const UI = {
  id: {
    streakLabel: 'Hari Beruntun',
    xpLabel: 'XP',
    dailyGoalLabel: 'Target Harian',
    settings: 'Pengaturan',
    start: 'Mulai',
    lessonLabel: 'Pelajaran',
    lessonOf: 'dari',
    lessonsDone: (done, total) => `${done}/${total} Pelajaran`,
    unitComplete: 'Unit Selesai!',
    locked: 'Terkunci',
    section: 'Bagian',
    progress: 'Progres',
    quizTitle: 'Kuis',
    matchTitle: 'Cocokkan Kata',
    wellDone: 'Luar Biasa!',
    perfectScore: 'Skor Sempurna!',
    lessonComplete: 'Pelajaran Selesai!',
    next: 'Lanjut',
    gotIt: 'Mengerti',
    score: 'Skor',
    accuracy: 'Akurasi',
    continue: 'Lanjut',
    loading: 'Memuat kuis...',
    languageSelect: 'Pilih Bahasa',
    dailyGoal: 'Target Harian',
    notification: 'Waktu Notifikasi',
    notificationTime: 'Waktu Pengingat',
    notificationsPermission: 'Izinkan Notifikasi',
    wordsPerDay: 'kata / hari',
    continueLabel: 'Lanjut',
    startJourney: 'Mulai Perjalanan',
    bookmark: 'Tandai',
    learned: 'Dipelajari',
    prev: 'Sebelumnya',
    back: 'Kembali',
    check: 'Cek',
    skip: 'Lewati',
    loadingVerse: 'Memuat ayat...',
    audioError: 'Audio tidak tersedia',
    audioLoading: 'Memuat audio...',
    mnemonicShow: 'Trik Ingatan',
    mnemonicHide: 'Sembunyikan',
    celebrationTitle: 'Target Harian Tercapai!',
    celebrationDesc: (n) => `Luar biasa! Kamu sudah belajar ${n} kata hari ini!`,
    noActiveUnit: 'Tidak ada unit aktif.',
    goalCasual: { label: 'Santai', description: '5 kata/hari' },
    goalSerious: { label: 'Serius', description: '10 kata/hari' },
    goalIntense: { label: 'Intensif', description: '15 kata/hari' },
    languages: { indonesian: 'Bahasa Indonesia', english: 'English' },
    yourJourney: 'Perjalananmu',
    unit: 'Unit',
    units: 'Unit',
    finishPrev: 'Selesaikan unit sebelumnya',
    done: 'Selesai ✓',
    pctDone: (p) => `${p}% selesai`,
    sectionOf: (n, total) => `Bagian ${n} dari ${total}`,
    section2: 'Bagian 2',
    section2Sub: 'Penghubung Utama',
    transitionTitle: 'Hebat! Kamu sudah mempelajari kata baru.',
    transitionDesc: 'Siap untuk kuis?',
    startQuiz: 'Mulai Kuis',
    resultsDone: 'Selesai',
    sfxToggle: 'Efek Suara',
    sfxOn: 'Nyala',
    sfxOff: 'Mati',
  },
  en: {
    streakLabel: 'Day Streak',
    xpLabel: 'XP',
    dailyGoalLabel: 'Daily Goal',
    settings: 'Settings',
    start: 'Start',
    lessonLabel: 'Lesson',
    lessonOf: 'of',
    lessonsDone: (done, total) => `${done}/${total} Lessons`,
    unitComplete: 'Unit Complete!',
    locked: 'Locked',
    section: 'Section',
    progress: 'Progress',
    quizTitle: 'Quiz',
    matchTitle: 'Match the Words',
    wellDone: 'Well Done!',
    perfectScore: 'Perfect Score!',
    lessonComplete: 'Lesson Complete!',
    next: 'Next',
    gotIt: 'Got it',
    score: 'Score',
    accuracy: 'Accuracy',
    continue: 'Continue',
    loading: 'Loading quiz...',
    languageSelect: 'Select Language',
    dailyGoal: 'Daily Goal',
    notification: 'Notification Time',
    notificationTime: 'Reminder Time',
    notificationsPermission: 'Allow Notifications',
    wordsPerDay: 'words / day',
    continueLabel: 'Continue',
    startJourney: 'Start Journey',
    bookmark: 'Bookmark',
    learned: 'Learned',
    prev: 'Previous',
    back: 'Back',
    check: 'Check',
    skip: 'Skip',
    loadingVerse: 'Loading verse...',
    audioError: 'Audio unavailable',
    audioLoading: 'Loading audio...',
    mnemonicShow: 'Memory Aid',
    mnemonicHide: 'Hide',
    celebrationTitle: 'Daily Goal Reached!',
    celebrationDesc: (n) => `Amazing! You've learned ${n} words today!`,
    noActiveUnit: 'No active unit.',
    goalCasual: { label: 'Casual', description: '5 words/day' },
    goalSerious: { label: 'Serious', description: '10 words/day' },
    goalIntense: { label: 'Intensive', description: '15 words/day' },
    languages: { indonesian: 'Bahasa Indonesia', english: 'English' },
    yourJourney: 'Your Journey',
    unit: 'Unit',
    units: 'Units',
    finishPrev: 'Complete the previous unit',
    done: 'Done ✓',
    pctDone: (p) => `${p}% done`,
    sectionOf: (n, total) => `Section ${n} of ${total}`,
    section2: 'Section 2',
    section2Sub: 'Key Connectors',
    transitionTitle: 'Great! You have learned the words.',
    transitionDesc: 'Ready for the quiz?',
    startQuiz: 'Start Quiz',
    resultsDone: 'Continue',
    sfxToggle: 'Sound Effects',
    sfxOn: 'On',
    sfxOff: 'Off',
  },
};

/** Get bilingual UI string by lang + key */
export const getUIString = (lang, key) => {
  const l = lang === 'en' ? 'en' : 'id';
  return UI[l][key] ?? UI.id[key] ?? key;
};

// ─── Backwards-compat t() shim ─────────────────────────────────────────────
export const translations = { id: {}, en: {} };
export const t = (_lang, key) => {
  const map = {
    'lesson.label': 'Pelajaran',
    'lesson.of': 'dari',
    'quiz.title': 'Kuis',
    'quiz.score': 'Skor',
    'quiz.perfect_score': 'Skor Sempurna!',
    'quiz.completed': 'Pelajaran Selesai!',
    'quiz.continue': 'Lanjut',
    'quiz.matchTitle': 'Cocokkan Kata',
    'loading_verse': 'Memuat ayat...',
    'loading_audio': 'Memuat audio...',
    'audio_error': 'Audio tidak tersedia',
    'noActiveUnit': 'Tidak ada unit aktif.',
    'back': 'Kembali',
  };
  return map[key] ?? key;
};

// ─── Compat uiStrings (Indonesian) ───────────────────────────────────────────
export const uiStrings = UI.id;

// ─── Store ────────────────────────────────────────────────────────────────────
export const useUserStore = create(
  persist(
    (set, get) => ({
      preferredLanguage: 'id',
      dailyGoal: 5,
      notificationTime: '07:00',
      isOnboarded: false,
      authToken: null,
      allowUserApiCalls: false,
      xp: 0,
      streak: 0,
      streakFreezeCount: 1,
      lastSessionDate: null,
      dailyXP: 0,
      dailyXPDate: null,
      dailyWordsLearned: 0,
      dailyGoalCompleted: false,
      dailyGoalCompletedAt: null,
      lastStreakClaimedDate: null,
      // Auth states
      user: null,
      authStatus: 'pending', // 'pending' | 'authenticated' | 'guest'
      guestCreatedAt: null,
      // { [unitKey]: { completedLessons: number[], totalLessons: number } }
      lessonProgress: {},
      currentQuizWords: [],
      // Quiz timer: timestamp when "Start Quiz" was pressed
      quizStartTime: null,
      isAudioMuted: false,

      setCurrentQuizWords: (words) => set({ currentQuizWords: words }),
      setLanguage: (lang) => set({ preferredLanguage: lang }),
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      setNotificationTime: (time) => set({ notificationTime: time }),
      completeOnboarding: () => set({ isOnboarded: true }),
      setAuthToken: (token) => set({ authToken: token }),
      setAllowUserApiCalls: (allow) => set({ allowUserApiCalls: allow }),
      toggleAudio: () => set((state) => ({ isAudioMuted: !state.isAudioMuted })),
      
      setUser: (user) => set({ user, authStatus: 'authenticated' }),
      setGuestMode: () => set((state) => ({ 
        authStatus: 'guest', 
        guestCreatedAt: state.guestCreatedAt || new Date().toISOString() 
      })),
      logout: () => set({ user: null, authStatus: 'guest', authToken: null }),

      // ── Quiz timer ────────────────────────────────────────────────────────
      startQuizTimer: () => set({ quizStartTime: Date.now() }),
      getQuizElapsedSecs: () => {
        const start = get().quizStartTime;
        if (!start) return 0;
        return Math.round((Date.now() - start) / 1000);
      },
      clearQuizTimer: () => set({ quizStartTime: null }),

      // ── Unit locking ──────────────────────────────────────────────────────
      isUnitLocked: (sectionNum, unitNum) => {
        if (unitNum <= 1) return false;
        const prevKey = getUnitKey(sectionNum, unitNum - 1);
        const prev = get().lessonProgress?.[prevKey];
        if (!prev) return true;
        const done = new Set(prev.completedLessons ?? []).size;
        return done < (prev.totalLessons ?? 1);
      },

      // ── completeLesson ────────────────────────────────────────────────────
      completeLesson: (unitKey, lessonIdx, totalLessons, score, quizTotal) => {
        if (!unitKey || lessonIdx == null) return { xpEarned: 0, unitComplete: false };
        const safeScore = Number(score) || 0;
        const safeTotalLessons = Number(totalLessons) || 1;
        const safeQuizTotal = Number(quizTotal) || safeTotalLessons;
        const state = get();
        const today = todayKey();
        const isNewDay = state.dailyXPDate !== today;
        const xpEarned = safeScore * 10 + (safeScore === safeQuizTotal ? 25 : 0);

        const goalReached =
          (isNewDay ? safeScore : (state.dailyWordsLearned || 0) + safeScore) >=
          (state.dailyGoal || 5);

        const prev = state.lessonProgress?.[unitKey] || { completedLessons: [], totalLessons: safeTotalLessons };
        const completedSet = new Set(Array.isArray(prev.completedLessons) ? prev.completedLessons : []);
        completedSet.add(Number(lessonIdx));

        const updatedProgress = {
          ...state.lessonProgress,
          [unitKey]: { completedLessons: Array.from(completedSet), totalLessons: safeTotalLessons },
        };

        set({
          xp: (state.xp || 0) + xpEarned,
          dailyXP: isNewDay ? xpEarned : (state.dailyXP || 0) + xpEarned,
          dailyXPDate: today,
          dailyWordsLearned: isNewDay ? safeScore : (state.dailyWordsLearned || 0) + safeScore,
          dailyGoalCompleted: goalReached,
          dailyGoalCompletedAt:
            goalReached && (!state.dailyGoalCompleted || isNewDay)
              ? new Date().toISOString()
              : state.dailyGoalCompletedAt,
          lessonProgress: updatedProgress,
        });

        return { xpEarned, unitComplete: completedSet.size >= safeTotalLessons };
      },

      getLessonProgress: (unitKey) =>
        get().lessonProgress?.[unitKey] || { completedLessons: [], totalLessons: 0 },

      isUnitFullyComplete: (unitKey, totalLessons) => {
        const prog = get().lessonProgress?.[unitKey];
        if (!prog) return false;
        return new Set(prog.completedLessons ?? []).size >= (totalLessons || prog.totalLessons || 1);
      },

      // ── XP ────────────────────────────────────────────────────────────────
      addXP: (amount) =>
        set((state) => {
          const today = todayKey();
          const isNewDay = state.dailyXPDate !== today;
          const amt = Number(amount) || 0;
          const words = isNewDay
            ? amt === 1 ? 1 : 0
            : (state.dailyWordsLearned || 0) + (amt === 1 ? 1 : 0);
          return {
            xp: (state.xp || 0) + amt,
            dailyXP: isNewDay ? amt : (state.dailyXP || 0) + amt,
            dailyXPDate: today,
            dailyWordsLearned: words,
            dailyGoalCompleted: words >= (state.dailyGoal || 5),
          };
        }),

      recordUnitCompletion: (count) => {
        get().addXP(Number(count) || 1);
        return Number(count) || 1;
      },

      // ── Daily progress ────────────────────────────────────────────────────
      getDailyProgress: () => {
        const state = get();
        return state.dailyXPDate !== todayKey()
          ? 0
          : Math.min(((state.dailyWordsLearned || 0) / (state.dailyGoal || 5)) * 100, 100);
      },

      shouldCelebrateDailyGoal: () => {
        const state = get();
        if (!state.dailyGoalCompleted || state.dailyXPDate !== todayKey() || !state.dailyGoalCompletedAt) return false;
        return (Date.now() - new Date(state.dailyGoalCompletedAt).getTime()) / 1000 < 15;
      },

      acknowledgeDailyGoalCelebration: () => set({ dailyGoalCompletedAt: null }),

      syncDailyGoalFromAPI: (data) =>
        set({
          dailyGoal: data?.daily_goal ?? get().dailyGoal,
          dailyXP: data?.daily_xp ?? get().dailyXP,
          dailyXPDate: data?.date ?? get().dailyXPDate,
        }),

      // ── Streak ────────────────────────────────────────────────────────────
      localIncrementStreak: () =>
        set((state) => {
          const today = todayKey();
          const last = state.lastSessionDate;
          if (last === today) return {};
          if (daysBetween(last, today) <= 1)
            return { streak: (state.streak || 0) + 1, lastSessionDate: today };
          if ((state.streakFreezeCount || 0) > 0)
            return { streak: (state.streak || 0) + 1, streakFreezeCount: (state.streakFreezeCount || 1) - 1, lastSessionDate: today };
          return { streak: 1, lastSessionDate: today };
        }),

      updateStreak: (data) =>
        set({
          streak: data?.current_streak ?? get().streak,
          lastSessionDate: data?.last_read_at ? data.last_read_at.slice(0, 10) : get().lastSessionDate,
        }),

      setLastSessionDate: (date) => set({ lastSessionDate: date }),
      incrementStreak: () => set((state) => ({ streak: (state.streak || 0) + 1 })),
      resetStreak: () => set({ streak: 0 }),
      hasClaimedStreakToday: () => {
        return get().lastStreakClaimedDate === todayKey();
      },
      claimStreakToday: () => {
        set({ lastStreakClaimedDate: todayKey() });
      },
    }),
    { name: 'istiqo-user-storage', storage: createJSONStorage(() => localStorage) }
  )
);

export default useUserStore;
