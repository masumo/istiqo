const BASE_URL = 'https://api.quran.com/api/v4/user';

/**
 * All User APIs require an authentication token from the Quran Foundation.
 * @param {string} token 
 * @returns {Object} API methods
 */
export const userApi = (token) => {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  return {
    getStreak: async () => {
      const response = await fetch(`${BASE_URL}/streak`, { headers });
      if (!response.ok) throw new Error('Failed to fetch streak');
      return response.json();
    },
    postStreak: async () => {
      const response = await fetch(`${BASE_URL}/streak`, { method: 'POST', headers });
      if (!response.ok) throw new Error('Failed to post streak');
      return response.json();
    },
    getGoals: async () => {
      const response = await fetch(`${BASE_URL}/goals`, { headers });
      if (!response.ok) throw new Error('Failed to fetch goals');
      return response.json();
    },
    postGoals: async (goal) => {
      const response = await fetch(`${BASE_URL}/goals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ daily_goal: goal }),
      });
      if (!response.ok) throw new Error('Failed to post goals');
      return response.json();
    },
    updateDailyProgress: async (dailyXP, dailyGoal) => {
      const response = await fetch(`${BASE_URL}/goals/progress`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          daily_xp: dailyXP,
          daily_goal: dailyGoal,
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!response.ok) throw new Error('Failed to update daily progress');
      return response.json();
    },
    getDailyProgress: async () => {
      const response = await fetch(`${BASE_URL}/goals/progress`, { headers });
      if (!response.ok) throw new Error('Failed to fetch daily progress');
      return response.json();
    },
    getBookmarks: async () => {
      const response = await fetch(`${BASE_URL}/bookmarks`, { headers });
      if (!response.ok) throw new Error('Failed to fetch bookmarks');
      return response.json();
    },
    postBookmark: async (ayahKey) => {
      const response = await fetch(`${BASE_URL}/bookmarks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ayah_key: ayahKey }),
      });
      if (!response.ok) throw new Error('Failed to post bookmark');
      return response.json();
    },
    deleteBookmark: async (bookmarkId) => {
      const response = await fetch(`${BASE_URL}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete bookmark');
      return response.json();
    },
    getActivity: async () => {
      const response = await fetch(`${BASE_URL}/activity`, { headers });
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    },
    postActivity: async (activityData) => {
      const response = await fetch(`${BASE_URL}/activity`, {
        method: 'POST',
        headers,
        body: JSON.stringify(activityData),
      });
      if (!response.ok) throw new Error('Failed to post activity');
      return response.json();
    },
  };
};
