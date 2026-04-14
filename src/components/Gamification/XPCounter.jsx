import React from 'react';
import { motion } from 'framer-motion';

const XPCounter = ({ xp = 0 }) => {
  const MotionDiv = motion.div;

  return (
    <MotionDiv
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center space-x-2 px-4 py-2 bg-emerald-100 text-emerald-700 border-2 border-emerald-300 rounded-full font-bold shadow-sm"
    >
      <span className="text-2xl">💎</span>
      <span className="text-xl">{xp}</span>
    </MotionDiv>
  );
};

export default XPCounter;
