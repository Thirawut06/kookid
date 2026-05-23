import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit } from "../_lib/rateLimit.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!enforceRateLimit(req, res, {
    keyPrefix: "submit_event",
    limit: 240,
    windowMs: 60 * 1000,
  })) {
    return;
  }

  if (!supabase) {
    res.status(500).json({ error: "Server not configured for Supabase writes" });
    return;
  }

  try {
    const payload = req.body || {};

    const record = {
      event_name: payload.event_name,
      user_profile_id: payload.user_profile_id || null,
      session_id: payload.session_id || null,
      page: payload.page || null,
      payload: payload.payload || null,
      created_at: payload.created_at || new Date().toISOString(),
    };

    const { data, error } = await supabase.from("event_logs").insert([record]);

    if (error) {
      console.error("/api/submit/event supabase error", error);
      res.status(500).json({ error: error.message || String(error) });
      return;
    }

    res.status(200).json({ data });
  } catch (err) {
    console.error("/api/submit/event error", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
