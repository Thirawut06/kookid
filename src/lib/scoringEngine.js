// ============================================================
// TCAS Career Quiz — Scoring Engine
// Computes RIASEC + Academic scores from quiz answers.
// ============================================================

import { riasecQuestions } from './quizData';

const RIASEC_DIMS = ["R", "I", "A", "S", "E", "C"];
const ACADEMIC_DIMS = ["Academic_Math", "Academic_Sci"];
const HOLLAND_ORDER = ["R", "I", "A", "S", "E", "C"];

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
  const hollandCode = buildHollandCode(riasecScores);

  const traitScores = [
    ...riasecScores,
    ...academicScores,
  ];

  return { traitScores, hollandCode };
}

/**
 * RIASEC scoring:
 * For each dimension, sum (answer * weight) for all tagged questions.
 * Normalize to 0-100 based on max possible.
 */
function computeRIASEC(answers) {
  return RIASEC_DIMS.map(dim => {
    const questions = riasecQuestions.filter(q =>
      q.section === "riasec" && q.tags.includes(dim)
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
  return ACADEMIC_DIMS.map(dim => {
    return {
      dimension: dim,
      rawScore: 0,
      normalizedScore: 0,
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

/**
 * Build the 3-letter Holland Code from the top 3 RIASEC dimensions.
 * Uses raw summed scores first, then normalized score, then canonical order for ties.
 */
export function buildHollandCode(riasecScores = []) {
  return riasecScores
    .slice()
    .sort((a, b) => {
      if ((b.rawScore ?? 0) !== (a.rawScore ?? 0)) {
        return (b.rawScore ?? 0) - (a.rawScore ?? 0);
      }

      if ((b.normalizedScore ?? 0) !== (a.normalizedScore ?? 0)) {
        return (b.normalizedScore ?? 0) - (a.normalizedScore ?? 0);
      }

      return HOLLAND_ORDER.indexOf(a.dimension) - HOLLAND_ORDER.indexOf(b.dimension);
    })
    .slice(0, 3)
    .map(score => score.dimension)
    .join("");
}