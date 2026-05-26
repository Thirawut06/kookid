import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)?.trim();
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET?.trim() || "";

function verifyToken(tokenBase64) {
  if (!tokenBase64) return false;
  try {
    const s = Buffer.from(tokenBase64, "base64").toString("utf8");
    const [expiryStr, sig] = s.split(".");
    if (!expiryStr || !sig) return false;
    const expected = createHmac("sha256", ADMIN_JWT_SECRET).update(expiryStr).digest("hex");
    if (expected !== sig) return false;
    const expiry = Number(expiryStr);
    if (Number.isNaN(expiry)) return false;
    return Date.now() < expiry;
  } catch (err) {
    console.error("verifyToken error", err);
    return false;
  }
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing env vars in data.js:", {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_SERVICE_KEY,
    });
    res.status(500).json({ error: "Supabase not configured on server", details: "Check server logs" });
    return;
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s*/i, "");
  if (!verifyToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Fetch the same datasets the client previously requested.
    const [profilesRes, interestsRes, quizResultsRes, eventsRes, quizCountRes] = await Promise.all([
      supabase.from("user_profiles").select("*"),
      supabase.from("program_interests").select("id,user_profile_id,major_id,university_id,created_at").order("created_at", { ascending: false }),
      supabase.from("quiz_results").select("user_profile_id,result,created_at").order("created_at", { ascending: false }),
      supabase.from("event_logs").select("event_name,created_at,user_profile_id,session_id,page,payload").order("created_at", { ascending: false }).limit(5000),
      supabase.from("quiz_results").select("id", { count: "exact", head: true }),
    ]);

    const errors = [profilesRes.error, interestsRes.error, quizResultsRes.error, eventsRes.error, quizCountRes.error].filter(Boolean);
    if (errors.length > 0) {
      throw errors[0];
    }

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      profiles: profilesRes.data || [],
      interests: interestsRes.data || [],
      quizResults: quizResultsRes.data || [],
      eventRows: eventsRes.data || [],
      quizCount: quizCountRes.count || 0,
    });
  } catch (err) {
    console.error("/api/admin/data error", err?.message || err);
    res.status(500).json({ error: "Failed to load admin data", details: err?.message || err });
  }
}
