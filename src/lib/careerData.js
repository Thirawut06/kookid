// ============================================================
// careerData.js — Thin compatibility shim.
//
// ⚠️  Do NOT add hard-coded career/major/university data here.
//     All data lives in /data/*.json and is accessed via
//     lib/dataLoader.js.
//
//     majors data here is MOCK. Real data will be managed by
//     us and loaded from external sources.
// ============================================================

import { getCareerClusters, getMajors } from './dataLoader';

// Named exports for any existing import sites
export const careerClusters = getCareerClusters();
export const majorSuggestions = getMajors();