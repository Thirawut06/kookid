import { createHmac } from "crypto";
import { enforceRateLimit } from "../_lib/rateLimit.js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "";
const TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

function signToken(expiresAt) {
  const payload = String(expiresAt);
  const sig = createHmac("sha256", ADMIN_JWT_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!enforceRateLimit(req, res, {
    keyPrefix: "admin_login",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  })) {
    return;
  }

  try {
    const body = req.body || {};
    const password = body.password || "";

    if (!ADMIN_PASSWORD || !ADMIN_JWT_SECRET) {
      res.status(500).json({ error: "Server not configured for admin auth" });
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const expiresAt = Date.now() + TOKEN_TTL_MS;
    const token = signToken(expiresAt);

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ token, expiresAt });
  } catch (err) {
    console.error("/api/admin/login error", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
