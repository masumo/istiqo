import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';
import NurMascot from '../NurMascot/NurMascot';
import { getTranslation } from '../../utils/i18n';

const Quiz = ({ words, onComplete, onContinue = () => {} }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const { preferredLanguage, recordQuizCompletion } = useUserStore();

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (!words || words.length === 0 || currentIndex >= words.length) return;
    
    const current = words[currentIndex];
    if (!current) return;
    
    // Generate options only when currentIndex changes
    const correct = current.translation;
    const others = words
      .filter((w, idx) => idx !== currentIndex && w.translation !== correct)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.translation);
    
    const allOptions = [correct, ...others].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  }, [currentIndex, words]);

  const handleOptionClick = (option) => {
    if (selectedOption !== null) return;

    setSelectedOption(option);
    const correct = option === currentWord.translation;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (isCompleted) return; // Prevent multiple calls
    
    if (currentIndex < words.length - 1) {
      // Move to next question - reset state first, then increment
      setSelectedOption(null);
      setIsCorrect(null);
      setCurrentIndex(prev => prev + 1);
    } else {
      // End of quiz
      setIsCompleted(true);
      const finalScore = score;
      const isPerfect = finalScore === words.length;
      
      // Record quiz completion XP
      recordQuizCompletion(finalScore, words.length);

      if (isPerfect) {
        // Show confetti for perfect score
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      onComplete(finalScore);
    }
  };

  // Quiz Results Screen
  if (isCompleted) {
    return (
      <div className="w-full max-w-lg flex flex-col items-center space-y-8 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white rounded-[2.5rem] shadow-2xl p-8 border-4 border-slate-50 flex flex-col items-center space-y-8"
          >
            {/* Nur Mascot Celebration */}
            <NurMascot
              variant={score === words.length ? 'celebrate' : 'reading'}
              className="w-48 h-48 mb-4"
            />

            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-slate-800">
                {score === words.length 
                  ? getTranslation(preferredLanguage, 'quiz.perfect_score') 
                  : getTranslation(preferredLanguage, 'quiz.completed')}
              </h2>
              
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Trophy className="text-amber-500 w-12 h-12" />
                <span className="text-5xl font-bold text-emerald-600">
                  {getTranslation(preferredLanguage, 'quiz.score')}: {score} / {words.length}
                </span>
              </div>

              <div className="text-2xl font-semibold text-slate-700 mb-4">
                +{score * 10} XP
              </div>

              {/* Continue Button */}
              <button
                onClick={() => {
                  recordQuizCompletion(score, words.length);
                  onContinue(); // Use the passed continue handler
                }}
                className="w-full py-5 mt-6 bg-emerald-600 text-white rounded-2xl font-bold text-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
              >
                {getTranslation(preferredLanguage, 'unit.continue')}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Guard: prevent rendering if no current word
  if (!currentWord) {
    return null;
  }

  return (
    <div className="w-full max-w-lg flex flex-col items-center space-y-8 p-4">
      {/* Progress Indicator */}
      <div className="w-full flex items-center justify-between px-2">
        <span className="text-sm font-bold text-slate-600">
          {getTranslation(preferredLanguage, 'quiz')} {currentIndex + 1} / {words.length}
        </span>
        <span className="text-sm font-bold text-amber-600">
          {getTranslation(preferredLanguage, 'quiz.score')}: {score}/{words.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full bg-white rounded-[2.5rem] shadow-2xl p-8 border-4 border-slate-50 flex flex-col items-center space-y-8"
        >
          <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">
            {getTranslation(preferredLanguage, 'quiz')}
          </h2>
          
          <div className="text-center space-y-4">
            <h1 className="text-7xl font-amiri font-bold text-slate-800 leading-relaxed" dir="rtl">
              {currentWord.arabic}
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-3 w-full">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={selectedOption !== null}
                className={`p-5 rounded-2xl border-4 font-bold text-xl transition-all text-left flex items-center justify-between ${
                  selectedOption === option
                    ? option === currentWord.translation
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-red-50 border-red-500 text-red-700'
                    : selectedOption !== null && option === currentWord.translation
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                }`}
              >
                <span>{option}</span>
              </button>
            ))}
          </div>

          <AnimatePresence>
            {selectedOption !== null && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleNext}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
              >
                {currentIndex < words.length - 1 
                  ? getTranslation(preferredLanguage, 'next') 
                  : getTranslation(preferredLanguage, 'unit.continue')}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
