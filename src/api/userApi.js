/**
 * src/api/userApi.js — Frontend User API client
 *
 * ⚠️  All requests go through the backend proxy at /api/user/*.
 *     The user's auth token is forwarded in the Authorization header.
 *     Backend (server/routes/user.js) relays to:
 *       https://api.quran.com/api/v4/user/...
 *
 *     The frontend NEVER calls the QF User API directly.
 */

const BASE_URL = '/api/user';

/**
 * Creates a set of user API methods authenticated with the given token.
 * @param {string} token  The user's QF access token (stored in Zustand userStore)
 * @returns {Object}
 */
export const userApi = (token) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  return {
    // ── Streak ──────────────────────────────────────────────────────────────
    getStreak: async () => {
      const res = await fetch(`${BASE_URL}/streak`, { headers });
      if (!res.ok) throw new Error('Failed to fetch streak');
      return res.json();
    },
    postStreak: async () => {
      const res = await fetch(`${BASE_URL}/streak`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed to post streak');
      return res.json();
    },

    // ── Goals ────────────────────────────────────────────────────────────────
    getGoals: async () => {
      const res = await fetch(`${BASE_URL}/goals`, { headers });
      if (!res.ok) throw new Error('Failed to fetch goals');
      return res.json();
    },
    postGoals: async (goal) => {
      const res = await fetch(`${BASE_URL}/goals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ daily_goal: goal }),
      });
      if (!res.ok) throw new Error('Failed to post goals');
      return res.json();
    },

    // ── Goals Progress ───────────────────────────────────────────────────────
    updateDailyProgress: async (dailyXP, dailyGoal) => {
      const res = await fetch(`${BASE_URL}/goals/progress`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          daily_xp: dailyXP,
          daily_goal: dailyGoal,
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) throw new Error('Failed to update daily progress');
      return res.json();
    },
    getDailyProgress: async () => {
      const res = await fetch(`${BASE_URL}/goals/progress`, { headers });
      if (!res.ok) throw new Error('Failed to fetch daily progress');
      return res.json();
    },

    // ── Bookmarks ────────────────────────────────────────────────────────────
    getBookmarks: async () => {
      const res = await fetch(`${BASE_URL}/bookmarks`, { headers });
      if (!res.ok) throw new Error('Failed to fetch bookmarks');
      return res.json();
    },
    postBookmark: async (ayahKey) => {
      const res = await fetch(`${BASE_URL}/bookmarks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ayah_key: ayahKey }),
      });
      if (!res.ok) throw new Error('Failed to post bookmark');
      return res.json();
    },
    deleteBookmark: async (bookmarkId) => {
      const res = await fetch(`${BASE_URL}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete bookmark');
      return res.json();
    },

    // ── Activity ─────────────────────────────────────────────────────────────
    getActivity: async () => {
      const res = await fetch(`${BASE_URL}/activity`, { headers });
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    postActivity: async (activityData) => {
      const res = await fetch(`${BASE_URL}/activity`, {
        method: 'POST',
        headers,
        body: JSON.stringify(activityData),
      });
      if (!res.ok) throw new Error('Failed to post activity');
      return res.json();
    },
  };
};
