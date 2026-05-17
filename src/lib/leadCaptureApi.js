import { supabase } from "@/utils/supabase";

const STORAGE_KEY = "kookid_lead_capture_store";
const ACTIVE_PROFILE_KEY = "kookid_user_profile_id";

function createEmptyStore() {
  return {
    profiles: {},
    quizResults: {},
    interests: [],
  };
}

function readStore() {
  if (typeof window === "undefined") return createEmptyStore();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : createEmptyStore();
  } catch {
    return createEmptyStore();
  }
}

function writeStore(store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function createProfileId() {
  return "prof_" + Math.random().toString(36).slice(2, 11) + "_" + Date.now();
}

export function getOrCreateActiveProfileId() {
  if (typeof window === "undefined") return createProfileId();

  const existing = window.localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (existing) return existing;

  const profileId = createProfileId();
  window.localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  return profileId;
}

function getStoredProfile(profileId) {
  if (!profileId) return null;
  const store = readStore();
  return store.profiles?.[profileId] || null;
}

function buildGradeAndSchool(gradeLevel, schoolName) {
  const cleanGradeLevel = (gradeLevel || "").trim();
  const cleanSchoolName = (schoolName || "").trim();

  if (cleanGradeLevel && cleanSchoolName) {
    return `${cleanGradeLevel} / ${cleanSchoolName}`;
  }

  return cleanGradeLevel || cleanSchoolName || "";
}

export async function ensureRemoteLeadProfile(userProfileId) {
  if (!supabase || !userProfileId) return false;

  const profile = getStoredProfile(userProfileId);
  if (!profile) return false;

  const { error } = await supabase.from("user_profiles").upsert([
    {
      id: userProfileId,
      nickname: profile.nickname,
      grade_and_school: profile.gradeAndSchool,
      contact: profile.contact,
      email: profile.email || null,
      school_province: profile.schoolProvince || null,
      consent_accepted: Boolean(profile.consentAccepted),
      consent_at: profile.consentAt || profile.updatedAt || new Date().toISOString(),
      updated_at: profile.updatedAt || new Date().toISOString(),
    },
  ]);

  if (error) {
    throw error;
  }

  return true;
}

export function getStoredUserProfileId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function hasLeadCapture(userProfileId) {
  if (!userProfileId) return false;
  const store = readStore();
  return Boolean(store.profiles?.[userProfileId]?.consentAccepted);
}

export function getStoredQuizResult(userProfileId) {
  if (!userProfileId) return null;
  const store = readStore();
  return store.quizResults?.[userProfileId] ?? null;
}

export function getStoredLeadProfile(userProfileId) {
  if (!userProfileId) return null;
  const store = readStore();
  return store.profiles?.[userProfileId] ?? null;
}

export function savePreQuizInfo({
  nickname = "",
  gradeLevel = "",
  schoolName = "",
  studyTrack = "",
  gradeAndSchool = "",
} = {}) {
  if (typeof window === "undefined") return null;

  const profileId = getOrCreateActiveProfileId();
  const store = readStore();
  const now = new Date().toISOString();
  const existing = store.profiles?.[profileId] ?? {};

  const resolvedGradeLevel = (gradeLevel ?? existing.gradeLevel ?? gradeAndSchool ?? "").trim();
  const resolvedSchoolName = (schoolName ?? existing.schoolName ?? "").trim();
  const resolvedStudyTrack = (studyTrack ?? existing.studyTrack ?? "").trim();
  const resolvedGradeAndSchool = buildGradeAndSchool(resolvedGradeLevel, resolvedSchoolName) || (gradeAndSchool || "").trim();

  store.profiles[profileId] = {
    ...existing,
    userProfileId: profileId,
    nickname,
    gradeLevel: resolvedGradeLevel,
    schoolName: resolvedSchoolName,
    studyTrack: resolvedStudyTrack,
    gradeAndSchool: resolvedGradeAndSchool,
    contact: existing.contact || "",
    email: existing.email || "",
    schoolProvince: existing.schoolProvince || "",
    consentAccepted: Boolean(existing.consentAccepted),
    consentAt: existing.consentAt || null,
    updatedAt: now,
  };

  writeStore(store);
  return profileId;
}

export async function upsertQuizResult(userProfileId, result) {
  if (!userProfileId || !result) return;

  const store = readStore();
  store.quizResults[userProfileId] = {
    ...result,
    userProfileId,
    linkedAt: new Date().toISOString(),
  };
  writeStore(store);

  if (supabase) {
    await persistQuizResultToSupabase(userProfileId, result);
  }
}

async function persistQuizResultToSupabase(userProfileId, result) {
  if (!supabase) return;

  await ensureRemoteLeadProfile(userProfileId);

  const { error } = await supabase
    .from("quiz_results")
    .upsert([
      {
        user_profile_id: userProfileId,
        result,
        linked_at: new Date().toISOString(),
      },
    ], { onConflict: "user_profile_id" });

  if (error) {
    throw error;
  }
}

export async function upsertLeadCapture({
  userProfileId,
  result,
  nickname,
  gradeAndSchool,
  gradeLevel,
  schoolName,
  studyTrack,
  contact,
  email,
  schoolProvince,
}) {
  const store = readStore();
  const profileId = userProfileId || getOrCreateActiveProfileId();
  const now = new Date().toISOString();
  const existing = store.profiles?.[profileId] ?? {};
  const resolvedGradeLevel = (gradeLevel ?? existing.gradeLevel ?? gradeAndSchool ?? "").trim();
  const resolvedSchoolName = (schoolName ?? existing.schoolName ?? "").trim();
  const resolvedStudyTrack = (studyTrack ?? existing.studyTrack ?? "").trim();
  const resolvedGradeAndSchool = buildGradeAndSchool(resolvedGradeLevel, resolvedSchoolName) || (gradeAndSchool || "").trim();

  store.profiles[profileId] = {
    ...existing,
    userProfileId: profileId,
    nickname,
    gradeLevel: resolvedGradeLevel,
    schoolName: resolvedSchoolName,
    studyTrack: resolvedStudyTrack,
    gradeAndSchool: resolvedGradeAndSchool,
    contact,
    email: email || "",
    schoolProvince: schoolProvince || "",
    consentAccepted: true,
    consentAt: now,
    updatedAt: now,
  };

  if (result) {
    store.quizResults[profileId] = {
      ...result,
      userProfileId: profileId,
      linkedAt: now,
    };
  }

  writeStore(store);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  }

  // Persist to Supabase and let callers await failures.
  if (supabase) {
    await ensureRemoteLeadProfile(profileId);

    const { error } = await supabase.from("user_profiles").upsert([
      {
        id: profileId,
        nickname,
        grade_and_school: resolvedGradeAndSchool,
        contact,
        email: email || null,
        school_province: schoolProvince || null,
        consent_accepted: true,
        consent_at: now,
      },
    ]);

    if (error) {
      throw error;
    }

    if (result) {
      await persistQuizResultToSupabase(profileId, result);
    }
  }

  return profileId;
}

export async function recordProgramInterest({ userProfileId, majorId, universityId, interestLevel = "request_info" }) {
  const store = readStore();
  const record = {
    id: "interest_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now(),
    userProfileId,
    majorId,
    universityId: universityId || null,
    interestLevel,
    createdAt: new Date().toISOString(),
  };

  store.interests.push(record);
  writeStore(store);

  if (supabase) {
    await ensureRemoteLeadProfile(userProfileId);

    const { error } = await supabase.from("program_interests").insert([
      { user_profile_id: userProfileId, major_id: majorId, university_id: universityId || null, interest_level: interestLevel },
    ]);

    if (error) {
      throw error;
    }
  }

  return record;
}
