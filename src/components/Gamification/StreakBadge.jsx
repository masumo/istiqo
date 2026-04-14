import React from 'react';
import { motion } from 'framer-motion';

const StreakBadge = ({ streak = 0 }) => {
  const MotionDiv = motion.div;

  const getBadgeClass = (streak) => {
    if (streak >= 100) return 'text-purple-600 bg-purple-100 border-purple-300';
    if (streak >= 30) return 'text-blue-600 bg-blue-100 border-blue-300';
    if (streak >= 7) return 'text-orange-600 bg-orange-100 border-orange-300';
    return 'text-slate-600 bg-slate-100 border-slate-300';
  };

  return (
    <MotionDiv
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 font-bold shadow-sm transition-colors ${getBadgeClass(streak)}`}
    >
      <span className="text-2xl">🔥</span>
      <span className="text-xl">{streak}</span>
    </MotionDiv>
  );
};

export default StreakBadge;
