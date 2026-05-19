/**
 * src/api/userApi.js — QF User API client (activity days)
 *
 * Proxied via /api/user → server/routes/user.js → /api/v1/user/activity_days
 */

const BASE_URL = '/api/user';

const clientTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const userApi = (token) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-timezone': clientTimezone(),
  };

  const req = async (path, method = 'GET', body = null) => {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${path}`, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `User API ${method} ${path} failed (${res.status})`);
    }
    return res.json().catch(() => ({}));
  };

  return {
    getActivityDays: (params = '') =>
      req(`/activity-days${params ? `?${params}` : ''}`),

    postActivityDay: (data) => req('/activity-days', 'POST', data),
  };
};

export default userApi;
