import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SECTIONS, VOCAB_WORDS } from '../utils/wordFrequency';

const unitKey = (section, unit) => `${section}:${unit}`;

const allUnits = SECTIONS.flatMap((s) => {
  const units = [];
  for (let u = s.unitStart; u <= s.unitEnd; u += 1) {
    units.push({ section: s.section, unit: u, key: unitKey(s.section, u) });
  }
  return units;
});

const getFirstIncompleteUnit = (completedUnitKeys) => {
  const completed = new Set(completedUnitKeys || []);
  return allUnits.find((u) => !completed.has(u.key)) || allUnits[allUnits.length - 1];
};

export const useVocabStore = create(
  persist(
    (set, get) => ({
      view: 'home',
      currentUnit: null,      // { section, unit, lessonIndex?, totalLessons?, unitKey? }
      sessionWordRanks: [],
      learnedRanks: [],
      completedUnits: [],

      setView: (view) => set({ view }),

      /**
       * startUnit — stores the session.
       * Accepts optional lesson metadata (lessonIndex, totalLessons, unitKey)
       * so Learn.jsx can pass them through to Quiz without re-computing.
       */
      startUnit: ({ section, unit, ranks, lessonIndex, totalLessons, unitKey: uk }) => {
        set({
          view: 'learn',
          currentUnit: {
            section,
            unit,
            lessonIndex: lessonIndex ?? 0,
            totalLessons: totalLessons ?? 1,
            unitKey: uk ?? unitKey(section, unit),
          },
          sessionWordRanks: ranks || [],
        });
      },

      completeUnit: ({ section, unit, learnedRanks }) => {
        const key = unitKey(section, unit);
        const state = get();

        const newLearnedRanks = new Set(state.learnedRanks || []);
        (learnedRanks || []).forEach((r) => newLearnedRanks.add(r));

        // A unit is complete once all its words exist in learnedRanks
        const unitWords = (VOCAB_WORDS || []).filter(
          (w) => w.section === section && w.unit === unit
        );
        const allUnitWordsLearned =
          unitWords.length > 0
            ? unitWords.every((w) => newLearnedRanks.has(w.rank))
            : false;

        const completed = new Set(state.completedUnits || []);
        if (allUnitWordsLearned) completed.add(key);

        set({
          view: 'home',
          currentUnit: null,
          sessionWordRanks: [],
          completedUnits: Array.from(completed),
          learnedRanks: Array.from(newLearnedRanks),
        });
      },

      resetRoadmap: () =>
        set({
          view: 'home',
          currentUnit: null,
          sessionWordRanks: [],
          learnedRanks: [],
          completedUnits: [],
        }),

      getActiveUnit: () => {
        const state = get();
        return getFirstIncompleteUnit(state.completedUnits);
      },
    }),
    {
      name: 'istiqo-vocab-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const getUnitKey = unitKey;
