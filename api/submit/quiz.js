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
    keyPrefix: "submit_quiz",
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

    // Expect payload: { user_profile_id, result }
    const record = {
      user_profile_id: payload.user_profile_id,
      result: payload.result,
      linked_at: payload.linked_at || new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from("quiz_results")
      .upsert([record], { onConflict: "user_profile_id" });

    // Handle foreign key constraint error if profile doesn't exist yet
    if (error && (error.code === "23503" || String(error.message).includes("foreign key"))) {
      await supabase.from("user_profiles").insert([{
        id: payload.user_profile_id,
        nickname: "Anonymous",
        consent_accepted: false,
        updated_at: new Date().toISOString(),
      }]);
      
      const retry = await supabase
        .from("quiz_results")
        .upsert([record], { onConflict: "user_profile_id" });
        
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("/api/submit/quiz supabase error", error);
      res.status(500).json({ error: error.message || String(error) });
      return;
    }

    res.status(200).json({ data });
  } catch (err) {
    console.error("/api/submit/quiz error", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
