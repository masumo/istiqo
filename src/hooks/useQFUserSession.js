/**
 * useQFUserSession — QF activity-days sync on login and after lessons.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { userApi } from '../api/userApi';
import { buildActivityDayPayload } from './useRecordActivity';

const LOCAL_ACTIVITY_KEY = 'istiqo-activity-local';
const normalizeDateKey = (d) => {
  if (!d) return null;
  const s = String(d).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

const parseIsoDateUTC = (iso) => new Date(`${iso}T00:00:00.000Z`);

const daysBetweenIso = (a, b) => {
  const da = parseIsoDateUTC(a).getTime();
  const db = parseIsoDateUTC(b).getTime();
  return Math.round((da - db) / 86_400_000);
};

const calculateConsecutiveStreak = (dateKeys) => {
  const dates = Array.from(new Set((dateKeys || []).map(normalizeDateKey).filter(Boolean))).sort(
    (a, b) => (a < b ? 1 : a > b ? -1 : 0)
  );
  if (dates.length === 0) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i += 1) {
    if (daysBetweenIso(dates[i - 1], dates[i]) === 1) streak += 1;
    else break;
  }
  return streak;
};

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

  const syncStreak = useCallback(async () => {
    if (!authToken || !allowUserApiCalls) return;

    try {
      const api = userApi(authToken);
      const data = await api.getActivityDays();
      const list =
        data?.data?.activity_days ??
        data?.activity_days ??
        data?.data ??
        data ??
        [];
      const dateKeys = Array.isArray(list)
        ? list
            .map((it) => (typeof it === 'string' ? it : it?.date))
            .map(normalizeDateKey)
            .filter(Boolean)
        : [];
      const calculatedStreak = calculateConsecutiveStreak(dateKeys);
      localStorage.setItem('istiqo_cached_streak', calculatedStreak);
      localStorage.setItem('istiqo_last_sync_time', Date.now());
      useUserStore.setState({ streak: calculatedStreak });
    } catch (error) {
      console.warn('QF Server unreachable. Falling back to local cached streak.');
      const localBackup = parseInt(localStorage.getItem('istiqo_cached_streak'), 10) || 0;
      useUserStore.setState({ streak: localBackup });
    }
  }, [authToken, allowUserApiCalls]);

  useEffect(() => {
    initializedRef.current = false;
  }, [authToken, allowUserApiCalls]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => {
    syncStreak();
  }, [syncStreak]);

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
