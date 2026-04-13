import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const todayKey = () => new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

const daysBetween = (dateStrA, dateStrB) => {
  if (!dateStrA || !dateStrB) return Infinity;
  const a = new Date(dateStrA);
  const b = new Date(dateStrB);
  return Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24));
};

export const useUserStore = create(
  persist(
    (set, get) => ({
      preferredLanguage: 'en', // Default to English
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

      // Simplified translation (hardcoded)
      getTranslation: (lang, key) => {
        // Hardcoded translations for key quiz-related texts
        const translations = {
          'quiz.perfect_score': 'Perfect!',
          'quiz.completed': 'Quiz Completed!',
          'quiz.continue': 'Continue',
          'quiz.score': 'Score',
          'dailyGoal.celebration.title': 'Congratulations!',
          'dailyGoal.celebration.continue': 'Continue'
        };
        
        return translations[key] || key;
      },

      setLanguage: (lang) => set({ preferredLanguage: lang }),
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      setNotificationTime: (time) => set({ notificationTime: time }),
      completeOnboarding: () => set({ isOnboarded: true }),
      setAuthToken: (token) => set({ authToken: token }),
      setAllowUserApiCalls: (allow) => set({ allowUserApiCalls: allow }),
      
      /**
       * Add XP with daily tracking
       * Automatically resets daily XP if it's a new day
       * Also tracks daily words learned (for goal progress display)
       */
      addXP: (amount) =>
        set((state) => {
          const today = todayKey();
          const isNewDay = state.dailyXPDate !== today;
          
          const newDailyXP = isNewDay ? amount : state.dailyXP + amount;
          const newTotalXP = state.xp + amount;
          
          // Track daily words learned (1 XP = 1 word from card learning)
          // Only count card learning XP (1 XP per word), not quiz XP
          const isCardLearning = amount === 1;
          const newDailyWordsLearned = isNewDay
            ? (isCardLearning ? 1 : 0)
            : state.dailyWordsLearned + (isCardLearning ? 1 : 0);
          
          // Check if daily goal is reached (based on words learned, not XP)
          const goalReached = newDailyWordsLearned >= state.dailyGoal;
          const wasNotCompleted = !state.dailyGoalCompleted || isNewDay;
          
          return {
            xp: newTotalXP,
            dailyXP: newDailyXP,
            dailyXPDate: today,
            dailyWordsLearned: newDailyWordsLearned,
            dailyGoalCompleted: goalReached,
            dailyGoalCompletedAt: goalReached && wasNotCompleted ? new Date().toISOString() : state.dailyGoalCompletedAt,
          };
        }),

      /**
       * Record XP from completing a Unit
       * Awards 1 XP per word learned
       */
      recordUnitCompletion: (wordCount) => {
        const xpAmount = wordCount || 1;
        get().addXP(xpAmount);
        return xpAmount;
      },

      /**
       * Record XP from completing a Quiz
       * Awards 10 XP per correct answer + 25 bonus for perfect score
       */
      recordQuizCompletion: (correctAnswers, totalQuestions) => {
        const baseXP = correctAnswers * 10;
        const bonusXP = correctAnswers === totalQuestions ? 25 : 0;
        const totalXP = baseXP + bonusXP;
        
        // Update XP and track daily words learned
        const state = get();
        const today = todayKey();
        const isNewDay = state.dailyXPDate !== today;
        
        const newDailyXP = isNewDay ? totalXP : state.dailyXP + totalXP;
        const newTotalXP = state.xp + totalXP;
        
        // Track daily words learned based on quiz performance
        const newDailyWordsLearned = isNewDay
          ? correctAnswers
          : state.dailyWordsLearned + correctAnswers;
        
        // Check if daily goal is reached
        const goalReached = newDailyWordsLearned >= state.dailyGoal;
        const wasNotCompleted = !state.dailyGoalCompleted || isNewDay;
        
        // Update state
        set({
          xp: newTotalXP,
          dailyXP: newDailyXP,
          dailyXPDate: today,
          dailyWordsLearned: newDailyWordsLearned,
          dailyGoalCompleted: goalReached,
          dailyGoalCompletedAt: goalReached && wasNotCompleted ? new Date().toISOString() : state.dailyGoalCompletedAt,
        });
        
        return totalXP;
      },

      /**
       * Get daily progress percentage (0-100)
       * Based on words learned, not XP
       */
      getDailyProgress: () => {
        const state = get();
        const today = todayKey();
        
        // Reset if new day
        if (state.dailyXPDate !== today) {
          return 0;
        }
        
        // Progress based on words learned vs daily goal
        const progress = (state.dailyWordsLearned / state.dailyGoal) * 100;
        return Math.min(progress, 100);
      },

      /**
       * Check if daily goal was just completed (for celebration trigger)
       */
      shouldCelebrateDailyGoal: () => {
        const state = get();
        const today = todayKey();
        
        if (!state.dailyGoalCompleted || state.dailyXPDate !== today) {
          return false;
        }
        
        // Check if completed within last 15 seconds (fresh completion)
        if (state.dailyGoalCompletedAt) {
          const completedTime = new Date(state.dailyGoalCompletedAt);
          const now = new Date();
          const diffSeconds = (now - completedTime) / 1000;
          return diffSeconds < 15;
        }
        
        return false;
      },

      /**
       * Reset daily goal celebration flag (after showing celebration)
       */
      acknowledgeDailyGoalCelebration: () =>
        set({ dailyGoalCompletedAt: null }),

      /**
       * Sync daily goal from User API
       */
      syncDailyGoalFromAPI: (goalData) =>
        set({
          dailyGoal: goalData?.daily_goal ?? get().dailyGoal,
          dailyXP: goalData?.daily_xp ?? get().dailyXP,
          dailyXPDate: goalData?.date ?? get().dailyXPDate,
        }),

      /**
       * Local streak increment with date-guard.
       * - Same day → skip (already counted today)
       * - 1 day gap → increment streak
       * - 2+ day gap w/ no freeze → reset to 1
       * - 2+ day gap w/ freeze → consume freeze, keep streak
       */
      localIncrementStreak: () =>
        set((state) => {
          const today = todayKey();
          const last = state.lastSessionDate;
          if (last === today) return {}; // already counted

          const gap = daysBetween(last, today);

          if (gap <= 1) {
            return { streak: state.streak + 1, lastSessionDate: today };
          }
          if (state.streakFreezeCount > 0) {
            return {
              streak: state.streak + 1,
              streakFreezeCount: state.streakFreezeCount - 1,
              lastSessionDate: today,
            };
          }
          return { streak: 1, lastSessionDate: today };
        }),

      /** Sync streak from server response (Quran Foundation User API) */
      updateStreak: (streakData) =>
        set({
          streak: streakData?.current_streak ?? get().streak,
          lastSessionDate: streakData?.last_read_at
            ? streakData.last_read_at.slice(0, 10)
            : get().lastSessionDate,
        }),

      setLastSessionDate: (date) => set({ lastSessionDate: date }),
      incrementStreak: () => set((state) => ({ streak: state.streak + 1 })), // legacy
      resetStreak: () => set({ streak: 0 }),
    }),
    {
      name: 'istiqo-user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
