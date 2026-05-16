import React from 'react';
import { motion } from 'framer-motion';

const NurMascot = ({ 
  mood = 'splash', 
  size = 200, 
  animateType = 'floating', // 'floating' | 'breathing' | 'thinking' | 'spring'
  className = ''
}) => {

  // Animasi Floating: Gentle floating/bobbing
  const floatingAnim = {
    y: [0, -10, 0],
    transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
  };

  // Animasi Breathing: Idle breathing (slight scaling)
  const breathingAnim = {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
  };

  // Animasi Thinking: Pulse effect / glowing aura
  const thinkingAnim = {
    scale: [1, 1.1, 1],
    opacity: [0.8, 1, 0.8],
    rotate: [0, 5, -5, 0],
    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
  };

  // Animasi Spring: Scale-Up Spring Impact
  const springAnim = {
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 }
  };

  let animProps = floatingAnim;
  let initialProps = false;
  
  if (animateType === 'breathing') {
    animProps = breathingAnim;
  } else if (animateType === 'thinking') {
    animProps = thinkingAnim;
  } else if (animateType === 'spring') {
    animProps = springAnim;
    initialProps = { scale: 0, rotate: -10 };
  }

  return (
    <motion.div 
      className={`relative overflow-hidden flex items-center justify-center bg-[#F6F3E6] rounded-full shadow-lg ${className}`} 
      style={{ 
        width: size, 
        height: size,
      }}
      initial={initialProps}
      animate={animProps}
    >
      {/* 
        SMART CSS CLIPPING
        Using the master image /nur-master.jpg.
        Scale up and center it so the bottom text is clipped by the overflow-hidden rounded container.
      */}
      <img 
        src="/nur-master.jpg" 
        alt="Nur Mascot" 
        className="w-full h-full object-cover object-center scale-[1.3]"
        style={{ pointerEvents: 'none' }}
      />
    </motion.div>
  );
};

export default NurMascot;
