// ============================================================
// TCAS Career Quiz — Matching Engine
//
// Maps the user RIASEC + academic profile to career clusters
// defined in /data/careerClusters.json, then resolves majors
// from /data/majors.json and universities from /data/universities.json.
//
// ⚠️  DATA POLICY:
//   Cluster IDs, major IDs, and university IDs must exactly match
//   the values in the /data/*.json files. Do NOT invent new ones.
//
// --- HOW TO ADJUST CLUSTER MAPPING ---
// Each cluster below has a `riasecProfile` and `academicProfile`.
// These weights control which RIASEC scores map to which cluster.
// To tune: increase a dimension's weight to make that cluster
// appear more often for users who score high on that dimension.
// ============================================================

import { getCareerClusters, getMajorsByCluster, getUniversityById } from './dataLoader';
import { buildHollandCode } from './scoringEngine';

// Dimension weights: how much each quiz dimension contributes to scoring.
// RIASEC dimensions are weighted at 1.0; academic signals at 0.6.
// TODO: Calibrate with real career counselor guidance.
const DIMENSION_WEIGHTS = {
  R: 1.0, I: 1.0, A: 1.0, S: 1.0, E: 1.0, C: 1.0,
  Academic_Math: 0.6,
  Academic_Sci: 0.6,
};

const ALL_DIMS = ["R", "I", "A", "S", "E", "C", "Academic_Math", "Academic_Sci"];

const HOLLAND_CLUSTER_RULES = {
  R: ["CLUSTER_ENGINEERING_IT_DATA", "CLUSTER_SCIENCE_RESEARCH", "CLUSTER_HEALTH_MEDICINE_PHARMA", "CLUSTER_HEALTH_NURSING_ALLIED"],
  I: ["CLUSTER_ENGINEERING_IT_DATA", "CLUSTER_SCIENCE_RESEARCH", "CLUSTER_HEALTH_MEDICINE_PHARMA", "CLUSTER_HEALTH_NURSING_ALLIED"],
  A: ["CLUSTER_SOCIAL_LAW_MEDIA"],
  S: ["CLUSTER_EDUCATION_TEACHING", "CLUSTER_HEALTH_NURSING_ALLIED", "CLUSTER_HEALTH_MEDICINE_PHARMA"],
  E: ["CLUSTER_BUSINESS_ACCOUNTING_ECON", "CLUSTER_TOURISM_HOSPITALITY_AGRI", "CLUSTER_SOCIAL_LAW_MEDIA"],
  C: ["CLUSTER_BUSINESS_ACCOUNTING_ECON", "CLUSTER_ENGINEERING_IT_DATA", "CLUSTER_SCIENCE_RESEARCH"],
};

const HOLLAND_PREFIX_RULES = {
  RI: ["CLUSTER_ENGINEERING_IT_DATA", "CLUSTER_SCIENCE_RESEARCH", "CLUSTER_HEALTH_MEDICINE_PHARMA"],
  IR: ["CLUSTER_ENGINEERING_IT_DATA", "CLUSTER_SCIENCE_RESEARCH", "CLUSTER_HEALTH_MEDICINE_PHARMA"],
  RA: ["CLUSTER_SOCIAL_LAW_MEDIA"],
  AR: ["CLUSTER_SOCIAL_LAW_MEDIA"],
  RS: ["CLUSTER_HEALTH_NURSING_ALLIED", "CLUSTER_HEALTH_MEDICINE_PHARMA"],
  SR: ["CLUSTER_HEALTH_NURSING_ALLIED", "CLUSTER_HEALTH_MEDICINE_PHARMA"],
  ES: ["CLUSTER_BUSINESS_ACCOUNTING_ECON", "CLUSTER_EDUCATION_TEACHING"],
  SE: ["CLUSTER_EDUCATION_TEACHING", "CLUSTER_HEALTH_NURSING_ALLIED"],
  EC: ["CLUSTER_BUSINESS_ACCOUNTING_ECON"],
  CE: ["CLUSTER_BUSINESS_ACCOUNTING_ECON"],
  IC: ["CLUSTER_ENGINEERING_IT_DATA", "CLUSTER_SCIENCE_RESEARCH"],
  CI: ["CLUSTER_ENGINEERING_IT_DATA", "CLUSTER_SCIENCE_RESEARCH", "CLUSTER_BUSINESS_ACCOUNTING_ECON"],
};

// ---------------------------------------------------------------------------
// Cluster RIASEC + Academic profiles
// These define how well each career cluster "fits" each personality dimension.
// Values are 0–100. Adjust these numbers to tune the matching.
// ---------------------------------------------------------------------------
// Mapping rationale:
//   CLUSTER_SOCIAL_LAW_MEDIA   → high S (social), E (enterprising), A (artistic/creative)
//   CLUSTER_HEALTH_NURSING_ALLIED → high S (caring), I (investigative), moderate Academic_Sci
//   CLUSTER_BUSINESS_ACCOUNTING_ECON → high E (enterprising), C (conventional), Academic_Math
//   CLUSTER_ENGINEERING_IT_DATA → high R (realistic), I (investigative), Academic_Math, Academic_Sci
//   CLUSTER_HEALTH_MEDICINE_PHARMA → high I, S, very high Academic_Sci + Academic_Math
//   CLUSTER_SCIENCE_RESEARCH → high I (investigative), Academic_Sci + Academic_Math
//   CLUSTER_EDUCATION_TEACHING → high S (social), A (artistic/expressive)
//   CLUSTER_TOURISM_HOSPITALITY_AGRI → high S, E, R (hands-on/practical)
const CLUSTER_PROFILES = {
  CLUSTER_SOCIAL_LAW_MEDIA:           { R: 28, I: 50, A: 78, S: 89, E: 68, C: 42, Academic_Math: 30, Academic_Sci: 25 },
  CLUSTER_HEALTH_NURSING_ALLIED:      { R: 58, I: 79, A: 30, S: 90, E: 34, C: 69, Academic_Math: 40, Academic_Sci: 70 },
  CLUSTER_BUSINESS_ACCOUNTING_ECON:   { R: 24, I: 63, A: 32, S: 68, E: 89, C: 82, Academic_Math: 65, Academic_Sci: 25 },
  CLUSTER_ENGINEERING_IT_DATA:        { R: 83, I: 90, A: 28, S: 22, E: 44, C: 73, Academic_Math: 85, Academic_Sci: 70 },
  CLUSTER_HEALTH_MEDICINE_PHARMA:     { R: 62, I: 90, A: 22, S: 78, E: 33, C: 72, Academic_Math: 65, Academic_Sci: 90 },
  CLUSTER_SCIENCE_RESEARCH:           { R: 79, I: 90, A: 34, S: 38, E: 30, C: 72, Academic_Math: 75, Academic_Sci: 85 },
  CLUSTER_EDUCATION_TEACHING:         { R: 26, I: 77, A: 72, S: 88, E: 64, C: 38, Academic_Math: 35, Academic_Sci: 35 },
  CLUSTER_TOURISM_HOSPITALITY_AGRI:   { R: 71, I: 35, A: 60, S: 82, E: 79, C: 42, Academic_Math: 30, Academic_Sci: 45 },
};

/**
 * Compute top career cluster matches for a user profile,
 * then resolve majors with university details.
 *
 * @param {{ traitScores: Array<{dimension, normalizedScore}> }} profile
 * @param {number} topN — clusters to return (default 5)
 * @returns {{ clusters: Array, majors: Array }}
 */
export function computeMatches(profile, topN = 5) {
  const clusters = getCareerClusters(); // loaded from /data/careerClusters.json
  const userVector = buildUserVector(profile.traitScores);
  const hollandCode = (profile.hollandCode || buildHollandCode(profile.traitScores || []) || "").toUpperCase();
  const firstLetter = hollandCode[0] || "";
  const firstTwoLetters = hollandCode.slice(0, 2);

  // Score each cluster using weighted cosine similarity
  const scored = clusters.map(cluster => {
    // career data items use `clusterId` to point to the canonical cluster profile
    const profileKey = cluster.clusterId || cluster.id;
    const clusterVector = buildClusterVector(profileKey);
    const similarity = weightedCosineSimilarity(userVector, clusterVector);
    const baseScore = similarity * 100;
    const firstLetterBoost = HOLLAND_CLUSTER_RULES[firstLetter]?.includes(profileKey) ? 18 : 0;
    const prefixBoost = HOLLAND_PREFIX_RULES[firstTwoLetters]?.includes(profileKey) ? 12 : 0;
    const combinedScore = Math.min(100, Math.round(baseScore + firstLetterBoost + prefixBoost));
    return {
      // expose the canonical cluster key so callers can look up majors by that id
      clusterId: profileKey,
      // keep the original career item id for reference when needed
      careerId: cluster.id,
      nameTh: cluster.nameTh,
      descriptionTh: cluster.descriptionTh,
      marketNotes: cluster.marketNotes ?? [],
      matchScore: combinedScore,
      hollandCode,
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  const topClusters = scored.slice(0, topN);

  // Resolve majors for top clusters.
  // getMajorsByCluster reads /data/majors.json — only returns real majors.
  const seenMajorIds = new Set();
  const majors = [];

  topClusters.forEach(cluster => {
    getMajorsByCluster(cluster.clusterId).forEach(m => {
      if (seenMajorIds.has(m.id)) return;
      seenMajorIds.add(m.id);

      // Resolve university from /data/universities.json using universityId.
      // Returns null if the ID does not exist in universities.json.
      const uni = getUniversityById(m.universityId);

      majors.push({
        id: m.id,
        nameTh: m.nameTh,
        facultyNameTh: m.facultyNameTh,
        clusterId: m.clusterId,
        universityId: m.universityId,
        universityNameTh: uni?.nameTh ?? m.universityId,
        universityShortName: uni?.shortName ?? m.universityId,
        tcasInfo: m.tcasInfo ?? null,
        studyTrackRequired: m.studyTrackRequired ?? [],
      });
    });
  });

  return { clusters: topClusters, majors };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildUserVector(traitScores) {
  const map = {};
  traitScores.forEach(ts => { map[ts.dimension] = ts.normalizedScore; });
  return ALL_DIMS.map(d => map[d] ?? 0);
}

function buildClusterVector(clusterId) {
  const profile = CLUSTER_PROFILES[clusterId] ?? {};
  return ALL_DIMS.map(d => profile[d] ?? 0);
}

function weightedCosineSimilarity(vecA, vecB) {
  const weights = ALL_DIMS.map(d => DIMENSION_WEIGHTS[d] ?? 1.0);
  let dot = 0, magA = 0, magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const wA = vecA[i] * weights[i];
    const wB = vecB[i] * weights[i];
    dot += wA * wB;
    magA += wA * wA;
    magB += wB * wB;
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}