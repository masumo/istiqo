import React from 'react';
import { motion } from 'framer-motion';

/**
 * NurMascot — maskot bintang kecil "Nur" (نور = cahaya)
 *
 * mood:
 *   'reading'   — sebelum quiz, di atas Quran terbuka
 *   'celebrate' — setelah unit selesai, confetti
 *   'streak'    — saat streak baru, megang obor
 *
 * Floating bob animation bawaan (Baby Schema = menggemaskan & menarik perhatian)
 */
const NUR_IMAGES = {
  reading:   '/mascot/nur_reading.webp',
  celebrate: '/mascot/nur_celebrate.webp',
  streak:    '/mascot/nur_streak.webp',
};

// Ambient sparkle dots around Nur
const Sparkle = ({ style }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full bg-amber-300"
    style={style}
    animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
    transition={{ repeat: Infinity, duration: 1.8 + Math.random() * 1.2, delay: Math.random() * 1.5 }}
  />
);

const SPARKLE_POSITIONS = [
  { top: '10%', left: '5%' },
  { top: '0%', right: '15%' },
  { bottom: '20%', left: '2%' },
  { bottom: '10%', right: '5%' },
  { top: '30%', right: '0%' },
];

const NurMascot = ({ mood = 'celebrate', size = 200, sparkles = true }) => {
  const src = NUR_IMAGES[mood] || NUR_IMAGES.celebrate;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Ambient sparkles */}
      {sparkles && SPARKLE_POSITIONS.map((pos, i) => (
        <Sparkle key={i} style={pos} />
      ))}

      {/* Glow halo behind mascot */}
      <div
        className="absolute inset-0 rounded-full bg-amber-200/40 blur-xl"
        style={{ transform: 'scale(0.85)' }}
      />

      {/* Nur floating bob */}
      <motion.img
        src={src}
        alt="Nur the mascot"
        style={{ width: size, height: size, objectFit: 'contain', position: 'relative', zIndex: 1 }}
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
      />
    </div>
  );
};

export default NurMascot;
