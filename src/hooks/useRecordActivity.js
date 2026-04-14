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

export const useRecordActivity = () => {
  const authToken = useUserStore((s) => s.authToken);
  const allowUserApiCalls = useUserStore((s) => s.allowUserApiCalls);

  return useCallback(
    async (activity) => {
      const payload = {
        ...activity,
        created_at: new Date().toISOString(),
      };

      if (!authToken || !allowUserApiCalls) {
        appendLocal(payload);
        return { mode: 'local' };
      }

      const api = userApi(authToken);
      await api.postActivity(payload);
      return { mode: 'remote' };
    },
    [allowUserApiCalls, authToken]
  );
};

export default useRecordActivity;

