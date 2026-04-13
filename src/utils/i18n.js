const translations = {
  id: {
    welcome: "Selamat Datang di Istiqo",
    languageSelect: "Pilih Bahasa",
    dailyGoal: "Target Harian Anda",
    notification: "Waktu Notifikasi",
    languages: {
      indonesian: "Bahasa Indonesia",
      english: "English"
    },
    goals: {
      casual: {
        label: "Santai",
        description: "5 kata/hari"
      },
      serious: {
        label: "Serius",
        description: "10 kata/hari"
      },
      intense: {
        label: "Intensif",
        description: "15 kata/hari"
      }
    },
    wordsPerDay: "kata / hari",
    continue: "Lanjutkan",
    startJourney: "Mulai Perjalanan",
    bookmark: "Simpan",
    learned: "Telah Dipelajari",
    next: "Selanjutnya",
    prev: "Sebelumnya",
    quiz: "Kuis",
    settings: "Pengaturan",
    streak: "Streak",
    xp: "XP",
    dailyGoalRing: "Target Harian",
    notificationsPermission: "Minta Izin Notifikasi",
    notificationTime: "Pilih Waktu Notifikasi",
    loading_verse: "Memuat ayat...",
    loading_audio: "Memuat audio...",
    audio_error: "Audio tidak tersedia",
    audio_loading: "Memuat audio...",
    mnemonic: {
      show: "💡 Cara Mengingat",
      hide: "Sembunyikan Mnemonik"
    },
    navigation: {
      back: "Kembali",
      next: "Lanjut"
    },
    sections: {
      foundations: "Foundations",
      connectors: "Connectors",
      mastery: "Mastery",
      prophets: "Prophets",
      nuances: "Nuances"
    },
    home: {
      title: "Quran Vocab Journey",
      subtitle: "Top 300 High-Frequency Words"
    },
    stats: {
      streak: "Streak",
      xp: "XP",
      words: "Kata"
    },
    unit: {
      completed: "✓ Selesai",
      active: "Aktif",
      locked: "🔒 Terkunci",
      available: "Tersedia",
      review: "Review",
      continue: "Lanjut",
      start: "Start"
    },
    dailyGoal: "Target Harian",
    celebration: {
      title: "🎉 Target Harian Tercapai!",
      description: "Luar biasa! Kamu sudah belajar {wordsLearned} kata hari ini!",
      continue: "Lanjutkan"
    }
  },
  en: {
    welcome: "Welcome to Istiqo",
    languageSelect: "Select Language",
    dailyGoal: "Your Daily Goal",
    notification: "Notification Time",
    languages: {
      indonesian: "Bahasa Indonesia",
      english: "English"
    },
    goals: {
      casual: {
        label: "Relaxed",
        description: "5 words/day"
      },
      serious: {
        label: "Serious",
        description: "10 words/day"
      },
      intense: {
        label: "Intensive",
        description: "15 words/day"
      }
    },
    wordsPerDay: "words / day",
    continue: "Continue",
    startJourney: "Start Journey",
    bookmark: "Bookmark",
    learned: "Learned",
    next: "Next",
    prev: "Previous",
    quiz: "Quiz",
    settings: "Settings",
    streak: "Streak",
    xp: "XP",
    dailyGoalRing: "Daily Goal",
    notificationsPermission: "Request Notification Permission",
    notificationTime: "Select Notification Time",
    loading_verse: "Loading verse...",
    loading_audio: "Loading audio...",
    audio_error: "Audio unavailable",
    audio_loading: "Loading audio...",
    mnemonic: {
      show: "💡 Memory Trick",
      hide: "Hide Mnemonic"
    },
    navigation: {
      back: "Back",
      next: "Next"
    },
    sections: {
      foundations: "Foundations",
      connectors: "Connectors",
      mastery: "Mastery",
      prophets: "Prophets",
      nuances: "Nuances"
    },
    home: {
      title: "Quran Vocab Journey",
      subtitle: "Top 300 High-Frequency Words"
    },
    stats: {
      streak: "Streak",
      xp: "XP",
      words: "Words"
    },
    unit: {
      completed: "✓ Completed",
      active: "Active",
      locked: "🔒 Locked",
      available: "Available",
      review: "Review",
      continue: "Continue",
      start: "Start"
    },
    dailyGoal: "Your Daily Goal",
    celebration: {
      title: "🎉 Daily Goal Achieved!",
      description: "Amazing! You've learned {wordsLearned} words today!",
      continue: "Continue"
    },
    quiz: {
      perfect_score: "Perfect!",
      completed: "Quiz Completed!",
      continue: "Continue",
      score: "Score"
    }
  }
};

export const getTranslation = (lang, key, params = {}) => {
  // Split the key into parts
  const keys = key.split('.');
  
  // Traverse the translation object
  let translation = translations[lang] || translations['en'];
  for (const k of keys) {
    translation = translation[k];
    if (translation === undefined) {
      // Fallback to English if key not found
      translation = translations['en'];
      for (const k of keys) {
        translation = translation[k];
        if (translation === undefined) {
          return key; // Return original key if not found in either language
        }
      }
    }
  }
  
  // If translation is an object, return the first string value
  if (typeof translation === 'object') {
    for (const val of Object.values(translation)) {
      if (typeof val === 'string') {
        translation = val;
        break;
      }
    }
  }
  
  // Parameter replacement
  if (typeof translation === 'string') {
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });
  }
  
  return translation || key;
};

export default translations;
