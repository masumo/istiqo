/**
 * src/api/quranApi.js — Frontend Quran API client
 *
 * ⚠️  IMPORTANT: All requests go through the backend proxy at /api/quran/*.
 *     The backend handles OAuth2 (QF_CLIENT_ID + QF_CLIENT_SECRET) server-side.
 *     Frontend NEVER calls https://api.quran.foundation directly.
 *
 * Backend routes (server/routes/quran.js) forward to:
 *   https://api.quran.foundation/content/api/v4/...
 */

const BASE_URL = '/api/quran';

/**
 * Fetches verses for a specific chapter with translations and word data.
 * @param {number} chapterNumber
 * @param {string} language 'id' or 'en'
 * @returns {Promise<Object>}
 */
export const fetchVersesByChapter = async (chapterNumber, language = 'id') => {
  // 33 = Bahasa Indonesia (Kemenag), 20 = Saheeh International (English)
  const translationId = language === 'id' ? 33 : 20;
  const params = new URLSearchParams({
    words: 'true',
    word_fields: 'text_uthmani,location,translation,transliteration',
    translations: String(translationId),
    audio: '7',
    language,
  });

  const response = await fetch(
    `${BASE_URL}/verses/by_chapter/${chapterNumber}?${params}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch verses for chapter ${chapterNumber}`);
  }
  return response.json();
};

/**
 * Fetches the top frequency words.
 * Falls back to Al-Fatihah (chapter 1) to seed real data.
 */
export const fetchTopWords = async (language = 'id') => {
  return fetchVersesByChapter(1, language);
};

/**
 * Fetches specific ayah recitation audio.
 * @param {string} ayahKey  e.g. '1:1'
 * @param {number} recitationId  Default 7 (Mishari Rashid al-`Afasy)
 * @returns {Promise<Object>}
 */
export const fetchRecitationAudio = async (ayahKey, recitationId = 7) => {
  // Encode the colon in ayahKey (e.g. "114:4" → "114%3A4") so Express
  // route params capture the full key instead of stopping at the colon.
  const encodedKey = encodeURIComponent(ayahKey);
  const response = await fetch(
    `${BASE_URL}/recitations/${recitationId}/by_ayah/${encodedKey}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch recitation for ${ayahKey}`);
  }
  return response.json();
};

/** @deprecated Use fetchRecitationAudio instead */
export const fetchRecitation = fetchRecitationAudio;

/**
 * Fetches a single verse by key with translation and audio.
 * @param {string} ayahKey  e.g. '1:1'
 * @param {string} language 'id' or 'en'
 * @returns {Promise<Object>}
 */
export const fetchVerseByKey = async (ayahKey, language = 'id') => {
  // 33 = Bahasa Indonesia (Kemenag), 20 = Saheeh International (English)
  const translationId = language === 'id' ? 33 : 20;
  const params = new URLSearchParams({
    fields: 'text_uthmani',
    translations: String(translationId),
    language,
  });

  // Encode the colon in ayahKey so Express route params capture the full key.
  const encodedKey = encodeURIComponent(ayahKey);
  const response = await fetch(`${BASE_URL}/verses/by_key/${encodedKey}?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch verse ${ayahKey}`);
  }
  return response.json();
};
