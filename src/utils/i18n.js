/**
 * i18n.js — Full Indonesian translation map.
 * All onboarding and UI components use getTranslation(lang, key).
 * Indonesian is hardcoded as fallback so no raw keys ever leak to UI.
 */

const ID_STRINGS = {
  languageSelect: 'Pilih Bahasa',
  'languages.indonesian': 'Bahasa Indonesia',
  'languages.english': 'English',
  dailyGoal: 'Target Harian',
  'goals.casual.label': 'Santai',
  'goals.casual.description': '5 kata/hari',
  'goals.serious.label': 'Serius',
  'goals.serious.description': '10 kata/hari',
  'goals.intense.label': 'Intensif',
  'goals.intense.description': '15 kata/hari',
  wordsPerDay: 'kata / hari',
  continue: 'Lanjut',
  notification: 'Waktu Notifikasi',
  notificationTime: 'Waktu Pengingat',
  notificationsPermission: 'Izinkan Notifikasi',
  startJourney: 'Mulai Perjalanan',
  back: 'Kembali',
  start: 'Mulai',
  next: 'Lanjut',
  check: 'Cek',
  skip: 'Lewati',
  gotIt: 'Mengerti',
  score: 'Skor',
  accuracy: 'Akurasi',
  loading: 'Memuat...',
  loadingVerse: 'Memuat ayat...',
  audioError: 'Audio tidak tersedia',
  audioLoading: 'Memuat audio...',
  noActiveUnit: 'Tidak ada unit aktif.',
  'lesson.label': 'Pelajaran',
  'lesson.of': 'dari',
  'quiz.title': 'Kuis',
  'quiz.score': 'Skor',
  'quiz.perfect_score': 'Skor Sempurna!',
  'quiz.completed': 'Pelajaran Selesai!',
  'quiz.continue': 'Lanjut',
  'quiz.matchTitle': 'Cocokkan Kata',
  loading_verse: 'Memuat ayat...',
  loading_audio: 'Memuat audio...',
  audio_error: 'Audio tidak tersedia',
  'mnemonic.show': 'Trik Ingatan',
  'mnemonic.hide': 'Sembunyikan',
  'navigation.back': 'Kembali',
  'navigation.next': 'Lanjut',
  'quiz.results.title': 'Kuis Selesai!',
  'quiz.results.wordsLearned': 'Kata Dipelajari',
  'quiz.results.xpEarned': 'XP Diperoleh',
  'quiz.results.duration': 'Waktu',
  'quiz.results.toMap': 'Lanjut ke Peta',
  'quiz.results.done': 'Selesai',
  'quiz.results.perfectBadge': 'Skor Sempurna!',
  'quiz.results.lessonBadge': 'Pelajaran Selesai!',
};

const EN_STRINGS = {
  languageSelect: 'Select Language',
  'languages.indonesian': 'Bahasa Indonesia',
  'languages.english': 'English',
  dailyGoal: 'Daily Goal',
  'goals.casual.label': 'Casual',
  'goals.casual.description': '5 words/day',
  'goals.serious.label': 'Serious',
  'goals.serious.description': '10 words/day',
  'goals.intense.label': 'Intensive',
  'goals.intense.description': '15 words/day',
  wordsPerDay: 'words / day',
  continue: 'Continue',
  notification: 'Notification Time',
  notificationTime: 'Reminder Time',
  notificationsPermission: 'Allow Notifications',
  startJourney: 'Start Journey',
  back: 'Back',
  start: 'Start',
  next: 'Next',
  check: 'Check',
  skip: 'Skip',
  gotIt: 'Got it',
  score: 'Score',
  accuracy: 'Accuracy',
  loading: 'Loading...',
  loadingVerse: 'Loading verse...',
  audioError: 'Audio unavailable',
  audioLoading: 'Loading audio...',
  noActiveUnit: 'No active unit.',
  'lesson.label': 'Lesson',
  'lesson.of': 'of',
  'quiz.title': 'Quiz',
  'quiz.score': 'Score',
  'quiz.perfect_score': 'Perfect Score!',
  'quiz.completed': 'Lesson Complete!',
  'quiz.continue': 'Continue',
  'quiz.matchTitle': 'Match the Words',
  loading_verse: 'Loading verse...',
  loading_audio: 'Loading audio...',
  audio_error: 'Audio unavailable',
  'mnemonic.show': 'Memory Aid',
  'mnemonic.hide': 'Hide',
  'navigation.back': 'Back',
  'navigation.next': 'Next',
  'quiz.results.title': 'Quiz Complete!',
  'quiz.results.wordsLearned': 'Words Learned',
  'quiz.results.xpEarned': 'XP Earned',
  'quiz.results.duration': 'Duration',
  'quiz.results.toMap': 'Back to Map',
  'quiz.results.done': 'Done',
  'quiz.results.perfectBadge': 'Perfect Score!',
  'quiz.results.lessonBadge': 'Lesson Complete!',
};

/**
 * getTranslation(lang, key)
 * Always returns a human-readable string — never a raw JSON key.
 * Falls back to Indonesian if the key is missing from the requested language.
 */
export const getTranslation = (lang, key) => {
  if (lang === 'en') return EN_STRINGS[key] ?? ID_STRINGS[key] ?? key;
  return ID_STRINGS[key] ?? key;
};

// Re-export as `t` for compatibility with userStore imports
export const t = getTranslation;

export const translations = { id: ID_STRINGS, en: EN_STRINGS };

export default { getTranslation, translations };
