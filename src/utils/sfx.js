import { Howl } from 'howler';

const SOUNDS = {
  // Correct: Digital click/pop
  correct: ['/correct.mp3'],
  // Wrong: Low mechanical thud / soft buzz
  wrong: ['/incorrect.mp3'],
  // End of quiz / Success: Soft woosh / chime
  success: ['/success.mp3']
};

const sfx = {
  correct: new Howl({ src: SOUNDS.correct, preload: true, volume: 0.6 }),
  wrong: new Howl({ src: SOUNDS.wrong, preload: true, volume: 0.5 }),
  success: new Howl({ src: SOUNDS.success, preload: true, volume: 0.7 }),
};

export const playSFX = (type, isMuted) => {
  if (isMuted || !sfx[type]) return;
  sfx[type].play();
};
