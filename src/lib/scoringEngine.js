// ============================================================
// TCAS Career Quiz — Scoring Engine
// Computes RIASEC + Academic scores from quiz answers.
// ============================================================

import { allQuestions } from './quizData';

const RIASEC_DIMS = ["R", "I", "A", "S", "E", "C"];
const ACADEMIC_DIMS = ["Academic_Math", "Academic_Sci"];

// Subjects that give bonuses to Academic dimensions
const MATH_BONUS_SUBJECTS = ["math", "physics", "computer"];
const SCI_BONUS_SUBJECTS = ["physics", "chemistry", "biology"];
const BONUS_POINTS = 10;

/**
 * Compute the full user profile from quiz answers.
 * @param {Object} answers - { questionId: value }
 *   - Likert questions: value is 1-5
 *   - Multiple choice (single): value is string optionId
 *   - Multiple choice (multi): value is array of optionIds
 * @returns {{ traitScores: Array<{dimension, rawScore, normalizedScore}> }}
 */
export function computeProfile(answers) {
  const riasecScores = computeRIASEC(answers);
  const academicScores = computeAcademic(answers);

  const traitScores = [
    ...riasecScores,
    ...academicScores,
  ];

  return { traitScores };
}

/**
 * RIASEC scoring:
 * For each dimension, sum (answer * weight) for all tagged questions.
 * Normalize to 0-100 based on max possible.
 */
function computeRIASEC(answers) {
  return RIASEC_DIMS.map(dim => {
    const questions = allQuestions.filter(q =>
      q.section === "interests" && q.tags.includes(dim)
    );

    let rawScore = 0;
    let maxPossible = 0;

    questions.forEach(q => {
      const answer = answers[q.id];
      const val = typeof answer === "number" ? answer : 0;
      rawScore += val * q.weight;
      maxPossible += 5 * q.weight; // max Likert = 5
    });

    const normalizedScore = maxPossible > 0
      ? Math.round((rawScore / maxPossible) * 100)
      : 0;

    return { dimension: dim, rawScore, normalizedScore };
  });
}

/**
 * Academic scoring (MVP):
 * - Likert self-rating maps to 0-100
 * - Bonus from subject preferences
 */
function computeAcademic(answers) {
  // Gather Likert-based scores
  const mathQuestions = allQuestions.filter(q =>
    q.section === "academic" && q.tags.includes("Academic_Math")
  );
  const sciQuestions = allQuestions.filter(q =>
    q.section === "academic" && q.tags.includes("Academic_Sci")
  );

  const mathRaw = averageLikert(answers, mathQuestions);
  const sciRaw = averageLikert(answers, sciQuestions);

  // Subject bonuses from Q_AC_1 (favorite subjects)
  const favSubjects = answers["Q_AC_1"] || [];
  const favArray = Array.isArray(favSubjects) ? favSubjects : [favSubjects];

  let mathBonus = 0;
  let sciBonus = 0;
  favArray.forEach(subId => {
    if (MATH_BONUS_SUBJECTS.includes(subId)) mathBonus += BONUS_POINTS;
    if (SCI_BONUS_SUBJECTS.includes(subId)) sciBonus += BONUS_POINTS;
  });

  return ACADEMIC_DIMS.map(dim => {
    const base = dim === "Academic_Math" ? mathRaw : sciRaw;
    const bonus = dim === "Academic_Math" ? mathBonus : sciBonus;
    const normalizedScore = Math.min(100, Math.round(base + bonus));
    return {
      dimension: dim,
      rawScore: normalizedScore,
      normalizedScore,
    };
  });
}

/**
 * Average Likert answers for a set of questions, normalized to 0-100.
 */
function averageLikert(answers, questions) {
  if (questions.length === 0) return 0;
  let sum = 0;
  let count = 0;
  questions.forEach(q => {
    const val = answers[q.id];
    if (typeof val === "number") {
      sum += val;
      count++;
    }
  });
  if (count === 0) return 0;
  return ((sum / count) / 5) * 100; // 5 = max likert
}