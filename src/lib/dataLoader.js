// ============================================================
// Data Loader — Single access point for all curated data files.
//
// ⚠️  DATA POLICY:
//   All career cluster, major, and university data is loaded from
//   /data/*.json. These files are the single source of truth and
//   are maintained by the content team based on real TCAS67–68
//   statistics and Thai labour market data.
//
//   Do NOT hard-code cluster IDs, major names, or university names
//   anywhere else in the codebase. Always use these helpers.
//
//   To update data: edit /data/majors.json, /data/universities.json,
//   or /data/careerClusters.json — or replace the imports below
//   with fetch() calls to an external API/DB.
// ============================================================

import clusterData from '../data/careerClusters.json';
import majorData from '../data/majors.json';
import universityData from '../data/universities.json';

// ---------------------------------------------------------------------------
// Career Clusters
// ---------------------------------------------------------------------------

/** Returns all career cluster definitions. */
export function getCareerClusters() {
  return clusterData;
}

/** Returns a single career cluster by id. */
export function getCareerClusterById(id) {
  return clusterData.find(c => c.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Universities
// ---------------------------------------------------------------------------

/** Returns all university definitions. */
export function getUniversities() {
  return universityData;
}

/** Returns a single university by id. */
export function getUniversityById(id) {
  return universityData.find(u => u.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Majors
// ---------------------------------------------------------------------------

/** Returns all major definitions. */
export function getMajors() {
  return majorData;
}

/**
 * Returns majors belonging to a specific career cluster.
 * Uses only the `clusterId` field defined in majors.json.
 */
export function getMajorsByCluster(clusterId) {
  return majorData.filter(m => m.clusterId === clusterId);
}

/** Returns a single major by id. */
export function getMajorById(id) {
  return majorData.find(m => m.id === id) ?? null;
}