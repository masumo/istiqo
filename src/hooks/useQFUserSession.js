/**
 * useQFUserSession — QF activity-days sync on login and after lessons.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { userApi } from '../api/userApi';
import { buildActivityDayPayload } from './useRecordActivity';

const LOCAL_ACTIVITY_KEY = 'istiqo-activity-local';

export const useQFUserSession = () => {
  const authToken = useUserStore((s) => s.authToken);
  const allowUserApiCalls = useUserStore((s) => s.allowUserApiCalls);
  const initializedRef = useRef(false);

  const flushLocalActivity = useCallback(async (api) => {
    try {
      const raw = localStorage.getItem(LOCAL_ACTIVITY_KEY);
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return;
      await Promise.allSettled(
        queue.map((entry) => api.postActivityDay(buildActivityDayPayload(entry)))
      );
      localStorage.removeItem(LOCAL_ACTIVITY_KEY);
      console.log('[QF User API] ✅ Flushed', queue.length, 'queued activity records');
    } catch (e) {
      console.warn('[QF User API] ⚠️ Could not flush local activity:', e.message);
    }
  }, []);

  const initSession = useCallback(async () => {
    if (!authToken || !allowUserApiCalls) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.log('[QF User API] 🚀 Initializing session...');
    const api = userApi(authToken);
    await flushLocalActivity(api);
    console.log('[QF User API] ✅ Session initialized');
  }, [authToken, allowUserApiCalls, flushLocalActivity]);

  useEffect(() => {
    initializedRef.current = false;
  }, [authToken, allowUserApiCalls]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const syncAfterLesson = useCallback(
    async ({ wordsLearned = 0 } = {}) => {
      if (!authToken || !allowUserApiCalls) return;

      const api = userApi(authToken);
      const payload = buildActivityDayPayload({
        type: 'LESSON',
        seconds: Math.max(wordsLearned * 30, 60),
      });

      try {
        await api.postActivityDay(payload);
        console.log('[QF User API] ✅ Activity day recorded', payload);
      } catch (e) {
        console.warn('[QF User API] ⚠️ Activity day failed:', e.message);
      }
    },
    [authToken, allowUserApiCalls]
  );

  return { syncAfterLesson };
};

export default useQFUserSession;
