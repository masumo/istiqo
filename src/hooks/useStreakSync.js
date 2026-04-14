import { useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { userApi } from '../api/userApi';

/**
 * useStreakSync
 * Called after completing a unit session.
 *
 * Flow:
 * 1. Local-first: always call `localIncrementStreak` so offline users get instant feedback.
 * 2. Remote (if authenticated): POST /user/streak and sync the server response.
 *
 * Returns a stable async function — call it after finishUnit().
 */
export const useStreakSync = () => {
  const authToken = useUserStore((s) => s.authToken);
  const allowUserApiCalls = useUserStore((s) => s.allowUserApiCalls);
  const localIncrementStreak = useUserStore((s) => s.localIncrementStreak);
  const updateStreak = useUserStore((s) => s.updateStreak);

  return useCallback(async () => {
    // 1. Always update locally for instant UI feedback
    localIncrementStreak();

    // 2. Sync with server if authenticated
    if (!authToken || !allowUserApiCalls) return;

    try {
      const api = userApi(authToken);
      const data = await api.postStreak();
      // Quran Foundation API returns: { current_streak, last_read_at, ... }
      if (data) updateStreak(data);
    } catch {
      // Silently fail — local state is already updated
    }
  }, [authToken, allowUserApiCalls, localIncrementStreak, updateStreak]);
};

export default useStreakSync;
