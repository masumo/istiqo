import React from 'react';
import { useUserStore } from '../../store/userStore';
import { useDailyGoalSync } from '../../hooks/useDailyGoalSync';
import { getTranslation } from '../../utils/i18n';
import { CheckCircle2 } from 'lucide-react';

const Step2Goal = ({ onNext }) => {
  const { preferredLanguage, dailyGoal, setDailyGoal } = useUserStore();
  const { setDailyGoalOnServer } = useDailyGoalSync();
  const t = (key) => getTranslation(preferredLanguage, key);

  const goals = [
    { value: 5, label: t('goals.casual.label'), color: 'bg-emerald-100 border-emerald-500', desc: t('goals.casual.description') },
    { value: 10, label: t('goals.serious.label'), color: 'bg-blue-100 border-blue-500', desc: t('goals.serious.description') },
    { value: 15, label: t('goals.intense.label'), color: 'bg-orange-100 border-orange-500', desc: t('goals.intense.description') },
  ];

  const handleGoalSelect = async (goalValue) => {
    setDailyGoal(goalValue);
    // Sync to server if API is enabled
    await setDailyGoalOnServer(goalValue);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8 h-full">
      <h2 className="text-3xl font-bold text-slate-800 text-center">{t('dailyGoal')}</h2>
      <div className="flex flex-col w-full max-w-md space-y-4">
        {goals.map((goal) => (
          <button
            key={goal.value}
            onClick={() => handleGoalSelect(goal.value)}
            className={`p-6 rounded-2xl border-4 transition-all flex items-center justify-between shadow-sm ${
              dailyGoal === goal.value
                ? `${goal.color} text-slate-900`
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="text-xl font-bold">{goal.label}</span>
              <span className="text-sm opacity-80">{goal.value} {t('wordsPerDay')}</span>
            </div>
            {dailyGoal === goal.value && <CheckCircle2 className="w-8 h-8 text-slate-800" />}
          </button>
        ))}
      </div>
      <button
        onClick={onNext}
        className="w-full max-w-md py-4 bg-emerald-600 text-white rounded-2xl font-bold text-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
      >
        {t('continue')}
      </button>
    </div>
  );
};

export default Step2Goal;
