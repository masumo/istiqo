import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

/**
 * GoalRing — animated SVG progress ring
 * Props:
 *   progress     {number}  0-100
 *   size         {number}  px (default 120)
 *   strokeWidth  {number}  px (default 10)
 *   color        {string}  stroke hex/rgb (default emerald)
 *   icon         {ReactNode} optional center icon override
 *   isCompleted  {boolean}
 *   isActive     {boolean} shows pulse ring
 */
const GoalRing = ({
  progress = 0,
  size = 120,
  strokeWidth = 10,
  color = '#10b981',
  icon = null,
  isCompleted = false,
  isActive = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Zeigarnik: never show 0% for an active/in-progress unit, cap completed at 100
  const displayProgress = isCompleted
    ? 100
    : progress > 0
    ? Math.min(progress, 92)
    : isActive
    ? 18   // "almost started" — shows a small arc to motivate first tap
    : 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Pulse ring for active unit */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `3px solid ${color}` }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />
      )}

      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - (displayProgress / 100) * circumference,
          }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>

      {/* Center content */}
      <div className="absolute flex flex-col items-center justify-center">
        {icon ? (
          icon
        ) : isCompleted ? (
          <CheckCircle2 className="w-8 h-8" style={{ color }} />
        ) : (
          <span className="text-xl font-extrabold text-slate-700">{Math.round(progress)}%</span>
        )}
      </div>
    </div>
  );
};

export default GoalRing;
