/** Redirect ke QF OAuth (Authorization Code + PKCE) — cara resmi untuk User API */
export const startQFLogin = () => {
  window.location.href = '/api/auth/qf/login';
};

export default startQFLogin;
