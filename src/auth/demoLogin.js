/**
 * Login demo untuk juri hackathon — token dari QF_DEMO_ACCESS_TOKEN di server .env
 */
export const loginAsDemoJudge = async () => {
  const res = await fetch('/api/auth/demo');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const parts = [err.error, err.hint].filter(Boolean);
    throw new Error(
      parts.join(' — ') ||
        'Demo token belum dikonfigurasi. Set QF_DEMO_ACCESS_TOKEN di .env server.'
    );
  }
  return res.json();
};

export default loginAsDemoJudge;
