/**
 * src/auth/googleAuth.js — Google → Backend Auth Exchange
 *
 * Security fix:
 *   OLD: Frontend called https://api.quran.com/api/v4/user/auth/google directly
 *   NEW: Frontend sends credential to /api/auth/google (our backend)
 *        Backend exchanges with QF and returns user + token
 *
 * Frontend NEVER calls the QF auth endpoint directly.
 */

/**
 * Exchange a Google credential (JWT) for a Quran Foundation user session.
 *
 * @param {Object} googleResponse  The response object from @react-oauth/google
 * @param {string} googleResponse.credential  The Google ID token
 * @returns {Promise<{ user: Object, access_token: string|null }>}
 */
export const handleGoogleLogin = async (googleResponse) => {
  const { credential } = googleResponse;

  if (!credential) {
    throw new Error('No credential in Google response');
  }

  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credential,
      google_client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Auth exchange failed (${response.status})`);
  }

  const data = await response.json();
  // data shape: { user: { name, email, picture }, access_token: string|null, source: 'qf'|'google_jwt' }
  return data;
};

export default handleGoogleLogin;
