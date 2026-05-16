import { supabase } from "@/utils/supabase";

const EVENT_STORAGE_KEY = "kookid_event_logs";
const SESSION_KEY = "kookid_session_id";

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
  const now = new Date().toISOString();
  const page = payload.page || (typeof window !== "undefined" ? window.location.pathname : "unknown");
  const sessionId = getSessionId();
  const userProfileId = payload.userProfileId || null;

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

  if (!supabase) return;

  const { error } = await supabase.from("event_logs").insert([
    {
      event_name: eventName,
      user_profile_id: userProfileId,
      session_id: sessionId,
      page,
      payload,
      created_at: now,
    },
  ]);

  if (error) {
    console.error("Supabase trackEvent error:", error);
  }
}
