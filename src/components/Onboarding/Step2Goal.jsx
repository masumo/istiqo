import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useUserStore, getUIString } from '../../store/userStore';
import { useDailyGoalSync } from '../../hooks/useDailyGoalSync';

const C = {
  green: '#58CC02', greenDark: '#46A302',
  teal: '#37607D', tealDark: '#2A4B63',
  bg: '#F6F3E6',
  doneGreen: '#D7FFB1', doneBorder: '#218151',
};

const btn3d = 'border-2 border-b-[6px] rounded-2xl active:border-b-2 active:translate-y-[4px] transition-all select-none';

const GOALS = [
  { value: 5,  icon: '🌱', labelKey: 'goalCasual',  wordsPerDay: '5' },
  { value: 10, icon: '📖', labelKey: 'goalSerious', wordsPerDay: '10' },
  { value: 15, icon: '🔥', labelKey: 'goalIntense', wordsPerDay: '15' },
];

const Step2Goal = ({ onNext }) => {
  const { preferredLanguage, dailyGoal, setDailyGoal } = useUserStore();
  const { setDailyGoalOnServer } = useDailyGoalSync();
  const s = (k) => getUIString(preferredLanguage, k);

  const handleSelect = async (value) => {
    setDailyGoal(value);
    await setDailyGoalOnServer(value);
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Card */}
      <div className="w-full bg-white rounded-3xl border-2 border-b-[6px] overflow-hidden p-6 flex flex-col gap-5" style={{ borderColor: C.tealDark }}>
        <div className="text-center">
          <h2 className="text-xl font-black text-slate-800">{s('dailyGoal')}</h2>
          <p className="text-xs font-medium text-slate-400 mt-1">
            {preferredLanguage === 'en' ? 'How many words per day?' : 'Berapa kata per hari?'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {GOALS.map((goal) => {
            const isSelected = dailyGoal === goal.value;
            const goalData = s(goal.labelKey);
            const label = typeof goalData === 'object' ? goalData.label : goal.labelKey;
            return (
              <motion.button
                key={goal.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(goal.value)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all ${btn3d}`}
                style={
                  isSelected
                    ? { backgroundColor: C.doneGreen, borderColor: C.doneBorder, borderBottomWidth: '6px' }
                    : { backgroundColor: '#fff', borderColor: '#E5E7EB', borderBottomWidth: '6px' }
                }
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{goal.icon}</span>
                  <div className="text-left">
                    <div className={`text-sm font-black ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>
                      {label}
                    </div>
                    <div className={`text-xs font-medium ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {goal.wordsPerDay} {s('wordsPerDay')}
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="w-5 h-5" style={{ color: C.doneBorder }} strokeWidth={3} />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className={`w-full py-4 font-black text-base text-white ${btn3d}`}
        style={{ backgroundColor: C.green, borderColor: C.greenDark }}
      >
        {s('continueLabel')} →
      </motion.button>
    </div>
  );
};

export default Step2Goal;
