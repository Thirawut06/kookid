// ============================================================
// TCAS Career Quiz — Scoring Engine
// Computes RIASEC scores from quiz answers.
// ============================================================

import { riasecQuestions } from './quizData';

const RIASEC_DIMS = ["R", "I", "A", "S", "E", "C"];
const HOLLAND_ORDER = ["R", "I", "A", "S", "E", "C"];

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
  const hollandCode = buildHollandCode(riasecScores);

  return { traitScores: riasecScores, hollandCode };
}

/**
 * RIASEC scoring:
 * For each dimension, sum (answer * weight) for all tagged questions.
 * Normalize to 0-100 based on max possible.
 */
function computeRIASEC(answers) {
  return RIASEC_DIMS.map(dim => {
    const questions = riasecQuestions.filter(q =>
      (q.section === "riasec" || q.section === "interests") && q.tags.includes(dim)
    );

    let rawScore = 0;
    let maxPossible = 0;

    questions.forEach(q => {
      const answer = answers[q.id];
      const val = typeof answer === "number" ? answer : 0;
      const weight = typeof q.weight === "number" ? q.weight : 1;
      rawScore += val * weight;
      maxPossible += 5 * weight; // max Likert = 5
    });

    const normalizedScore = maxPossible > 0
      ? Math.round((rawScore / maxPossible) * 100)
      : 0;

    return { dimension: dim, rawScore, normalizedScore };
  });
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