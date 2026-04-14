const BASE_URL = 'https://api.quran.com/api/v4';

/**
 * Fetches verses for a specific chapter with translations and word data.
 * @param {number} chapterNumber 
 * @param {string} language 'id' or 'en'
 * @returns {Promise<Object>}
 */
export const fetchVersesByChapter = async (chapterNumber, language = 'id') => {
  const translationId = language === 'id' ? 33 : 131;
  // Use language parameter for word translations and translations for verse translations
  const url = `${BASE_URL}/verses/by_chapter/${chapterNumber}?words=true&word_fields=text_uthmani,location,translation,transliteration&translations=${translationId}&audio=7&language=${language}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch verses for chapter ${chapterNumber}`);
  }
  return response.json();
};

/**
 * Fetches the top frequency words (mock for now as per instructions to use top 300)
 * In a real app, this might come from a specialized endpoint or a local JSON.
 */
export const fetchTopWords = async (language = 'id') => {
  // This will be replaced by actual logic to get the 300 most frequent words
  // For now, we'll fetch Al-Fatihah to have some real data
  return fetchVersesByChapter(1, language);
};

/**
 * Fetches specific ayah recitation audio
 * @param {string} ayahKey '1:1', '1:2', etc.
 * @param {number} recitationId Default 7 (Mishari Rashid al-`Afasy)
 * @returns {Promise<Object>} Returns audio_file object with url
 */
export const fetchRecitationAudio = async (ayahKey, recitationId = 7) => {
  const response = await fetch(`${BASE_URL}/recitations/${recitationId}/by_ayah/${ayahKey}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recitation for ${ayahKey}`);
  }
  return response.json();
};

/**
 * @deprecated Use fetchRecitationAudio instead
 */
export const fetchRecitation = fetchRecitationAudio;

export const fetchVerseByKey = async (ayahKey, language = 'id') => {
  const translationId = language === 'id' ? 33 : 131;
  const url = `${BASE_URL}/verses/by_key/${ayahKey}?fields=text_uthmani&translations=${translationId}&audio=7&language=${language}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch verse ${ayahKey}`);
  }
  return response.json();
};
