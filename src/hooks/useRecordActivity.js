import { useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { userApi } from '../api/userApi';

const LOCAL_KEY = 'istiqo-activity-local';

const appendLocal = (entry) => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
  } catch {
    localStorage.setItem(LOCAL_KEY, JSON.stringify([entry]));
  }
};

export const buildActivityDayPayload = (activity = {}) => ({
  type:    activity.type || 'LESSON',
  seconds: activity.seconds ?? 30,
  date:    activity.date ?? new Date().toISOString().slice(0, 10),
});

export const useRecordActivity = () => {
  const authToken = useUserStore((s) => s.authToken);
  const allowUserApiCalls = useUserStore((s) => s.allowUserApiCalls);

  return useCallback(
    async (activity) => {
      const payload = buildActivityDayPayload(activity);

      if (!authToken || !allowUserApiCalls) {
        console.info(
          '[QF Activity] 💾 Disimpan lokal (login QF belum aktif — cek log server [auth] ✅)',
          payload
        );
        appendLocal(payload);
        return { mode: 'local' };
      }

      try {
        const api = userApi(authToken);
        const res = await api.postActivityDay(payload);
        console.log('[QF Activity] ✅ Tersimpan ke QF:', payload, res);
        return { mode: 'remote' };
      } catch (e) {
        console.warn('[QF Activity] ⚠️ Gagal, disimpan lokal:', e.message, payload);
        appendLocal(payload);
        return { mode: 'local' };
      }
    },
    [authToken, allowUserApiCalls]
  );
};

export default useRecordActivity;
