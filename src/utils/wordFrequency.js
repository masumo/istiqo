import { VOCAB_WORDS_DATA } from './wordFrequency.data';

export const SECTIONS = [
  { section: 1, title: 'The Foundations', unitStart: 1, unitEnd: 4, rankStart: 1, rankEnd: 50 },
  { section: 2, title: 'The Core Connectors', unitStart: 5, unitEnd: 8, rankStart: 51, rankEnd: 150 },
  { section: 3, title: 'Contextual Mastery', unitStart: 9, unitEnd: 12, rankStart: 151, rankEnd: 220 },
  { section: 4, title: 'Stories of Prophets', unitStart: 13, unitEnd: 16, rankStart: 221, rankEnd: 270 },
  { section: 5, title: 'Advanced Nuances', unitStart: 17, unitEnd: 20, rankStart: 271, rankEnd: 300 },
];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export const getSectionForRank = (rank) => {
  const r = clamp(rank, 1, 300);
  const section = SECTIONS.find((s) => r >= s.rankStart && r <= s.rankEnd) || SECTIONS[0];
  return section.section;
};

export const getUnitForRank = (rank) => {
  const r = clamp(rank, 1, 300);
  const section = SECTIONS.find((s) => r >= s.rankStart && r <= s.rankEnd) || SECTIONS[0];
  const unitCount = section.unitEnd - section.unitStart + 1;
  const span = section.rankEnd - section.rankStart + 1;
  const perUnit = Math.ceil(span / unitCount);
  const index = Math.floor((r - section.rankStart) / perUnit);
  return clamp(section.unitStart + index, section.unitStart, section.unitEnd);
};

export const VOCAB_WORDS = VOCAB_WORDS_DATA
  .map((w) => ({
    ...w,
    section: getSectionForRank(w.rank),
    unit: getUnitForRank(w.rank),
  }))
  .sort((a, b) => a.rank - b.rank);

export const getWordsForUnit = ({ section, unit, count = 5, learnedRanks = [] }) => {
  const learned = new Set(learnedRanks);
  const pool = VOCAB_WORDS.filter((w) => w.section === section && w.unit === unit);
  const unlearned = pool.filter((w) => !learned.has(w.rank));
  const picked = (unlearned.length ? unlearned : pool).slice(0, count);
  return picked;
};

export const getUnitMeta = () => {
  return SECTIONS.flatMap((s) => {
    const units = [];
    for (let u = s.unitStart; u <= s.unitEnd; u += 1) {
      const words = VOCAB_WORDS.filter((w) => w.unit === u);
      units.push({
        section: s.section,
        unit: u,
        title: `Unit ${u}`,
        wordsCount: words.length,
      });
    }
    return units;
  });
};

export default VOCAB_WORDS;
