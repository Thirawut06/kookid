import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit } from "../_lib/rateLimit.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!enforceRateLimit(req, res, {
    keyPrefix: "submit_career",
    limit: 30,
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
    const items = Array.isArray(payload) ? payload : [payload];
    
    if (items.length === 0) {
      return res.status(200).json({ data: [] });
    }

    const records = items.map(item => ({
      user_profile_id: item.user_profile_id,
      career_cluster_id: item.career_cluster_id,
      interest_level: item.interest_level || 0,
    }));

    const { data, error } = await supabase.from("career_feedback").insert(records);

    if (error) {
      console.error("/api/submit/career supabase error", error);
      res.status(500).json({ error: error.message || String(error) });
      return;
    }

    res.status(200).json({ data });
  } catch (err) {
    console.error("/api/submit/career error", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
