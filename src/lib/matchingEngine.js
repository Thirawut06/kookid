// ============================================================
// TCAS Career Quiz — Matching Engine
//
// Match careers using Holland Code string rules only.
// No cosine similarity. No blended profile vectors.
//
// Data source:
//   /data/careerClusters.json contains per-career hollandCode values
//   such as "A; S; E".
// ============================================================

import { getCareerClusters, getMajorsByCluster, getUniversityById } from './dataLoader';
import { buildHollandCode } from './scoringEngine';

const HOLLAND_ORDER = ["R", "I", "A", "S", "E", "C"];

/**
 * @typedef {{ dimension: string, normalizedScore: number }} TraitScore
 * @typedef {{ id: string, nameTh: string, clusterId: string, hollandCode?: string, description?: string, descriptionTh?: string, marketNotes?: Array<string>, exampleEmployers?: string }} CareerCluster
 * @typedef {{ id: string, nameTh: string, facultyNameTh: string, clusterId: string, universityId: string, universityNameTh: string, universityShortName: string, tcasInfo: unknown, studyTrackRequired: Array<string> }} MajorItem
 */

/**
 * Compute top career matches using Holland Code position rules.
 *
 * Scoring:
 * - same position match: +50 / +30 / +20 for positions 1 / 2 / 3
 * - same letter in 3-letter set but swapped position: +10 per letter
 * - score is normalized to percentage by dividing by 100
 *
 * @param {{ traitScores: Array<TraitScore>, hollandCode?: string }} profile
 * @param {number} topN
 * @returns {{ clusters: Array<object>, majors: Array<MajorItem> }}
 */
export function computeMatches(profile, topN = 5) {
  /** @type {Array<CareerCluster>} */
  const careers = getCareerClusters();
  const userCode = normalizeHollandCode(profile?.hollandCode || buildHollandCode(profile?.traitScores || []));

  const scoredCareers = careers
    .map((career) => {
      const careerCode = normalizeHollandCode(career.hollandCode);
      const { rawScore, matchScore, exactMatches, swappedMatches } = scoreHollandCode(userCode, careerCode);

      return {
        careerId: career.id,
        clusterId: career.clusterId,
        nameTh: career.nameTh,
        descriptionTh: career.description || career.descriptionTh || "",
        marketNotes: career.marketNotes ?? [],
        exampleEmployers: career.exampleEmployers ?? "",
        hollandCode: careerCode,
        userHollandCode: userCode,
        matchScore,
        rawScore,
        exactMatches,
        swappedMatches,
      };
    })
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
      if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
      return a.nameTh.localeCompare(b.nameTh, "th");
    });

  const topClusters = scoredCareers.slice(0, topN);

  /** @type {Array<string>} */
  const uniqueClusterIds = [];
  const seenClusterIds = new Set();
  topClusters.forEach((career) => {
    if (!career.clusterId || seenClusterIds.has(career.clusterId)) return;
    seenClusterIds.add(career.clusterId);
    uniqueClusterIds.push(career.clusterId);
  });

  const seenMajorIds = new Set();
  /** @type {Array<MajorItem>} */
  const majors = [];

  uniqueClusterIds.forEach((clusterId) => {
    getMajorsByCluster(clusterId).forEach((major) => {
      if (seenMajorIds.has(major.id)) return;
      seenMajorIds.add(major.id);

      const university = getUniversityById(major.universityId);
      majors.push({
        id: major.id,
        nameTh: major.nameTh,
        facultyNameTh: major.facultyNameTh,
        clusterId: major.clusterId,
        universityId: major.universityId,
        universityNameTh: university?.nameTh ?? major.universityId,
        universityShortName: university?.shortName ?? major.universityId,
        tcasInfo: major.tcasInfo ?? null,
        studyTrackRequired: major.studyTrackRequired ?? [],
      });
    });
  });

  return { clusters: topClusters, majors };
}

/**
 * @param {string | number | null | undefined} code
 * @returns {string}
 */
function normalizeHollandCode(code) {
  return String(code || "")
    .replace(/[^A-Z]/gi, "")
    .toUpperCase()
    .split("")
    .filter(letter => HOLLAND_ORDER.includes(letter))
    .slice(0, 3)
    .join("");
}

/**
 * @param {string} userCode
 * @param {string} careerCode
 * @returns {{ rawScore: number, matchScore: number, exactMatches: number, swappedMatches: number }}
 */
function scoreHollandCode(userCode, careerCode) {
  const user = normalizeHollandCode(userCode);
  const career = normalizeHollandCode(careerCode);

  if (!user || !career) {
    return { rawScore: 0, matchScore: 0, exactMatches: 0, swappedMatches: 0 };
  }

  const userLetters = user.slice(0, 3).split("");
  const careerLetters = career.slice(0, 3).split("");

  let rawScore = 0;
  let exactMatches = 0;
  let swappedMatches = 0;

  userLetters.forEach((letter, index) => {
    const exactLetter = careerLetters[index];
    if (letter && letter === exactLetter) {
      exactMatches += 1;
      rawScore += index === 0 ? 50 : index === 1 ? 30 : 20;
      return;
    }

    if (letter && careerLetters.includes(letter)) {
      swappedMatches += 1;
      rawScore += 10;
    }
  });

  const matchScore = Math.min(100, Math.round(rawScore));

  return { rawScore, matchScore, exactMatches, swappedMatches };
}