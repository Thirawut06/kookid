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

export function upsertQuizResult(userProfileId, result) {
  if (!userProfileId || !result) return;

  const store = readStore();
  store.quizResults[userProfileId] = {
    ...result,
    userProfileId,
    linkedAt: new Date().toISOString(),
  };
  writeStore(store);
}

async function persistQuizResultToSupabase(userProfileId, result) {
  if (!supabase) return;

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
  contact,
  email,
  schoolProvince,
}) {
  const store = readStore();
  const profileId = userProfileId || createProfileId();
  const now = new Date().toISOString();
  const existing = store.profiles?.[profileId] ?? {};

  store.profiles[profileId] = {
    ...existing,
    userProfileId: profileId,
    nickname,
    gradeAndSchool,
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
    const { error } = await supabase.from("user_profiles").upsert([
      {
        id: profileId,
        nickname,
        grade_and_school: gradeAndSchool,
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

export async function recordProgramInterest({ userProfileId, majorId, interestLevel = "request_info" }) {
  const store = readStore();
  const record = {
    id: "interest_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now(),
    userProfileId,
    majorId,
    interestLevel,
    createdAt: new Date().toISOString(),
  };

  store.interests.push(record);
  writeStore(store);

  if (supabase) {
    const { error } = await supabase.from("program_interests").insert([
      { user_profile_id: userProfileId, major_id: majorId, interest_level: interestLevel },
    ]);

    if (error) {
      throw error;
    }
  }

  return record;
}
