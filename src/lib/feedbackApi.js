/**
 * feedbackApi.js
 * Lightweight wrapper to store feedback locally in browser storage.
 * Swap these functions for a real backend later if needed.
 */

const STORAGE_KEY = "kookid_feedback";

import { ensureRemoteLeadProfile } from "@/lib/leadCaptureApi";

async function postToServer(path, body) {
  try {
    const res = await fetch(`/api/submit/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Server responded ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    throw err;
  }
}

function readStore() {
  if (typeof window === "undefined") return { career: [], major: [], result: [] };
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{\"career\":[],\"major\":[],\"result\":[]}");
  } catch {
    return { career: [], major: [], result: [] };
  }
}

function writeStore(store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/**
 * Submit per-career interest ratings.
 * @param {string} userProfileId
 * @param {Array<{careerClusterId: string, interestLevel: number}>} items
 */
export async function submitCareerFeedback(userProfileId, items) {
  const store = readStore();
  const records = items.map(item => ({
    userProfileId,
    careerClusterId: item.careerClusterId,
    interestLevel: item.interestLevel,
  }));
  store.career.push(...records);
  writeStore(store);

  try {
    await ensureRemoteLeadProfile(userProfileId);
    const inserts = records.map(r => ({ user_profile_id: r.userProfileId, career_cluster_id: r.careerClusterId, interest_level: r.interestLevel }));
    await postToServer("career", inserts);
  } catch (err) {
    console.error("Supabase submitCareerFeedback error:", err);
  }
}

/**
 * Submit per-major interest ratings.
 * @param {string} userProfileId
 * @param {Array<{majorId: string, interestLevel: number}>} items
 */
export async function submitMajorFeedback(userProfileId, items) {
  const store = readStore();
  const records = items.map(item => ({
    userProfileId,
    majorId: item.majorId,
    interestLevel: item.interestLevel,
  }));
  store.major.push(...records);
  writeStore(store);

  try {
    await ensureRemoteLeadProfile(userProfileId);
    const inserts = records.map(r => ({ user_profile_id: r.userProfileId, major_id: r.majorId, interest_level: r.interestLevel }));
    await postToServer("interest", inserts);
  } catch (err) {
    console.error("Supabase submitMajorFeedback error:", err);
  }
}

/**
 * Submit overall result satisfaction.
 * @param {string} userProfileId
 * @param {number} overallFitScore  1–5
 * @param {string|null} selectedIssue  optional
 * @param {string|null} comment  optional, trimmed to 200 chars
 */
export async function submitResultFeedback(userProfileId, overallFitScore, selectedIssue, comment) {
  const store = readStore();
  const record = {
    userProfileId,
    overallFitScore,
    ...(selectedIssue ? { selectedIssue } : {}),
    ...(comment ? { comment: comment.slice(0, 200) } : {}),
  };
  store.result.push(record);
  writeStore(store);

  try {
    await ensureRemoteLeadProfile(userProfileId);
    await postToServer("quiz", {
      user_profile_id: userProfileId,
      result: record,
    });
  } catch (err) {
    console.error("Supabase submitResultFeedback error:", err);
  }
}