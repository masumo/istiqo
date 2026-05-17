import { Howl } from 'howler';

const SOUNDS = {
  correct: ['/correct.mp3'],
  wrong:   ['/incorrect.mp3'],
  success: ['/success.mp3'],
};

const sfx = {
  correct: new Howl({ src: SOUNDS.correct, preload: true, volume: 0.6 }),
  wrong:   new Howl({ src: SOUNDS.wrong,   preload: true, volume: 0.5 }),
  success: new Howl({ src: SOUNDS.success, preload: true, volume: 0.7 }),
};

/** Returns true when sound is globally enabled (localStorage flag). */
export const isSoundEnabled = () =>
  localStorage.getItem('istiqo_sound_enabled') !== 'false';

/** Stop all currently-playing SFX immediately. */
export const stopAllSFX = () => {
  Object.values(sfx).forEach((h) => h.stop());
};

export const playSFX = (type, isMuted) => {
  if (isMuted) return;
  if (!isSoundEnabled()) return;
  if (!sfx[type]) return;
  sfx[type].play();
};
