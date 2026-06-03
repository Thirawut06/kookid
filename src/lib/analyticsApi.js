import { supabase } from "@/utils/supabase";
import { ensureRemoteLeadProfile } from "@/lib/leadCaptureApi";
import posthog from 'posthog-js';

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

const EVENT_STORAGE_KEY = "kookid_event_logs";
const SESSION_KEY = "kookid_session_id";
const EVENT_DEDUPE_WINDOW_MS = 1500;
const PROFILE_SYNC_MIN_INTERVAL_MS = 30000;

/** @type {Map<string, number>} */
const recentEventMap = new Map();
/** @type {Map<string, number>} */
const profileSyncMap = new Map();

function getEventDedupeKey(eventName, page, userProfileId) {
  return `${eventName}|${page}|${userProfileId || "anon"}`;
}

function getSessionId() {
  if (typeof window === "undefined") return "server";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "sess_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function readLocalEvents() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(EVENT_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalEvents(events) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(events));
}

export function getLocalEvents() {
  return readLocalEvents();
}

export async function trackEvent(eventName, payload = {}) {
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const nowMs = nowDate.getTime();
  const page = payload.page || (typeof window !== "undefined" ? window.location.pathname : "unknown");
  const sessionId = getSessionId();
  const userProfileId = payload.userProfileId || null;

  // Prevent burst duplicates from rapid re-renders or repeated transitions.
  const dedupeKey = getEventDedupeKey(eventName, page, userProfileId);
  const lastEventAt = recentEventMap.get(dedupeKey) || 0;
  if (nowMs - lastEventAt < EVENT_DEDUPE_WINDOW_MS) {
    return;
  }
  recentEventMap.set(dedupeKey, nowMs);

  if (userProfileId) {
    // Keep profile sync, but throttle it to avoid posting profile data for every single event.
    const lastProfileSyncAt = profileSyncMap.get(userProfileId) || 0;
    if (nowMs - lastProfileSyncAt >= PROFILE_SYNC_MIN_INTERVAL_MS) {
      profileSyncMap.set(userProfileId, nowMs);
      ensureRemoteLeadProfile(userProfileId).catch((error) => {
        console.warn("trackEvent profile sync skipped:", error);
      });
    }
  }

  const localRecord = {
    id: "evt_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now(),
    eventName,
    userProfileId,
    sessionId,
    page,
    payload,
    createdAt: now,
  };

  const localEvents = readLocalEvents();
  localEvents.push(localRecord);
  writeLocalEvents(localEvents);

  // Send to PostHog
  if (typeof window !== "undefined") {
    posthog.capture(eventName, {
      ...payload,
      $current_url: page,
      session_id: sessionId,
      user_profile_id: userProfileId
    });
    
    // If we have a userProfileId, we can also identify them in PostHog
    if (userProfileId) {
      posthog.identify(userProfileId);
    }
  }

  if (!supabase) return;

  try {
    await postToServer("event", {
      event_name: eventName,
      user_profile_id: userProfileId || null,
      session_id: sessionId,
      page,
      payload,
      created_at: now,
    });
  } catch (err) {
    console.error("trackEvent server write failed:", err);
  }
}
