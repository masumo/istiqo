import { useMemo } from 'react';
import { SECTIONS, VOCAB_WORDS, getWordsForUnit } from '../utils/wordFrequency';
import { useVocabStore, getUnitKey } from '../store/vocabStore';
import { useUserStore, buildLessons } from '../store/userStore';

const getUnitWords = (section, unit) =>
  VOCAB_WORDS.filter((w) => w.section === section && w.unit === unit);

export const useVocabCurriculum = () => {
  const view             = useVocabStore((s) => s.view);
  const currentUnit      = useVocabStore((s) => s.currentUnit);
  const sessionWordRanks = useVocabStore((s) => s.sessionWordRanks);
  const learnedRanks     = useVocabStore((s) => s.learnedRanks);
  const completedUnits   = useVocabStore((s) => s.completedUnits);
  const startUnit        = useVocabStore((s) => s.startUnit);
  const completeUnit     = useVocabStore((s) => s.completeUnit);
  const setView          = useVocabStore((s) => s.setView);

  // Pull lessonProgress from userStore to enforce strict 100%-complete locking
  const lessonProgress = useUserStore((s) => s.lessonProgress);

  const sections = useMemo(() => {
    const learned = new Set(learnedRanks || []);

    /**
     * Returns true only if ALL lessons for a given unitKey are complete.
     * Defined inside useMemo so lessonProgress is always fresh.
     */
    const isUnitLessonComplete = (unitKey, unitWords) => {
      const lessons = buildLessons(unitWords);
      const totalLessons = lessons.length;
      if (totalLessons === 0) return false;
      const prog = lessonProgress?.[unitKey];
      if (!prog) return false;
      const completedSet = new Set(
        Array.isArray(prog.completedLessons) ? prog.completedLessons : []
      );
      return completedSet.size >= totalLessons;
    };

    return SECTIONS.map((sec) => {
      const units = [];
      // Track whether the previous unit in this section is fully lesson-complete
      let prevUnitFullyDone = true; // first unit in a section is always unlocked

      for (let u = sec.unitStart; u <= sec.unitEnd; u += 1) {
        const key          = getUnitKey(sec.section, u);
        const words        = getUnitWords(sec.section, u);
        const total        = words.length || 5;
        const learnedCount = words.filter((w) => learned.has(w.rank)).length;

        // A unit is "lesson-complete" when all its lessons are recorded as done
        const lessonDone = isUnitLessonComplete(key, words);

        // isActive = previous unit is 100% lesson-complete AND this unit is not yet done
        const isActive = prevUnitFullyDone && !lessonDone;
        // isLocked = the previous unit is NOT 100% done yet
        const isLocked = !prevUnitFullyDone;

        const displayProgress = lessonDone
          ? 100
          : isLocked
          ? 0
          : total > 0
          ? Math.min((learnedCount / total) * 100, 92)
          : 0;

        units.push({
          section:      sec.section,
          unit:         u,
          key,
          wordsCount:   words.length,
          learnedCount,
          isCompleted:  lessonDone,
          isActive,
          isLocked,
          progress:     displayProgress,
          title:        `Unit ${u}`,
        });

        // Once we encounter an incomplete unit, all subsequent units are locked.
        if (!lessonDone) prevUnitFullyDone = false;
      }
      return { ...sec, units };
    });
  }, [learnedRanks, lessonProgress]);

  /**
   * start — called from Home.jsx via onStart(unit).
   *
   * If `ranks` is supplied directly (e.g. lesson-specific word set from Home),
   * bypass getWordsForUnit and use them as-is.  Otherwise fall back to
   * getWordsForUnit() (legacy / review mode).
   *
   * Also threads through lessonIndex, totalLessons, unitKey so that
   * Learn.jsx can pass them to Quiz without re-computing.
   */
  const start = ({ section, unit, count = 5, ranks, lessonIndex, totalLessons, unitKey }) => {
    const finalRanks = Array.isArray(ranks) && ranks.length > 0
      ? ranks
      : getWordsForUnit({ section, unit, count, learnedRanks }).map((w) => w.rank);

    startUnit({
      section,
      unit,
      ranks: finalRanks,
      lessonIndex:   lessonIndex   ?? 0,
      totalLessons:  totalLessons  ?? 1,
      unitKey:       unitKey       ?? getUnitKey(section, unit),
    });
  };

  const currentSessionWords = useMemo(() => {
    const ranks = sessionWordRanks || [];
    if (!ranks.length) return [];
    const byRank = new Map(VOCAB_WORDS.map((w) => [w.rank, w]));
    return ranks.map((r) => byRank.get(r)).filter(Boolean);
  }, [sessionWordRanks]);

  const finishUnit = ({ score } = {}) => {
    if (!currentUnit) return;
    completeUnit({
      section:      currentUnit.section,
      unit:         currentUnit.unit,
      learnedRanks: sessionWordRanks || [],
    });
    return score;
  };

  return {
    view,
    setView,
    sections,
    currentUnit,
    currentSessionWords,
    startUnit: start,
    finishUnit,
  };
};

export default useVocabCurriculum;
