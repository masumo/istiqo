/**
 * Google OAuth + Quran Foundation token exchange
 * This handles the flow from Google Login to getting a Quran Foundation API token.
 */
export const handleGoogleLogin = async (googleResponse) => {
  const { credential } = googleResponse;
  
  // Exchange Google credential for Quran Foundation token
  // In a real app, this would call your backend or the Quran Foundation directly
  try {
    const response = await fetch('https://api.quran.com/api/v4/user/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: credential }),
    });

    if (!response.ok) throw new Error('Auth exchange failed');
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export default handleGoogleLogin;
