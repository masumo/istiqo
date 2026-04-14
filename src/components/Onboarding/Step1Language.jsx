import React from 'react';
import { useUserStore } from '../../store/userStore';
import { getTranslation } from '../../utils/i18n';

const Step1Language = ({ onNext }) => {
  const { preferredLanguage, setLanguage } = useUserStore();
  const t = (key) => getTranslation(preferredLanguage, key);

  const handleSelect = (lang) => {
    setLanguage(lang);
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8 h-full animate-fade-in">
      <h2 className="text-3xl font-bold text-slate-800 text-center">{t('languageSelect')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
        <button
          onClick={() => handleSelect('id')}
          className="p-8 bg-white rounded-2xl border-4 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex flex-col items-center space-y-4 shadow-sm"
        >
          <span className="text-6xl">🇮🇩</span>
          <span className="text-xl font-bold">{t('languages.indonesian')}</span>
        </button>
        <button
          onClick={() => handleSelect('en')}
          className="p-8 bg-white rounded-2xl border-4 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex flex-col items-center space-y-4 shadow-sm"
        >
          <span className="text-6xl">🇬🇧</span>
          <span className="text-xl font-bold">{t('languages.english')}</span>
        </button>
      </div>
    </div>
  );
};

export default Step1Language;
