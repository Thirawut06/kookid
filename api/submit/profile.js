import { createClient } from "@supabase/supabase-js";

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

  if (!supabase) {
    res.status(500).json({ error: "Server not configured for Supabase writes" });
    return;
  }

  try {
    const payload = req.body || {};

    // Use upsert to create or update profile by primary key `id`.
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert([payload], { onConflict: "id" });

    if (error) {
      console.error("/api/submit/profile supabase error", error);
      res.status(500).json({ error: error.message || String(error) });
      return;
    }

    res.status(200).json({ data });
  } catch (err) {
    console.error("/api/submit/profile error", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
