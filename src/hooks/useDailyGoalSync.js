import { useCallback, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { userApi } from '../api/userApi';

/**
 * Hook to sync daily goals and progress with Quran Foundation User API
 * - Fetches daily goal and progress on mount
 * - Provides method to update progress to server
 */
export const useDailyGoalSync = () => {
  const authToken = useUserStore((s) => s.authToken);
  const allowUserApiCalls = useUserStore((s) => s.allowUserApiCalls);
  const syncDailyGoalFromAPI = useUserStore((s) => s.syncDailyGoalFromAPI);
  const dailyXP = useUserStore((s) => s.dailyXP);
  const dailyGoal = useUserStore((s) => s.dailyGoal);

  /**
   * Fetch daily goal and progress from server
   */
  const fetchDailyGoal = useCallback(async () => {
    if (!authToken || !allowUserApiCalls) {
      return { mode: 'local' };
    }

    try {
      const api = userApi(authToken);
      const goalData = await api.getGoals();
      
      if (goalData) {
        syncDailyGoalFromAPI(goalData);
      }
      
      return { mode: 'remote', data: goalData };
    } catch (error) {
      console.error('Failed to fetch daily goal:', error);
      return { mode: 'local', error };
    }
  }, [authToken, allowUserApiCalls, syncDailyGoalFromAPI]);

  /**
   * Update daily progress to server
   */
  const updateDailyProgress = useCallback(async () => {
    if (!authToken || !allowUserApiCalls) {
      return { mode: 'local' };
    }

    try {
      const api = userApi(authToken);
      await api.updateDailyProgress(dailyXP, dailyGoal);
      return { mode: 'remote' };
    } catch (error) {
      console.error('Failed to update daily progress:', error);
      return { mode: 'local', error };
    }
  }, [authToken, allowUserApiCalls, dailyXP, dailyGoal]);

  /**
   * Set daily goal on server
   */
  const setDailyGoalOnServer = useCallback(async (goal) => {
    if (!authToken || !allowUserApiCalls) {
      return { mode: 'local' };
    }

    try {
      const api = userApi(authToken);
      await api.postGoals(goal);
      return { mode: 'remote' };
    } catch (error) {
      console.error('Failed to set daily goal:', error);
      return { mode: 'local', error };
    }
  }, [authToken, allowUserApiCalls]);

  // Fetch daily goal on mount (if API is enabled)
  useEffect(() => {
    if (authToken && allowUserApiCalls) {
      fetchDailyGoal();
    }
  }, [authToken, allowUserApiCalls, fetchDailyGoal]);

  return {
    fetchDailyGoal,
    updateDailyProgress,
    setDailyGoalOnServer,
  };
};

export default useDailyGoalSync;
