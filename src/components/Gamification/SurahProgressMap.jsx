import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

const surahs = [
  { id: 1, name: 'Al-Fatihah', totalWords: 29, unlockedWords: 12 },
  { id: 2, name: 'Al-Baqarah', totalWords: 6116, unlockedWords: 0 },
  { id: 3, name: 'Ali Imran', totalWords: 3480, unlockedWords: 0 },
  { id: 4, name: 'An-Nisa', totalWords: 3745, unlockedWords: 0 },
  { id: 5, name: 'Al-Maidah', totalWords: 2804, unlockedWords: 0 },
  { id: 6, name: 'Al-Anam', totalWords: 3050, unlockedWords: 0 },
];

const SurahProgressMap = () => {
  const MotionDiv = motion.div;

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 w-full">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
        <BookOpen className="w-8 h-8 mr-3 text-emerald-600" />
        Progress Surah
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {surahs.map((surah) => {
          const percentage = (surah.unlockedWords / surah.totalWords) * 100;
          
          return (
            <MotionDiv
              key={surah.id}
              whileHover={{ y: -5 }}
              className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 flex flex-col space-y-4 relative overflow-hidden group"
            >
              <div className="flex justify-between items-start z-10">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Surah {surah.id}</span>
                  <span className="text-xl font-bold text-slate-800">{surah.name}</span>
                </div>
                <div className="bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  <span className="text-sm font-bold text-emerald-600">{surah.unlockedWords} / {surah.totalWords}</span>
                </div>
              </div>

              <div className="w-full h-4 bg-slate-200 rounded-full relative overflow-hidden z-10">
                <MotionDiv
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(percentage, 2)}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>

              <span className="absolute -bottom-4 -right-2 text-8xl font-black text-slate-200/50 select-none group-hover:text-emerald-100/50 transition-colors">
                {surah.id}
              </span>
            </MotionDiv>
          );
        })}
      </div>
    </div>
  );
};

export default SurahProgressMap;
