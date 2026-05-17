/**
 * QF environment resolution — content vs user API dapat beda.
 *
 * QF_CONTENT_ENV=production  → semua surat / recitation penuh
 * QF_USER_ENV=prelive        → Activity API hackathon (wajib prelive)
 *
 * Fallback: QF_ENV jika *_ENV tidak di-set.
 */

const VALID = new Set(['prelive', 'production']);

export const AUTH_BASE_BY_ENV = {
  prelive:    'https://prelive-oauth2.quran.foundation',
  production: 'https://oauth2.quran.foundation',
};

export const CONTENT_BASE_BY_ENV = {
  prelive:    'https://apis-prelive.quran.foundation',
  production: 'https://apis.quran.foundation',
};

export const USER_AUTH_BASE_BY_ENV = {
  prelive:    'https://apis-prelive.quran.foundation/auth',
  production: 'https://apis.quran.foundation/auth',
};

/** @param {'content'|'user'|'default'} scope */
export function getQFEnv(scope = 'default') {
  let env;
  if (scope === 'content') {
    env = process.env.QF_CONTENT_ENV ?? process.env.QF_ENV ?? 'prelive';
  } else if (scope === 'user') {
    env = process.env.QF_USER_ENV ?? process.env.QF_ENV ?? 'prelive';
  } else {
    env = process.env.QF_ENV ?? 'prelive';
  }
  if (!VALID.has(env)) {
    throw new Error(`[qfEnv] Invalid env "${env}" for scope ${scope}`);
  }
  return env;
}

export function getAuthBaseUrl(scope = 'content') {
  return AUTH_BASE_BY_ENV[getQFEnv(scope === 'user' ? 'user' : 'content')];
}

export function getContentBaseUrl() {
  return CONTENT_BASE_BY_ENV[getQFEnv('content')];
}

export function getUserAuthBaseUrl() {
  return USER_AUTH_BASE_BY_ENV[getQFEnv('user')];
}

/** Client credentials untuk Content API (client_credentials scope=content) */
export function getContentClientCredentials() {
  const contentEnv = getQFEnv('content');
  if (contentEnv === 'production' && process.env.QF_CONTENT_CLIENT_ID) {
    return {
      clientId:     process.env.QF_CONTENT_CLIENT_ID,
      clientSecret: process.env.QF_CONTENT_CLIENT_SECRET ?? '',
    };
  }
  return {
    clientId:     process.env.QF_CLIENT_ID ?? '',
    clientSecret: process.env.QF_CLIENT_SECRET ?? '',
  };
}

/** x-client-id untuk Content API — harus sama dengan client yang minta token */
export function getContentClientId() {
  return getContentClientCredentials().clientId;
}

/** Client ID untuk header x-client-id pada User API */
export function getUserClientId() {
  const userEnv = getQFEnv('user');
  if (userEnv === 'production' && process.env.QF_PROD_CLIENT_ID) {
    return process.env.QF_PROD_CLIENT_ID;
  }
  return process.env.QF_CLIENT_ID ?? '';
}

export function getEnvSummary() {
  const contentEnv = getQFEnv('content');
  const userEnv = getQFEnv('user');
  return {
    qfEnv:        process.env.QF_ENV ?? 'prelive',
    contentEnv,
    userEnv,
    split: contentEnv !== userEnv,
    authBaseUrl:    AUTH_BASE_BY_ENV[userEnv],
    contentBaseUrl: CONTENT_BASE_BY_ENV[contentEnv],
    userAuthBaseUrl: USER_AUTH_BASE_BY_ENV[userEnv],
    userApiEnabled: userEnv === 'prelive',
  };
}
